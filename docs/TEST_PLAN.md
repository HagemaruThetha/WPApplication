# Validation and Test Plan

## Evidence status

Static checks ran on Terraform v1.16.1 (AWS provider 6.62.0, random 3.9.1). A real test deployment was applied in AWS account `<account-id-redacted>`, region `ap-southeast-1`, then destroyed with `terraform destroy` on November 5, 2026: **97 Terraform-managed resources destroyed**. The AWS stack and WordPress database are currently absent. The site had used `https://assessment.zharifzhafran.xyz`; apex and `www` DNS were left unchanged. The ACM certificates and their validation records were retained for the next apply. Exabytes `assessment` and `origin` CNAMEs still point to the deleted CloudFront distribution and ALB; update them after Terraform recreates those endpoints. The local state and ignored `terraform.tfvars` were retained in the existing checkout. Three customer-managed KMS keys are scheduled for deletion after AWS's 7-day waiting period (November 12, 2026). Before teardown, the homepage and all subpages were verified. A final NACL rule for HTTP from app subnets to NAT gateways was added in code and validated, but was not applied to the destroyed stack; the next apply will include it.

## Static and plan-level checks

| Check | Method | Expected result | Result |
|---|---|---|---|
| Terraform formatting | `terraform fmt -check -recursive` from `terraform/` | No formatting changes required | **Passed** (rerun after the live hostname change) |
| WordPress startup script shell syntax | `bash -n terraform/modules/application/user_data.sh.tftpl` using Git for Windows Bash | Shell script parses without syntax errors | **Passed** |
| Terraform initialization | `terraform init -backend=false -input=false` | AWS/random provider and local modules initialize successfully | **Passed** |
| Terraform syntax/schema | `terraform validate` | Configuration is valid | **Passed** (rerun after the live hostname change) |
| Resource and policy review | `terraform plan -refresh=false` with valid non-secret example inputs | Plan includes VPC, six subnets, NAT, NACLs, tier security groups, ALB, ASG, RDS, EFS, secret, IAM, and CloudFront; no public EC2/RDS | **Passed**: 97 resources to add, 0 change, 0 destroy; RDS `publicly_accessible=false`, storage encrypted |
| ASG bounds | Inspect plan for ASG values | `min_size=1`, `max_size=4`, desired capacity from 1 through 4 | **Passed**: plan shows min_size=1, max_size=4 |
| Scale-out alarm | Inspect plan for CloudWatch alarm | CPU `GreaterThanThreshold` 80%, period 300 seconds, 6 evaluation periods and 6 datapoints to alarm | **Passed**: plan shows threshold, period 300, 6 evaluation periods, 6 datapoints |
| Scale-in alarm | Inspect plan for CloudWatch alarm | CPU `LessThanThreshold` 40%, period 300 seconds, 6 evaluation periods and 6 datapoints to alarm | **Passed**: plan shows threshold, period 300, 6 evaluation periods, 6 datapoints |
| HTTPS configuration | Inspect ALB listeners and CloudFront distribution in plan | ALB has HTTPS listener; CloudFront enforces HTTPS to viewer and HTTPS-only origin | **Passed**: plan shows ALB listener HTTPS/443, CloudFront `redirect-to-https`, origin `https-only` |
| Network reachability rules | Inspect deployed security groups and NACLs | ALB only from CloudFront prefix list; app only from ALB for HTTP; DB only from app on 3306 | **Passed**: deployed rules inspected; direct ALB request from public client timed out as expected |
| IAM and secret handling | Inspect IAM policy and user data | App role reads only its DB secret; secret values are not embedded in launch user data | **Passed**: user data retrieves the DB secret at boot; no public EC2 IPs |

## Automated tests and security scans (no AWS needed)

| Check | Command | Result |
|---|---|---|
| Terraform unit tests (mocked providers) | `terraform test` from `terraform/` (`plan.tftest.hcl`) | **Passed on final configuration**: 3 passed, 0 failed. Asserts ASG min 1/max 4, scale-out >80% and scale-in <40% for 30 min, ALB HTTPS/443 with deletion protection and access logs, no public EC2 IPs, CloudFront redirect-to-HTTPS, HTTPS-only origin and geo restriction, RDS private, encrypted, Multi-AZ and deletion protected |
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

