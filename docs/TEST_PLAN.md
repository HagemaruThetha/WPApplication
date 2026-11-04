# Validation and Test Plan

## Evidence status

This package is a plan-level submission. No AWS resources have been applied and no live endpoint, load test, or access-denial test has been run. Formatting passed. Provider installation was blocked because this sandbox cannot connect to registry.terraform.io, so Terraform validation and plan could not run. The commands below separate checks that can run without provisioning from post-deployment checks. Never report an unrun test as passing.

## Static and plan-level checks

| Check | Method | Expected result | Result |
|---|---|---|---|
| Terraform formatting | `terraform fmt -check -recursive` from `terraform/` | No formatting changes required | **Passed** (all `.tf` files formatted) |
| WordPress startup script shell syntax | `bash -n terraform/modules/application/user_data.sh.tftpl` using Git for Windows Bash | Shell script parses without syntax errors | **Passed** |
| Terraform initialization | `terraform init -backend=false -input=false` | AWS/random provider and local modules initialize successfully | **Blocked**: sandbox network denied connection to registry.terraform.io while querying provider packages |
| Terraform syntax/schema | `terraform validate` | Configuration is valid | **Not completed**: AWS and random providers are unavailable because initialization was blocked |
| Resource and policy review | `terraform plan -refresh=false` with valid non-secret example inputs | Plan includes VPC, six subnets, NAT, NACLs, tier security groups, ALB, ASG, RDS, EFS, secret, IAM, and CloudFront; no public EC2/RDS | **Not completed**: no provider selections are installed/locked; plan cannot run before initialization |
| ASG bounds | Inspect plan for ASG values | `min_size=1`, `max_size=4`, desired capacity from 1 through 4 | Pending plan; code sets the requested bounds and validates min/max inputs |
| Scale-out alarm | Inspect plan for CloudWatch alarm | CPU `GreaterThanThreshold` 80%, period 300 seconds, 6 evaluation periods and 6 datapoints to alarm | Pending plan; code sets the specified threshold and 30-minute window |
| Scale-in alarm | Inspect plan for CloudWatch alarm | CPU `LessThanThreshold` 40%, period 300 seconds, 6 evaluation periods and 6 datapoints to alarm | Pending plan; code sets the specified threshold and 30-minute window |
| HTTPS configuration | Inspect ALB listeners and CloudFront distribution in plan | ALB has HTTPS listener; CloudFront enforces HTTPS to viewer and HTTPS-only origin | Pending plan; source config sets HTTPS listener and CloudFront HTTPS policies |
| Network reachability rules | Inspect security groups and NACLs in plan | ALB only from CloudFront prefix list; app only from ALB for HTTP; app DNS only to VPC CIDR; DB only from app on 3306; NACLs include needed return traffic | Pending plan; source config defines tier rules, DNS egress, and NACL return ranges |
| IAM and secret handling | Inspect IAM policy, secret resources, user data, ZIP contents | App role can read only the DB secret; no actual password in source/ZIP; state not packaged | **Partial**: ZIP inspection passed (24 expected files, no state/local vars/provider cache); plan-level IAM review awaits provider initialization |

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
- Before final submission, rerun initialization, validation, and planning from a network that can reach the Terraform Registry. Replace the blocked/pending results with the actual output. Preserve `Not run (no deployment)` for live checks unless they were actually executed.
