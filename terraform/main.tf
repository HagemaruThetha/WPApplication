module "network" {
  source = "./modules/network"

  name_prefix               = local.name_prefix
  vpc_cidr                  = var.vpc_cidr
  availability_zones        = var.availability_zones
  cloudfront_prefix_list_id = var.cloudfront_prefix_list_id
  tags                      = local.common_tags
}

module "database" {
  source = "./modules/database"

  name_prefix             = local.name_prefix
  db_name                 = var.db_name
  db_username             = var.db_username
  db_instance_class       = var.db_instance_class
  db_allocated_storage    = var.db_allocated_storage
  db_subnet_ids           = module.network.db_subnet_ids
  db_security_group_id    = module.network.db_security_group_id
  backup_retention_period = var.db_backup_retention_days
  multi_az                = var.db_multi_az
  tags                    = local.common_tags
}

module "application" {
  source = "./modules/application"

  name_prefix              = local.name_prefix
  vpc_id                   = module.network.vpc_id
  public_subnet_ids        = module.network.public_subnet_ids
  app_subnet_ids           = module.network.app_subnet_ids
  alb_security_group_id    = module.network.alb_security_group_id
  app_security_group_id    = module.network.app_security_group_id
  db_endpoint              = module.database.endpoint
  db_name                  = var.db_name
  db_username              = module.database.username
  db_secret_arn            = module.database.secret_arn
  website_domain           = var.website_domain
  wordpress_version        = var.wordpress_version
  instance_type            = var.instance_type
  ami_id                   = var.ami_id
  min_size                 = 1
  max_size                 = 4
  desired_capacity         = var.desired_capacity
  scale_out_cpu_threshold  = 80
  scale_in_cpu_threshold   = 40
  scale_evaluation_periods = 6
  alb_certificate_arn      = var.alb_certificate_arn
  tags                     = local.common_tags
}

module "cdn" {
  source = "./modules/cdn"

  name_prefix            = local.name_prefix
  origin_domain_name     = var.cloudfront_origin_domain_name
  website_domain         = var.website_domain
  aliases                = var.cloudfront_aliases
  viewer_certificate_arn = var.cloudfront_viewer_certificate_arn
  tags                   = local.common_tags
}
