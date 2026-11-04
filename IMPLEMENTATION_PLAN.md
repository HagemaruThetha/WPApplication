# Xtremax Cloud Engineer Assessment — Implementation Plan

## Goal and scope

Build a reviewable Terraform solution for a WordPress school website on AWS, plus the diagrams, documentation, validation evidence, and submission package requested in the assessment. Keep the implementation small and explain decisions that the assessment leaves open. A live AWS deployment is optional; a Terraform plan is acceptable evidence.

## Decisions to state up front

1. **Tier wording:** The brief calls the workload both “two-tier” and “three-tier.” In this plan, show CloudFront as the edge delivery layer, the ALB and WordPress EC2 Auto Scaling Group as the web/application layer, and RDS MySQL as the data layer. Note this interpretation in the report; show network and security boundaries separately.
2. **WordPress files:** An Auto Scaling Group can replace or add EC2 instances, so instance-local uploads alone are not durable or shared. Include EFS for shared WordPress uploads as the simplest explicit solution, or document a deliberate alternative. EFS is a design choice to make the stated scaling requirement work reliably; the brief does not explicitly name it.
3. **Domain and certificates:** The brief does not supply a domain or certificate ARNs. Make these configurable inputs and document that real HTTPS validation needs valid certificates and a domain. If using custom domains, use a viewer certificate for CloudFront in `us-east-1`; use an origin DNS name that matches the certificate presented by the ALB. The assessment may use placeholders for planning, but do not invent real values or commit private keys/secrets. See [CloudFront certificate requirements](https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/cnames-and-https-requirements.html) and [HTTPS to a custom origin](https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/using-https-cloudfront-to-custom-origin.html).
4. **Deployment evidence:** Prefer Terraform formatting, validation, and plan output if AWS deployment is unavailable. Label post-deployment checks as planned rather than passed unless they were actually run.

## Target architecture

```text
Visitors
   |
   v  HTTPS
CloudFront (edge/CDN; viewer HTTPS)
   |
   v  HTTPS to origin using a matching origin certificate
Public ALB (HTTPS listener; forwards to healthy targets)
   |
   v  application traffic
Private WordPress EC2 Auto Scaling Group (min 1, max 4)
   |                         |
   | MySQL                   +---- shared WordPress uploads on EFS
   v
Private RDS MySQL
```

Place the ALB in public subnets; place EC2, EFS mount targets, and RDS in private subnets. Use a VPC with at least two availability zones. Do not assign public IP addresses to EC2 or RDS. The network module owns the ALB, app, and database security groups so that their source relationships are defined once and modules do not depend on each other cyclically. Configure network ACLs to allow required application flows and their return/ephemeral traffic while denying unrelated traffic. Describe any simplified NACL rules plainly.

## Terraform layout and module contracts

Keep one root configuration and four focused modules. The root passes network IDs and other outputs between modules. Keep shared naming, tags, region, and environment inputs at the root.

```text
terraform/
  main.tf
  variables.tf
  terraform.tfvars.example
  outputs.tf
  versions.tf
  modules/
    network/
    database/
    application/
    cdn/
```

Do not put actual passwords, private keys, or account-specific secrets in the ZIP. Include an example tfvars file with placeholders only, and keep any Terraform state that may contain sensitive values out of source control and the submission ZIP. Keep a README with the commands and prerequisites.

| Module | Owns | Example inputs | Example outputs |
|---|---|---|---|
| `network` | VPC, public/private subnets across two AZs, routing, network ACLs, ALB/app/database security groups and their tier-to-tier rules | region, CIDR ranges, AZ count, tags | VPC ID, public subnet IDs, private app subnet IDs, private DB subnet IDs, ALB/app/database security group IDs |
| `database` | RDS MySQL instance and subnet group | VPC/private DB subnet IDs, database security group ID, engine settings, instance sizing, backup settings, credential input/reference | DB endpoint, port |
| `application` | ALB/listener/target group, launch template, EC2 IAM role/profile, ASG, scaling policies and alarms, WordPress instances, EFS and mount targets | VPC/subnets, ALB/app security group IDs, instance settings, min/max capacity, CPU thresholds/duration, DB endpoint, WordPress image/bootstrap inputs | ALB DNS name, ASG name, EFS ID |
| `cdn` | CloudFront distribution and origin configuration | ALB DNS name, domain/certificate inputs, cache/HTTPS settings | CloudFront domain name and distribution ID |

