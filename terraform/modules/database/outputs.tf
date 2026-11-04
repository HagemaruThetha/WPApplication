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

output "kms_key_arn" {
  description = "KMS key ARN that encrypts the database secret; the application role needs kms:Decrypt on it."
  value       = aws_kms_key.secrets.arn
}
