variable "name_prefix" {
  description = "Prefix used for the CloudFront distribution comment and origin ID."
  type        = string
}

variable "origin_domain_name" {
  description = "DNS name resolving to the ALB and covered by the ALB's TLS certificate."
  type        = string
}

variable "website_domain" {
  description = "Canonical WordPress hostname; it must be one of the CloudFront aliases."
  type        = string
}

variable "aliases" {
  description = "Required viewer hostnames; must include website_domain and be covered by viewer_certificate_arn."
  type        = list(string)
}

variable "viewer_certificate_arn" {
  description = "Required ACM certificate ARN in us-east-1 covering all viewer aliases."
  type        = string
}

variable "tags" {
  description = "Tags applied to supported resources."
  type        = map(string)
  default     = {}
}

variable "geo_allowlist" {
  description = "ISO country codes allowed to reach the site. Empty list disables geo restriction."
  type        = list(string)
  default     = ["ID", "SG", "MY"]
}

variable "web_acl_arn" {
  description = "ARN of a CLOUDFRONT-scope WAFv2 web ACL to attach."
  type        = string
}
