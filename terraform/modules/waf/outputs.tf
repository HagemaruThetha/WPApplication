output "web_acl_arn" {
  description = "ARN of the CloudFront-scope web ACL."
  value       = aws_wafv2_web_acl.this.arn
}
