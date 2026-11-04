variable "name_prefix" {
  description = "Lowercase prefix used for database and secret names."
  type        = string
}

variable "db_name" {
  description = "Initial WordPress database name."
  type        = string
  default     = "wordpress"
}

variable "db_username" {
  description = "RDS master username. The password is generated and stored in Secrets Manager."
  type        = string
  default     = "wpadmin"
}

variable "db_subnet_ids" {
  description = "Subnet IDs for the private RDS DB subnet group (use at least two AZs)."
  type        = list(string)

  validation {
    condition     = length(var.db_subnet_ids) >= 2
    error_message = "RDS requires at least two subnet IDs in the DB subnet group."
  }
}

variable "db_security_group_id" {
  description = "Security group allowing MySQL only from the WordPress application security group."
  type        = string
}

variable "db_instance_class" {
  description = "RDS instance class. Use a small class for assessment planning."
  type        = string
  default     = "db.t3.micro"
}

variable "engine_version" {
  description = "Optional MySQL engine version; null selects the AWS default version."
  type        = string
  default     = null
  nullable    = true
}

variable "db_allocated_storage" {
  description = "Initial allocated storage in GiB."
  type        = number
  default     = 20
}

variable "max_allocated_storage" {
  description = "Upper bound for RDS storage autoscaling in GiB."
  type        = number
  default     = 100
}

variable "backup_retention_period" {
  description = "Number of days to retain automated backups."
  type        = number
  default     = 7
}

variable "multi_az" {
  description = "Whether to enable a standby DB instance in another AZ. This increases cost if applied."
  type        = bool
  default     = true
}

variable "tags" {
  description = "Tags applied to resources."
  type        = map(string)
  default     = {}
}



variable "deletion_protection" {
  description = "Protect the RDS instance from deletion and take a final snapshot. Set false before terraform destroy."
  type        = bool
  default     = true
}
