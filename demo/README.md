# Local WordPress demo (not part of the Terraform deployment)

Runs a school website on WordPress and MySQL in Docker so the application and database tiers can be seen working without AWS.

```bash
cd demo
docker compose up -d                 # WordPress on http://localhost:8080 (finish the install form once)
./wp.sh core install --url=http://localhost:8080 --title="Harapan Bangsa School" \
  --admin_user=admin --admin_password='<choose-a-password>' --admin_email=admin@example.com --skip-email
python3 build_content.py             # regenerates content/*.html
# copy mu-plugins/school-style.php into wp-content/mu-plugins/, then create pages from content/*.html with ./wp.sh post create
docker compose down -v               # stop and delete everything
```

Passwords in `docker-compose.yml` are demo-only values. This demo does not exercise the Terraform code, ALB, CloudFront or autoscaling.
