# Plan-only tests with mocked providers: no AWS credentials or resources needed.
# Run from terraform/: terraform test
# Module inputs below mirror the values the root main.tf passes to each module.
mock_provider "aws" {
  mock_data "aws_region" {
    defaults = { region = "ap-southeast-1", name = "ap-southeast-1" }
  }
}
mock_provider "random" {}

run "application_scaling_and_https" {
  command = plan
  module {
    source = "./modules/application"
  }
  variables {
    name_prefix              = "test"
    vpc_id                   = "vpc-0123456789abcdef0"
    public_subnet_ids        = ["subnet-0aaaaaaaaaaaaaaa1", "subnet-0aaaaaaaaaaaaaaa2"]
    app_subnet_ids           = ["subnet-0bbbbbbbbbbbbbbb1", "subnet-0bbbbbbbbbbbbbbb2"]
    alb_security_group_id    = "sg-0123456789abcdef0"
    app_security_group_id    = "sg-0123456789abcdef1"
    db_endpoint              = "db.example.internal:3306"
    db_name                  = "wordpress"
    db_username              = "wpuser"
    db_secret_arn            = "arn:aws:secretsmanager:ap-southeast-1:111122223333:secret:test-abcdef"
    db_kms_key_arn           = "arn:aws:kms:ap-southeast-1:111122223333:key/00000000-0000-0000-0000-000000000000"
    website_domain           = "school.example.com"
    wordpress_version        = "7.1.4"
    ami_id                   = "ami-0123456789abcdef0"
    alb_certificate_arn      = "arn:aws:acm:ap-southeast-1:111122223333:certificate/replace-me"
    min_size                 = 1
    max_size                 = 4
    desired_capacity         = 1
    scale_out_cpu_threshold  = 80
    scale_in_cpu_threshold   = 40
    scale_evaluation_periods = 6
  }

  assert {
    condition     = aws_autoscaling_group.wordpress.min_size == 1 && aws_autoscaling_group.wordpress.max_size == 4
    error_message = "ASG must be min 1 / max 4."
  }
  assert {
    condition = (
      aws_cloudwatch_metric_alarm.cpu_high.comparison_operator == "GreaterThanThreshold" &&
      aws_cloudwatch_metric_alarm.cpu_high.threshold == 80 &&
      aws_cloudwatch_metric_alarm.cpu_high.period * aws_cloudwatch_metric_alarm.cpu_high.evaluation_periods == 1800
    )
    error_message = "Scale-out must trigger above 80% CPU for 30 minutes."
  }
  assert {
    condition = (
      aws_cloudwatch_metric_alarm.cpu_low.comparison_operator == "LessThanThreshold" &&
      aws_cloudwatch_metric_alarm.cpu_low.threshold == 40 &&
      aws_cloudwatch_metric_alarm.cpu_low.period * aws_cloudwatch_metric_alarm.cpu_low.evaluation_periods == 1800
    )
    error_message = "Scale-in must trigger below 40% CPU for 30 minutes."
  }
  assert {
    condition     = aws_lb_listener.https.protocol == "HTTPS" && aws_lb_listener.https.port == 443
    error_message = "ALB listener must be HTTPS/443."
  }
  assert {
    condition     = aws_lb.wordpress.enable_deletion_protection == true && aws_lb.wordpress.access_logs[0].enabled == true
    error_message = "ALB must have deletion protection and access logs."
  }
  assert {
    condition     = aws_launch_template.wordpress.network_interfaces[0].associate_public_ip_address == "false"
    error_message = "WordPress instances must not get public IPs."
  }
}

run "cdn_https_only" {
  command = plan
  module {
    source = "./modules/cdn"
  }
  variables {
    name_prefix            = "test"
    origin_domain_name     = "origin.school.example.com"
    website_domain         = "school.example.com"
    aliases                = ["school.example.com"]
    viewer_certificate_arn = "arn:aws:acm:us-east-1:111122223333:certificate/00000000-0000-0000-0000-000000000000"
    web_acl_arn            = "arn:aws:wafv2:us-east-1:111122223333:global/webacl/test/00000000-0000-0000-0000-000000000000"
  }
  assert {
    condition     = aws_cloudfront_distribution.this.default_cache_behavior[0].viewer_protocol_policy == "redirect-to-https"
    error_message = "CloudFront must redirect viewers to HTTPS."
  }
  assert {
    condition     = aws_cloudfront_distribution.this.restrictions[0].geo_restriction[0].restriction_type == "whitelist"
    error_message = "CloudFront geo restriction must be enabled."
  }
  assert {
    condition     = one(aws_cloudfront_distribution.this.origin).custom_origin_config[0].origin_protocol_policy == "https-only"
    error_message = "CloudFront must use HTTPS-only to the origin."
  }
}

run "database_private_and_encrypted" {
  command = plan
  module {
    source = "./modules/database"
  }
  variables {
    name_prefix          = "test"
    db_subnet_ids        = ["subnet-0ccccccccccccccc1", "subnet-0ccccccccccccccc2"]
    db_security_group_id = "sg-0123456789abcdef2"
  }
  assert {
    condition     = aws_db_instance.database.publicly_accessible == false && aws_db_instance.database.storage_encrypted == true && aws_db_instance.database.multi_az == true && aws_db_instance.database.deletion_protection == true
    error_message = "RDS must be private, encrypted, Multi-AZ and deletion protected."
  }
}
