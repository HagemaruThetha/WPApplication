output "distribution_id" {
  description = "CloudFront distribution ID."
  value       = aws_cloudfront_distribution.this.id
}

output "domain_name" {
  description = "CloudFront-generated distribution hostname."
  value       = aws_cloudfront_distribution.this.domain_name
}
