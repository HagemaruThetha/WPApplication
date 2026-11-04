# Live verification runbook

Steps to close the three checks still marked **Pending** in [TEST_PLAN.md](TEST_PLAN.md). They need access to the AWS account that hosts the test deployment, so they are written for the person who owns it. Record each result in the test plan afterwards.

## 0. Automated read-only checks

```bash
scripts/verify-live.sh https://<site-hostname>
```

Checks the homepage and four subpages, HTTP-to-HTTPS redirect, TLS validity and the WAF block. It sends no credentials.

## 1. WordPress admin login

1. Read the generated admin credentials from the database secret in AWS Secrets Manager (`<name_prefix>/wordpress/database`, keys `site_admin_username` and `site_admin_password`).
2. Open `https://<site-hostname>/wp-login.php`, sign in, and confirm the dashboard loads.
3. Expected: login succeeds over HTTPS. Record: pass/fail and date.

## 2. Shared media across instances

1. In Auto Scaling, set desired capacity to 2 and wait for both instances to be healthy in the target group.
2. In WordPress, upload an image under Media.
3. Request the image URL repeatedly (`curl -s -o /dev/null -w '%{http_code}\n' <image-url>`, about 20 times). Both instances serve requests; every response must be 200.
4. Expected: the file is served regardless of which instance answers (EFS-backed `wp-content/uploads`). Return desired capacity to 1 afterwards.

## 3. Cross-instance login and session

1. With 2 healthy instances, sign in to `/wp-admin/` and keep the session cookie.
2. Reload several admin pages 20 or more times (or `curl` with the cookie jar). All must stay logged in, with no redirects to `wp-login.php`.
3. Expected: the shared authentication keys and salts in Secrets Manager keep sessions valid on every instance.

## 4. Apply the pending NACL rule

```bash
cd terraform
terraform plan   # expect one added network ACL rule per app subnet (HTTP from app subnets to NAT in the public NACL)
terraform apply
```

## 5. Teardown

Set `deletion_protection = false` in `terraform.tfvars`, apply, then `terraform destroy`. This removes RDS and ALB deletion protection first, otherwise destroy is refused.