Use module inputs rather than hard-coding cross-module resource IDs. Keep outputs limited to values useful for wiring, verification, or the final report. If implementation constraints make EFS unnecessary (for example, an explicitly stated immutable-content workflow), document that exception instead of silently relying on local instance disks.

## Implementation phases

### Phase 1 — Set up the submission and assumptions

- Create the Terraform directory and version-control the work.
- Record the four assumptions above in the README/report.
- Draw the system diagram and module diagram before implementation.
- Define variables for region, environment/name prefix, CIDRs, instance type, database sizing, domain/certificate inputs, and scaling values. Supply safe examples, not secrets.

**Done when:** The architecture, tier interpretation, stateful file approach, and missing domain/certificate inputs are documented.

### Phase 2 — Build network and database foundations

- Create the VPC and public/private subnets across two AZs.
- Add routing and NACL rules needed for the stated flows; keep EC2 and RDS private.
- Create RDS MySQL in private subnets with a non-public endpoint, encryption, backups, and the database security group allowing MySQL only from the WordPress app security group.
- Handle DB credentials through a sensitive input or managed secret reference; never commit actual credentials. Document that Terraform state may contain sensitive values and must also be protected.

**Done when:** The network outputs are usable by the application/database modules, and the database has no public route or broad inbound access.

### Phase 3 — Build the WordPress application tier

- Create an ALB in public subnets with an HTTPS listener and certificate input; redirect HTTP to HTTPS if an HTTP listener is included.
- Create a target group and health check for the WordPress service.
- Create an EC2 launch template and Auto Scaling Group in private app subnets. Set minimum capacity to **1** and maximum to **4** (and choose a desired capacity within that range).
- Configure instance bootstrapping to install a pinned WordPress release, start PHP-FPM and Apache, enable `.htaccess` rewrites, generate authentication salts, and connect to RDS. Ensure credentials are not embedded in user data outputs, source control, or logs.
- Add shared WordPress uploads using EFS, mounted by instances, so traffic can move among scaled instances without losing access to uploads. Disable dashboard code edits/updates and deploy plugin/theme changes consistently so instances do not diverge.
- Give EC2 an IAM instance role with only the permissions needed for the chosen bootstrap/secret access and logging approach.
- Create scale-out and scale-in policies driven by CPU alarms. Use CloudWatch CPU metrics with a 5-minute period and **6 consecutive periods** (30 minutes): scale out when CPU is **greater than 80%**, scale in when CPU is **less than 40%**. Set scaling actions to change capacity one instance at a time and ensure the ASG limits remain 1–4.

**Done when:** ALB can reach healthy targets; EC2 and RDS remain private; WordPress dependencies and scaling conditions are explicit.

### Phase 4 — Add CloudFront and close the security path

- Create CloudFront with the ALB as its origin and HTTPS for viewer connections and the origin connection.
- Pass viewer domain/certificate and origin domain/certificate values as inputs; the HTTPS certificate on the origin must match the domain CloudFront uses to connect to that origin. A custom CloudFront viewer certificate from ACM must be in `us-east-1`. Explain the certificate and DNS prerequisites in the README.
- Configure caching deliberately for a WordPress site; avoid caching authenticated/admin or otherwise dynamic responses unintentionally.
- Limit ALB ingress to the intended web entry path where practical and document the origin protection choice. Restrict EC2 ingress to the ALB security group and RDS ingress to the app security group.
- Keep outbound rules scoped to required dependencies where practical; ensure NACL return traffic is not accidentally blocked.

