output "vpc_id" {
  description = "ID of the VPC."
  value       = aws_vpc.this.id
}

output "public_subnet_ids" {
  description = "Public subnet IDs, in the supplied Availability Zone order."
  value       = [for az in var.availability_zones : aws_subnet.public[az].id]
}

output "app_subnet_ids" {
  description = "Private application subnet IDs, in the supplied Availability Zone order."
  value       = [for az in var.availability_zones : aws_subnet.app[az].id]
}

output "db_subnet_ids" {
  description = "Private database subnet IDs, in the supplied Availability Zone order."
  value       = [for az in var.availability_zones : aws_subnet.db[az].id]
}

output "alb_security_group_id" {
  description = "Security group ID for the public Application Load Balancer."
  value       = aws_security_group.alb.id
}

output "app_security_group_id" {
  description = "Security group ID for WordPress EC2 instances."
  value       = aws_security_group.app.id
}

output "db_security_group_id" {
  description = "Security group ID for RDS MySQL."
  value       = aws_security_group.db.id
}
