variable "name_prefix" {
  description = "Short prefix applied to resource names and tags."
  type        = string
}

variable "vpc_cidr" {
  description = "IPv4 CIDR for the VPC. A /16 is recommended for the six /24 subnets created by this module."
  type        = string
  default     = "10.20.0.0/16"
}

variable "availability_zones" {
  description = "Exactly two Availability Zones to use for public, application, and database subnets."
  type        = list(string)

  validation {
    condition     = length(var.availability_zones) == 2 && length(distinct(var.availability_zones)) == 2
    error_message = "Provide exactly two distinct Availability Zones."
  }
}

variable "tags" {
  description = "Additional tags applied to network resources."
  type        = map(string)
  default     = {}
}

variable "cloudfront_prefix_list_id" {
  description = "AWS-managed CloudFront origin-facing IPv4 prefix list ID in the deployment region."
  type        = string
}
