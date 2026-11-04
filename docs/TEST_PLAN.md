# Validation and Test Plan

## Evidence status

No AWS resources have been applied; no live endpoint, load test, or access-denial test has been run. Static checks ran on Terraform v1.16.1 (AWS provider 6.62.0, random 3.9.1, lock file `terraform/.terraform.lock.hcl`). `terraform plan -refresh=false` used the example tfvars and dummy credentials with credential/account validation skipped (scratch-only override, not in the submission); result: **Plan: 96 to add, 0 to change, 0 to destroy**. Full output: [terraform-plan-output.txt](terraform-plan-output.txt). Plan review found and fixed two defects: an unescaped bash `${WORDPRESS_VERSION}` in the user-data template, and an `aws_efs_mount_target` `for_each` over apply-time subnet IDs (now `count`).

## Static and plan-level checks

| Check | Method | Expected result | Result |
|---|---|---|---|
| Terraform formatting | `terraform fmt -check -recursive` from `terraform/` | No formatting changes required | **Passed** (all `.tf` files formatted) |
| WordPress startup script shell syntax | `bash -n terraform/modules/application/user_data.sh.tftpl` using Git for Windows Bash | Shell script parses without syntax errors | **Passed** |
| Terraform initialization | `terraform init -backend=false -input=false` | AWS/random provider and local modules initialize successfully | **Passed** (providers installed, lock file generated) |
| Terraform syntax/schema | `terraform validate` | Configuration is valid | **Passed** (`Success! The configuration is valid.`) |
| Resource and policy review | `terraform plan -refresh=false` with valid non-secret example inputs | Plan includes VPC, six subnets, NAT, NACLs, tier security groups, ALB, ASG, RDS, EFS, secret, IAM, and CloudFront; no public EC2/RDS | **Passed**: 96 resources to add, 0 change, 0 destroy; RDS `publicly_accessible=false`, storage encrypted |
| ASG bounds | Inspect plan for ASG values | `min_size=1`, `max_size=4`, desired capacity from 1 through 4 | **Passed**: plan shows min_size=1, max_size=4 |
| Scale-out alarm | Inspect plan for CloudWatch alarm | CPU `GreaterThanThreshold` 80%, period 300 seconds, 6 evaluation periods and 6 datapoints to alarm | **Passed**: plan shows threshold, period 300, 6 evaluation periods, 6 datapoints |
| Scale-in alarm | Inspect plan for CloudWatch alarm | CPU `LessThanThreshold` 40%, period 300 seconds, 6 evaluation periods and 6 datapoints to alarm | **Passed**: plan shows threshold, period 300, 6 evaluation periods, 6 datapoints |
| HTTPS configuration | Inspect ALB listeners and CloudFront distribution in plan | ALB has HTTPS listener; CloudFront enforces HTTPS to viewer and HTTPS-only origin | **Passed**: plan shows ALB listener HTTPS/443, CloudFront `redirect-to-https`, origin `https-only` |
| Network reachability rules | Inspect security groups and NACLs in plan | ALB only from CloudFront prefix list; app only from ALB for HTTP; app DNS only to VPC CIDR; DB only from app on 3306; NACLs include needed return traffic | **Passed** (plan contains 4 SGs, 3 NACLs, per-tier rules); not exercised live |
| IAM and secret handling | Inspect IAM policy, secret resources, user data, ZIP contents | App role can read only the DB secret; no actual password in source/ZIP; state not packaged | **Partial**: ZIP inspection passed (24 expected files, no state/local vars/provider cache); plan includes one IAM role/inline policy scoped to the one secret |

## Automated tests and security scans (no AWS needed)

| Check | Command | Result |
|---|---|---|
| Terraform unit tests (mocked providers) | `terraform test` from `terraform/` (`plan.tftest.hcl`) | **Passed**: 3 passed, 0 failed. Asserts ASG min 1/max 4, scale-out >80% and scale-in <40% for 30 min, ALB HTTPS/443 with deletion protection and access logs, no public EC2 IPs, CloudFront redirect-to-HTTPS, HTTPS-only origin and geo restriction, RDS private, encrypted, Multi-AZ and deletion protected |
| IaC security scan | `checkov -d terraform --framework terraform` | **Passed**: 173 passed, 0 failed, 3 skipped with written justification (see below); [checkov-report.txt](checkov-report.txt) |
| IaC misconfiguration scan | `trivy config terraform` | **Passed**: no findings; accepted items carry `#trivy:ignore` with a reason; [trivy-report.txt](trivy-report.txt) |
| `tflint` | not run | Not installed (no Homebrew formula found); not run |

