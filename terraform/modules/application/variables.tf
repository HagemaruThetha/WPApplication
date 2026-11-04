variable "name_prefix" {
  description = "Short prefix for resource names; keep within AWS name length limits."
  type        = string
}

variable "vpc_id" {
  description = "VPC ID for the ALB and EFS mount targets."
  type        = string
}

variable "public_subnet_ids" {
  description = "Public subnets used by the internet-facing ALB."
  type        = list(string)
}

variable "app_subnet_ids" {
  description = "Private application subnets used by EC2 and EFS mount targets."
  type        = list(string)
}

variable "alb_security_group_id" {
  description = "Security group for the ALB."
  type        = string
}

variable "app_security_group_id" {
  description = "Security group for WordPress EC2 instances."
  type        = string
}

variable "db_endpoint" {
  description = "RDS endpoint address, without a port suffix."
  type        = string
}

variable "db_name" {
  description = "WordPress database name."
  type        = string
}

variable "db_username" {
  description = "Database username stored in the secret JSON."
  type        = string
}

variable "website_domain" {
  description = "Website hostname used to set canonical HTTPS WordPress URLs."
  type        = string
}

variable "wordpress_version" {
  description = "Pinned stable WordPress release installed on every new instance."
  type        = string

  validation {
    condition     = can(regex("^[0-9]+\\.[0-9]+\\.[0-9]+$", var.wordpress_version))
    error_message = "wordpress_version must be an exact x.y.z release number."
  }
}

variable "db_secret_arn" {
  description = "Secrets Manager ARN containing a JSON password field."
  type        = string
}

variable "instance_type" {
  description = "EC2 instance type for WordPress."
  type        = string
  default     = "t3.micro"
}

variable "ami_id" {
  description = "Amazon Linux 2023 AMI ID for the target region."
  type        = string
}

variable "alb_certificate_arn" {
  description = "ACM certificate ARN in the ALB's region, covering the CloudFront origin hostname."
  type        = string
}

variable "scale_out_cpu_threshold" {
  description = "CPU percentage threshold that starts scale-out. The assessment requires 80%."
  type        = number
  default     = 80
  validation {
    condition     = var.scale_out_cpu_threshold == 80
    error_message = "The assessment requires a scale-out threshold of 80%."
  }
}

variable "scale_in_cpu_threshold" {
  description = "CPU percentage threshold that starts scale-in. The assessment requires 40%."
  type        = number
  default     = 40
  validation {
    condition     = var.scale_in_cpu_threshold == 40
    error_message = "The assessment requires a scale-in threshold of 40%."
  }
}

variable "scale_evaluation_periods" {
  description = "Number of consecutive five-minute periods required (six equals 30 minutes)."
  type        = number
  default     = 6
  validation {
    condition     = var.scale_evaluation_periods == 6
    error_message = "The assessment requires six consecutive five-minute periods (30 minutes)."
  }
}

variable "min_size" {
  description = "Minimum Auto Scaling Group capacity."
  type        = number
  default     = 1
  validation {
    condition     = var.min_size == 1
    error_message = "The assessment requires a minimum capacity of 1."
  }
}

variable "max_size" {
  description = "Maximum Auto Scaling Group capacity."
  type        = number
  default     = 4
  validation {
    condition     = var.max_size == 4
    error_message = "The assessment requires a maximum capacity of 4."
  }
}

variable "desired_capacity" {
  description = "Initial Auto Scaling Group capacity."
  type        = number
  default     = 1
}

variable "tags" {
  description = "Additional tags applied to resources that support tags."
  type        = map(string)
  default     = {}
}

variable "db_kms_key_arn" {
  description = "KMS key ARN encrypting the database secret; the instance role is allowed kms:Decrypt on it only."
  type        = string
}

variable "enable_deletion_protection" {
  description = "Enable ALB deletion protection. Set false before terraform destroy."
  type        = bool
  default     = true
}
