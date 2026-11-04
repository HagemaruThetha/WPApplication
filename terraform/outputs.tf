output "website_url" {
  description = "HTTPS URL for the configured website hostname."
  value       = "https://${var.website_domain}"
}

output "cloudfront_domain_name" {
  description = "CloudFront distribution hostname."
  value       = module.cdn.domain_name
}

output "alb_dns_name" {
  description = "Application Load Balancer hostname (origin)."
  value       = module.application.alb_dns_name
}

output "autoscaling_group_name" {
  description = "WordPress Auto Scaling Group name."
  value       = module.application.asg_name
}