### Scan findings and how they were handled

Fixed in code: RDS Multi-AZ, deletion protection with final snapshot, enhanced monitoring and CloudWatch log exports; ALB deletion protection and S3 access logs; CloudFront access logs, WAFv2 (managed rules plus rate limit) and geo allowlist; customer-managed KMS keys for the database secret, EFS and VPC flow logs; VPC flow logs.

Skipped with justification (inline `checkov:skip` / `trivy:ignore`):
- CKV_AWS_310: single ALB origin, so CloudFront origin failover does not apply.
- CKV_AWS_161 / AWS-0176: WordPress cannot use RDS IAM authentication; credentials come from Secrets Manager.
- CKV_AWS_260: false positive; port 80 is allowed from the ALB security group, not 0.0.0.0/0.
- AWS-0053: ALB is internet-facing by design as the CloudFront origin; its security group allows only the CloudFront prefix list.
- AWS-0104: app instances need outbound 80/443 through NAT for OS and WordPress downloads.
- AWS-0133: Performance Insights is unsupported on db.t3.micro.
- AWS-0089 / AWS-0132: log-storage S3 buckets cannot log to themselves, and ELB/CloudFront log delivery needs SSE-S3.

Cost and teardown: Multi-AZ RDS, WAF and flow logs add cost. `deletion_protection` (default `true`) must be set to `false` and applied before `terraform destroy`.

## Post-deployment functional and security checks

Only run these if AWS resources are deliberately deployed. The assessment does not require deployment.

| Check | Method | Expected result | Result |
|---|---|---|---|
| Website TLS | Open the configured website hostname over HTTPS | Valid certificate and WordPress response; CloudFront redirects viewer HTTP to HTTPS | Not run (no deployment) |
| PHP and permalinks | Check `php-fpm` and `httpd` services, then request a WordPress pretty permalink | Both services are active; Apache applies WordPress rewrite rules and page returns successfully | Not run (no deployment) |
| CloudFront origin TLS | Request the site through CloudFront; inspect response/errors | CloudFront reaches the ALB over HTTPS; no certificate mismatch/502 | Not run (no deployment) |
| ALB target health | Check target group health | At least one WordPress EC2 target is healthy | Not run (no deployment) |
| Database connectivity | Check WordPress page load and app logs; verify DB SG source | WordPress can connect to RDS; unrelated sources cannot reach MySQL | Not run (no deployment) |
| Shared media | Upload a test image, then access from another ASG instance | Upload is available across instances through EFS | Not run (no deployment) |
| Cross-instance login/session | Sign in through CloudFront, then repeat authenticated requests while routing across different ASG targets | Login cookie, nonce, and authenticated state remain valid across instances | Not run (no deployment) |
| Consistent code | Inspect launched instances and attempt a dashboard plugin/theme update | Each instance runs the pinned WordPress version; dashboard file updates are disabled and code changes require a consistent redeployment | Not run (no deployment) |
| Scale out | Sustain average CPU above 80% for 30 minutes, then inspect ASG activity | ASG adds one instance and never exceeds four | Not run (no deployment) |
| Scale in | Sustain average CPU below 40% for 30 minutes, then inspect ASG activity | ASG removes one instance and never drops below one | Not run (no deployment) |
| Direct origin restriction | Attempt ALB access outside CloudFront source ranges | Request is blocked by ALB security group | Not run (no deployment) |
| NACL/security-group restrictions | Attempt direct EC2/RDS access from an unapproved source | Unapproved connections fail | Not run (no deployment) |

## Reviewer notes

- CloudFront needs a valid origin hostname and matching ALB certificate for origin HTTPS. If custom viewer aliases are used, their certificate must be attached to CloudFront from ACM in `us-east-1`.
- The sample tfvars file contains deliberately fake IDs and ARNs. It is not an apply-ready environment configuration.
- Terraform state and provider plan files may contain sensitive values; keep them out of source control and the ZIP.
- Plan was run with dummy credentials and fake IDs; rerun with real values and AWS credentials before deploying. Preserve `Not run (no deployment)` for live checks unless actually executed.
