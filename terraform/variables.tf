variable "aws_region" {
  description = "AWS region for regional resources. The CloudFront viewer certificate, when used, must be in us-east-1."
  type        = string
  default     = "ap-southeast-1"
}

variable "project_name" {
  description = "Lowercase prefix used to name resources."
  type        = string
  default     = "school-site"
}

variable "environment" {
  description = "Environment label and resource-name suffix."
  type        = string
  default     = "assessment"
}

variable "vpc_cidr" {
  description = "CIDR block for the VPC."
  type        = string
  default     = "10.40.0.0/16"
}

variable "availability_zones" {
  description = "Two AZ names available in aws_region, in app subnet order."
  type        = list(string)
  default     = ["ap-southeast-1a", "ap-southeast-1b"]
  validation {
    condition     = length(var.availability_zones) == 2
    error_message = "Provide exactly two availability zones."
  }
}

variable "cloudfront_prefix_list_id" {
  description = "Region-specific ID of AWS's CloudFront origin-facing managed prefix list, used to restrict ALB ingress."
  type        = string
}

variable "db_name" {
  description = "Initial WordPress database name."
  type        = string
  default     = "wordpress"
}

variable "db_username" {
  description = "RDS master username; a generated password is stored in Secrets Manager."
  type        = string
  default     = "wpadmin"
}

variable "db_instance_class" {
  description = "RDS MySQL instance class. Adjust for the target account and budget."
  type        = string
  default     = "db.t3.micro"
}

variable "db_allocated_storage" {
  description = "Initial RDS allocated storage in GiB."
  type        = number
  default     = 20
}

variable "db_backup_retention_days" {
  description = "RDS automated backup retention in days."
  type        = number
  default     = 7
}

variable "db_multi_az" {
  description = "Enable a standby RDS instance for higher availability (increases cost)."
  type        = bool
  default     = false
}

variable "instance_type" {
  description = "EC2 instance type for the WordPress Auto Scaling Group."
  type        = string
  default     = "t3.micro"
}

variable "ami_id" {
  description = "Amazon Linux 2023 AMI ID valid in aws_region. Supply a current account/region value."
  type        = string
}

variable "desired_capacity" {
  description = "Initial desired ASG capacity; must be between one and four."
  type        = number
  default     = 1
  validation {
    condition     = var.desired_capacity >= 1 && var.desired_capacity <= 4
    error_message = "desired_capacity must be between 1 and 4."
  }
}

variable "website_domain" {
  description = "Canonical WordPress website hostname, for example school.example.com."
  type        = string
}

variable "wordpress_version" {
  description = "Pinned stable WordPress version installed on every new ASG instance."
  type        = string
  default     = "7.1.4"
}

variable "alb_certificate_arn" {
  description = "ACM certificate ARN in aws_region covering the CloudFront origin hostname."
  type        = string
}

variable "cloudfront_origin_domain_name" {
  description = "DNS hostname routed to the ALB and covered by its certificate (for example origin.school.example.com)."
  type        = string
}

variable "cloudfront_aliases" {
  description = "Required CloudFront viewer hostnames; must include website_domain and have a matching viewer certificate ARN."
  type        = list(string)
}

variable "cloudfront_viewer_certificate_arn" {
  description = "Required ACM certificate ARN in us-east-1 covering cloudfront_aliases."
  type        = string
}
