# WordPress school-site demo

Contains sample pages and styling for the Harapan Bangsa School demo. The Terraform launch template downloads these files from a pinned repository revision, initializes WordPress on the AWS test hostname, and publishes the pages. Content is fictional and for assessment/demo use.

For an isolated local copy, run WordPress and MySQL in Docker:

```bash
cd demo
docker compose up -d                 # WordPress on http://localhost:8080 (finish the install form once)
./wp.sh core install --url=http://localhost:8080 --title="Harapan Bangsa School" \
  --admin_user=admin --admin_password='<choose-a-password>' --admin_email=admin@example.com --skip-email
python3 build_content.py             # regenerates content/*.html
# copy mu-plugins/school-style.php into wp-content/mu-plugins/, then create pages from content/*.html with ./wp.sh post create
docker compose down -v               # stop and delete everything
```

Passwords in `docker-compose.yml` are local demo-only values. The Docker copy does not exercise the AWS Terraform stack, ALB, CloudFront or autoscaling. The AWS test site is `https://assessment.zharifzhafran.xyz`; its generated admin credential is stored in the database secret in AWS Secrets Manager and must not be added to source control.