The following are historical live checks performed before teardown. They do not indicate that the AWS endpoint is currently available. The homepage and all four subpages rendered the demo content before teardown. Authenticated admin flows and media-upload checks remain pending; the steps to close them are in [LIVE_VERIFICATION.md](LIVE_VERIFICATION.md).

| Check | Method | Expected result | Result |
|---|---|---|---|
| DNS and CloudFront alias | Resolve `assessment.zharifzhafran.xyz` and inspect distribution | DNS aliases CloudFront; distribution is deployed with the test alias | **Passed**: CNAME resolves to `d1azyxn7hsmugw.cloudfront.net`; status `Deployed` |
| Viewer TLS and HTTP redirect | `curl -I https://assessment.zharifzhafran.xyz` and HTTP URL | Valid certificate, HTTPS response; HTTP redirects to HTTPS | **Passed**: TLS verify result 0; HTTP returned 301 to HTTPS |
| WordPress/PHP and DB connection | Request homepage through CloudFront | WordPress serves the configured demo homepage without PHP or DB errors | **Passed**: homepage returned HTTP 200 with demo content and school styling |
| Automated live checks | `scripts/verify-live.sh https://assessment.zharifzhafran.xyz` | Homepage and subpages 200, HTTP 301 to HTTPS, valid TLS, WAF 403 | **Passed** (rerun 5 Nov 2026): 9 passed, 0 failed |
| Demo subpages/permalinks | Request `/about/`, `/academics/`, `/admissions/`, and `/contact/` | Each page returns HTTP 200 | **Passed** (rechecked 5 Nov 2026): `/`, `/about/`, `/academics/`, `/admissions/`, `/contact/` all returned HTTP 200 |
| Canonical hostname | Inspect the homepage and page links | Site links use assessment test hostname | **Passed** on homepage and subpages |
| WAF | Request a script-injection query | WAF blocks the request | **Passed**: probe returned 403 |
| CloudFront origin TLS | Request through CloudFront and inspect status/headers | HTTPS origin works without certificate mismatch or 502 | **Passed**: WordPress response served through CloudFront |
| ALB target health | Inspect target group health | At least one WordPress EC2 target is healthy | **Passed before teardown**: latest refresh completed with one healthy instance |
| RDS configuration | Inspect RDS status and attributes | Available, Multi-AZ, encrypted, not public | **Passed** |
| EFS configuration | Inspect file system and mount targets | Encrypted file system and mount targets in both AZs | **Passed** |
| Log bucket protections | Inspect public access block and encryption | Buckets are private with server-side encryption | **Passed** |
| ASG scale-out/scale-in action | Force CloudWatch alarms to ALARM and inspect ASG | One instance launches and later terminates; capacity respects bounds | **Passed as an action-path check**: forced alarm state scaled 1→2→1 and replacement target became healthy. This did not verify 30-minute CPU thresholds |
| Direct origin restriction | Attempt ALB access outside CloudFront source ranges | Request is blocked by ALB security group | **Passed**: public-client connection timed out |
| WordPress admin login | Sign in using the generated test-admin credentials | Admin login succeeds | **Not tested**: the admin credential and database secret were destroyed with the stack |
| Shared media across instances | Upload media, then access from another ASG instance | Upload is available across instances through EFS | **Pending**: requires a configured WordPress site and upload |
| Cross-instance login/session | Sign in and route authenticated requests across ASG targets | Login cookie, nonce, and authenticated state remain valid across instances | **Pending**: requires an admin account and multi-instance traffic |
| Sustained CPU scaling thresholds | Hold average CPU above 80% or below 40% for 30 minutes | ASG scales by one and respects bounds | **Not run**: alarm actions were forced; sustained CPU duration was not tested |
| Private EC2/RDS reachability from unapproved source | Probe from an unapproved network | Connections are blocked | **Not separately probed**; deployed security-group rules were inspected |

## Reviewer notes

- CloudFront needs a valid origin hostname and matching ALB certificate for origin HTTPS. If custom viewer aliases are used, their certificate must be attached to CloudFront from ACM in `us-east-1`.
- `terraform.tfvars` contains real environment inputs and is intentionally gitignored. It must not be committed.
- Terraform state and provider plan files may contain sensitive values; keep them out of source control and the ZIP.
- The live endpoint is for assessment testing. Complete WordPress first-run setup before testing admin, login, permalinks or uploads.
