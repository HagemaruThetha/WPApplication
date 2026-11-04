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

resource "random_password" "wordpress_auth" {
  for_each = toset(local.wordpress_auth_keys)

  length  = 64
  special = false
}

resource "aws_secretsmanager_secret" "database" {
  name                    = "${var.name_prefix}/wordpress/database"
  description             = "WordPress database credentials and shared authentication keys"
  recovery_window_in_days = 7

  tags = var.tags
}

resource "aws_secretsmanager_secret_version" "database" {
  secret_id = aws_secretsmanager_secret.database.id
  secret_string = jsonencode({
    username = var.db_username
    password = random_password.database.result
    dbname   = var.db_name
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

resource "aws_db_instance" "database" {
  identifier                   = "${var.name_prefix}-mysql"
  engine                       = "mysql"
  engine_version               = var.engine_version
  instance_class               = var.db_instance_class
  allocated_storage            = var.db_allocated_storage
  max_allocated_storage        = var.max_allocated_storage
  storage_type                 = "gp3"
  storage_encrypted            = true
  db_name                      = var.db_name
  username                     = var.db_username
  password                     = random_password.database.result
  port                         = 3306
  db_subnet_group_name         = aws_db_subnet_group.database.name
  vpc_security_group_ids       = [var.db_security_group_id]
  publicly_accessible          = false
  multi_az                     = var.multi_az
  backup_retention_period      = var.backup_retention_period
  auto_minor_version_upgrade   = true
  deletion_protection          = false
  skip_final_snapshot          = true
  performance_insights_enabled = false
  apply_immediately            = false

  tags = merge(var.tags, { Name = "${var.name_prefix}-mysql" })
}



