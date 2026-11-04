locals {
  wordpress_auth_keys = [
    "AUTH_KEY",
    "SECURE_AUTH_KEY",
    "LOGGED_IN_KEY",
    "NONCE_KEY",
    "AUTH_SALT",
    "SECURE_AUTH_SALT",
    "LOGGED_IN_SALT",
    "NONCE_SALT",
  ]
}

resource "random_password" "database" {
  length           = 32
  special          = true
  override_special = "!#%*-_=+?"
}

resource "random_password" "site_admin" {
  length  = 32
  special = false
}

resource "random_password" "wordpress_auth" {
  for_each = toset(local.wordpress_auth_keys)

  length  = 64
  special = false
}

resource "aws_kms_key" "secrets" {
  description             = "${var.name_prefix} WordPress database secret"
  enable_key_rotation     = true
  deletion_window_in_days = 7
  tags                    = var.tags
}

resource "aws_kms_alias" "secrets" {
  name          = "alias/${var.name_prefix}-db-secret"
  target_key_id = aws_kms_key.secrets.key_id
}

resource "aws_secretsmanager_secret" "database" {
  kms_key_id              = aws_kms_key.secrets.arn
  name                    = "${var.name_prefix}/wordpress/database"
  description             = "WordPress database credentials and shared authentication keys"
  recovery_window_in_days = 7

  tags = var.tags
}

resource "aws_secretsmanager_secret_version" "database" {
  secret_id = aws_secretsmanager_secret.database.id
  secret_string = jsonencode({
    username            = var.db_username
    password            = random_password.database.result
    dbname              = var.db_name
    site_admin_username = "assessment-admin"
    site_admin_password = random_password.site_admin.result
    auth_keys = {
      for key, value in random_password.wordpress_auth : key => value.result
    }
  })
}

resource "aws_db_subnet_group" "database" {
  name        = "${var.name_prefix}-db"
  description = "Private subnets for the WordPress RDS database"
  subnet_ids  = var.db_subnet_ids

  tags = merge(var.tags, { Name = "${var.name_prefix}-db-subnets" })
}

resource "aws_iam_role" "rds_monitoring" {
  name = "${var.name_prefix}-rds-monitoring"
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect    = "Allow"
      Principal = { Service = "monitoring.rds.amazonaws.com" }
      Action    = "sts:AssumeRole"
    }]
  })
  tags = var.tags
}

resource "aws_iam_role_policy_attachment" "rds_monitoring" {
  role       = aws_iam_role.rds_monitoring.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonRDSEnhancedMonitoringRole"
}

# Performance Insights is unsupported on db.t3.micro; WordPress cannot use IAM database authentication.
#trivy:ignore:AWS-0133
#trivy:ignore:AWS-0176
resource "aws_db_instance" "database" {
  #checkov:skip=CKV_AWS_161:WordPress cannot use RDS IAM database authentication; credentials come from Secrets Manager.
  identifier                      = "${var.name_prefix}-mysql"
  engine                          = "mysql"
  engine_version                  = var.engine_version
  instance_class                  = var.db_instance_class
  allocated_storage               = var.db_allocated_storage
  max_allocated_storage           = var.max_allocated_storage
  storage_type                    = "gp3"
  storage_encrypted               = true
  db_name                         = var.db_name
  username                        = var.db_username
  password                        = random_password.database.result
  port                            = 3306
  db_subnet_group_name            = aws_db_subnet_group.database.name
  vpc_security_group_ids          = [var.db_security_group_id]
  publicly_accessible             = false
  enabled_cloudwatch_logs_exports = ["error", "slowquery"]
  multi_az                        = var.multi_az
  backup_retention_period         = var.backup_retention_period
  auto_minor_version_upgrade      = true
  deletion_protection             = var.deletion_protection
  skip_final_snapshot             = var.deletion_protection ? false : true
  final_snapshot_identifier       = var.deletion_protection ? "${var.name_prefix}-final" : null
  monitoring_interval             = 60
  monitoring_role_arn             = aws_iam_role.rds_monitoring.arn
  performance_insights_enabled    = false
  apply_immediately               = false

  tags = merge(var.tags, { Name = "${var.name_prefix}-mysql" })
}