**Done when:** The expected end-to-end HTTPS path and allowed network flows are documented and represented in Terraform.

### Phase 5 — Validate and record results

Run and record, from the Terraform root:

1. `terraform fmt -check -recursive`
2. `terraform init -backend=false` (or the documented init command if a backend is configured)
3. `terraform validate`
4. `terraform plan` with example non-secret inputs, or a documented variable file supplied locally.

Review the plan manually for the expected resources and security posture. Do not apply unless a real deployment is intentionally undertaken. If deployed, additionally test HTTPS response, ALB target health, WordPress-to-RDS connectivity, an upload visible across instances, scale-out after the sustained high-CPU condition, scale-in after the sustained low-CPU condition, and denial of direct/unapproved DB access. Record actual outcome, evidence, and any deviations; mark unrun live tests “not run” rather than “passed.”

**Done when:** The report contains command outcomes and a test matrix that distinguishes executed checks from planned live checks.

### Phase 6 — Package and submission review

- Complete the architecture diagram and the Terraform module tree diagram.
- Document every module’s purpose, inputs, outputs, key settings, and security controls.
- Include prerequisites, how to provide variables safely, and exact plan/validation commands.
- Include Terraform files in a ZIP. Also include the documentation, diagrams, test plan/results, and plan evidence as appropriate so the recruiter receives the deliverables together.
- Check that the ZIP opens, contains no real secrets or unnecessary generated state, and includes all required files.
- Send all deliverables in one email by the assessment deadline: **within 4 days of receiving the test case**.

**Done when:** The package is complete, opens correctly, and is ready for the single-email submission. Sending the email itself is the candidate’s final action.

## Requirement-by-requirement completion checklist

| Assessment requirement | Implementation/evidence | Check |
|---|---|---|
| Terraform provisions infrastructure repeatably and under version control | Root Terraform plus focused modules; README commands | [ ] |
| CloudFront included with HTTPS | `cdn` module; viewer HTTPS and HTTPS to ALB origin documented | [ ] |
| ALB included with HTTPS | `application` module; HTTPS listener/certificate input documented | [ ] |
| WordPress EC2 instances managed by Auto Scaling Group | Launch template and ASG in private app subnets | [ ] |
| Minimum 1, maximum 4 instances | ASG min/max values explicitly set and plan reviewed | [ ] |
| Scale out above 80% CPU sustained for 30 minutes | CPU alarm: >80%, 6 x 5-minute periods; scale-out policy | [ ] |
| Scale in below 40% CPU sustained for 30 minutes | CPU alarm: <40%, 6 x 5-minute periods; scale-in policy | [ ] |
| RDS MySQL stores website data securely | Private RDS MySQL, restricted app-only access, backups/encryption described | [ ] |
| Security groups and NACLs restrict EC2/RDS traffic | Traffic matrix/rules documented; plan checked for broad access | [ ] |
| IAM roles/policies use least privilege | EC2 role limited to documented runtime needs | [ ] |
| Architecture/config/security documentation | README or report covers components, settings, assumptions, and controls | [ ] |
| Test plan and results for functionality/security | Test matrix records expected and actual result; unrun tests clearly labeled | [ ] |
| System architecture diagram | Included in report | [ ] |
| Terraform module structure diagram | Included in report | [ ] |
| Each module described with inputs and outputs | Module table completed and matches code | [ ] |
| Terraform files in ZIP | ZIP created and contents verified | [ ] |
| All deliverables sent in one email | Submission bundle ready for one email | [ ] |
| Report submitted within four days of receipt | Candidate tracks received date and submits by deadline | [ ] |
| Real AWS deployment not required | Terraform plan output retained as acceptable evidence when not deployed | [ ] |

## Final review gate

Before packaging, verify the diagram and Terraform agree; min/max and CPU threshold/duration values match everywhere; HTTPS is shown for both CloudFront and ALB; EC2 and RDS are not public; only intended paths are allowed; secrets are absent from the ZIP; module inputs/outputs match the code; and each test result is honestly labeled as executed or not run.
