output "endpoint" {
  description = "RDS endpoint hostname for WordPress."
  value       = aws_db_instance.database.address
}

output "port" {
  description = "RDS MySQL port."
  value       = aws_db_instance.database.port
}

output "secret_arn" {
  description = "Secrets Manager ARN containing database credentials and shared WordPress authentication keys."
  value       = aws_secretsmanager_secret.database.arn
}

output "username" {
  description = "RDS master username."
  value       = var.db_username
}
