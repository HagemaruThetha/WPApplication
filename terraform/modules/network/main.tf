locals {
  az_index    = { for index, az in var.availability_zones : az => index }
  common_tags = merge(var.tags, { Project = var.name_prefix })

  public_cidrs = [for index in range(length(var.availability_zones)) : cidrsubnet(var.vpc_cidr, 8, index)]
  app_cidrs    = [for index in range(length(var.availability_zones)) : cidrsubnet(var.vpc_cidr, 8, index + 10)]
  db_cidrs     = [for index in range(length(var.availability_zones)) : cidrsubnet(var.vpc_cidr, 8, index + 20)]

  public_ingress_rules = concat(
    [{ rule_no = 100, protocol = "6", from_port = 443, to_port = 443, cidr = "0.0.0.0/0" }],
    [{ rule_no = 110, protocol = "6", from_port = 1024, to_port = 65535, cidr = "0.0.0.0/0" }]
  )
  public_egress_rules = concat(
    [for index, cidr in local.app_cidrs : { rule_no = 100 + index, protocol = "6", from_port = 80, to_port = 80, cidr = cidr }],
    [
      { rule_no = 200, protocol = "6", from_port = 80, to_port = 80, cidr = "0.0.0.0/0" },
      { rule_no = 210, protocol = "6", from_port = 443, to_port = 443, cidr = "0.0.0.0/0" },
      { rule_no = 220, protocol = "6", from_port = 1024, to_port = 65535, cidr = "0.0.0.0/0" }
    ]
  )
  app_ingress_rules = concat(
    [for index, cidr in local.public_cidrs : { rule_no = 100 + index, protocol = "6", from_port = 80, to_port = 80, cidr = cidr }],
    [for index, cidr in local.app_cidrs : { rule_no = 200 + index, protocol = "6", from_port = 2049, to_port = 2049, cidr = cidr }],
    [{ rule_no = 300, protocol = "6", from_port = 1024, to_port = 65535, cidr = "0.0.0.0/0" }]
  )
  app_egress_rules = concat(
    [for index, cidr in local.db_cidrs : { rule_no = 100 + index, protocol = "6", from_port = 3306, to_port = 3306, cidr = cidr }],
    [for index, cidr in local.app_cidrs : { rule_no = 200 + index, protocol = "6", from_port = 2049, to_port = 2049, cidr = cidr }],
    [
      { rule_no = 300, protocol = "6", from_port = 80, to_port = 80, cidr = "0.0.0.0/0" },
      { rule_no = 310, protocol = "6", from_port = 443, to_port = 443, cidr = "0.0.0.0/0" },
      { rule_no = 320, protocol = "6", from_port = 1024, to_port = 65535, cidr = "0.0.0.0/0" },
      { rule_no = 330, protocol = "17", from_port = 53, to_port = 53, cidr = var.vpc_cidr },
      { rule_no = 340, protocol = "6", from_port = 53, to_port = 53, cidr = var.vpc_cidr }
    ]
  )
  db_ingress_rules = [
    for index, cidr in local.app_cidrs : { rule_no = 100 + index, protocol = "6", from_port = 3306, to_port = 3306, cidr = cidr }
  ]
  db_egress_rules = [
    for index, cidr in local.app_cidrs : { rule_no = 100 + index, protocol = "6", from_port = 1024, to_port = 65535, cidr = cidr }
  ]
}

resource "aws_vpc" "this" {
  cidr_block           = var.vpc_cidr
  enable_dns_support   = true
  enable_dns_hostnames = true

  tags = merge(local.common_tags, { Name = "${var.name_prefix}-vpc" })
}

resource "aws_cloudwatch_log_group" "flow" {
  name              = "/vpc/${var.name_prefix}/flow-logs"
  retention_in_days = 365
  kms_key_id        = aws_kms_key.flow.arn
  tags              = var.tags
}

resource "aws_kms_key" "flow" {
  description             = "${var.name_prefix} VPC flow logs"
  enable_key_rotation     = true
  deletion_window_in_days = 7
  tags                    = var.tags

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid       = "AccountAdmin"
        Effect    = "Allow"
        Principal = { AWS = "arn:aws:iam::${data.aws_caller_identity.current.account_id}:root" }
        Action    = "kms:*"
        Resource  = "*"
      },
      {
        Sid       = "AllowCloudWatchLogs"
        Effect    = "Allow"
        Principal = { Service = "logs.${data.aws_region.current.region}.amazonaws.com" }
        Action    = ["kms:Encrypt*", "kms:Decrypt*", "kms:ReEncrypt*", "kms:GenerateDataKey*", "kms:Describe*"]
        Resource  = "*"
      }
    ]
  })
}

resource "aws_iam_role" "flow" {
  name = "${var.name_prefix}-vpc-flow-logs"
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect    = "Allow"
      Principal = { Service = "vpc-flow-logs.amazonaws.com" }
      Action    = "sts:AssumeRole"
    }]
  })
  tags = var.tags
}

resource "aws_iam_role_policy" "flow" {
  name = "${var.name_prefix}-vpc-flow-logs"
  role = aws_iam_role.flow.id
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect   = "Allow"
      Action   = ["logs:CreateLogStream", "logs:PutLogEvents", "logs:DescribeLogStreams"]
      Resource = "${aws_cloudwatch_log_group.flow.arn}:*"
    }]
  })
}

resource "aws_flow_log" "vpc" {
  vpc_id          = aws_vpc.this.id
  traffic_type    = "ALL"
  iam_role_arn    = aws_iam_role.flow.arn
  log_destination = aws_cloudwatch_log_group.flow.arn
  tags            = var.tags
}

data "aws_caller_identity" "current" {}
data "aws_region" "current" {}

resource "aws_internet_gateway" "this" {
  vpc_id = aws_vpc.this.id
  tags   = merge(local.common_tags, { Name = "${var.name_prefix}-igw" })
}

resource "aws_subnet" "public" {
  for_each = local.az_index

  vpc_id                  = aws_vpc.this.id
  availability_zone       = each.key
  cidr_block              = cidrsubnet(var.vpc_cidr, 8, each.value)
  map_public_ip_on_launch = false
  tags                    = merge(local.common_tags, { Name = "${var.name_prefix}-public-${each.key}" })
}

resource "aws_subnet" "app" {
  for_each = local.az_index

  vpc_id                  = aws_vpc.this.id
  availability_zone       = each.key
  cidr_block              = cidrsubnet(var.vpc_cidr, 8, each.value + 10)
  map_public_ip_on_launch = false
  tags                    = merge(local.common_tags, { Name = "${var.name_prefix}-app-${each.key}" })
}

resource "aws_subnet" "db" {
  for_each = local.az_index

  vpc_id                  = aws_vpc.this.id
  availability_zone       = each.key
  cidr_block              = cidrsubnet(var.vpc_cidr, 8, each.value + 20)
  map_public_ip_on_launch = false
  tags                    = merge(local.common_tags, { Name = "${var.name_prefix}-db-${each.key}" })
}

resource "aws_eip" "nat" {
  for_each = local.az_index
  domain   = "vpc"
  tags     = merge(local.common_tags, { Name = "${var.name_prefix}-nat-eip-${each.key}" })
}

resource "aws_nat_gateway" "this" {
  for_each = local.az_index

  allocation_id = aws_eip.nat[each.key].id
  subnet_id     = aws_subnet.public[each.key].id
  depends_on    = [aws_internet_gateway.this]
  tags          = merge(local.common_tags, { Name = "${var.name_prefix}-nat-${each.key}" })
}

resource "aws_route_table" "public" {
  vpc_id = aws_vpc.this.id
  tags   = merge(local.common_tags, { Name = "${var.name_prefix}-public-rt" })
}

resource "aws_route" "public_internet" {
  route_table_id         = aws_route_table.public.id
  destination_cidr_block = "0.0.0.0/0"
  gateway_id             = aws_internet_gateway.this.id
}

resource "aws_route_table_association" "public" {
  for_each = local.az_index

  subnet_id      = aws_subnet.public[each.key].id
  route_table_id = aws_route_table.public.id
}

resource "aws_route_table" "app" {
  for_each = local.az_index
  vpc_id   = aws_vpc.this.id
  tags     = merge(local.common_tags, { Name = "${var.name_prefix}-app-rt-${each.key}" })
}

resource "aws_route" "app_nat" {
  for_each = local.az_index

  route_table_id         = aws_route_table.app[each.key].id
  destination_cidr_block = "0.0.0.0/0"
  nat_gateway_id         = aws_nat_gateway.this[each.key].id
}

resource "aws_route_table_association" "app" {
  for_each = local.az_index

  subnet_id      = aws_subnet.app[each.key].id
  route_table_id = aws_route_table.app[each.key].id
}

resource "aws_route_table" "db" {
  for_each = local.az_index
  vpc_id   = aws_vpc.this.id
  tags     = merge(local.common_tags, { Name = "${var.name_prefix}-db-rt-${each.key}" })
}

resource "aws_route_table_association" "db" {
  for_each = local.az_index

  subnet_id      = aws_subnet.db[each.key].id
  route_table_id = aws_route_table.db[each.key].id
}

resource "aws_security_group" "alb" {
  name        = "${var.name_prefix}-alb-sg"
  description = "Allow HTTPS only from CloudFront origin-facing addresses."
  vpc_id      = aws_vpc.this.id
  ingress     = []
  egress      = []
  tags        = merge(local.common_tags, { Name = "${var.name_prefix}-alb-sg" })
}

resource "aws_vpc_security_group_ingress_rule" "alb_https_cloudfront" {
  security_group_id = aws_security_group.alb.id
  description       = "HTTPS from CloudFront origin-facing servers."
  prefix_list_id    = var.cloudfront_prefix_list_id
  ip_protocol       = "tcp"
  from_port         = 443
  to_port           = 443
}

resource "aws_security_group" "app" {
  name        = "${var.name_prefix}-app-sg"
  description = "Allow WordPress traffic from the ALB and required app egress only."
  vpc_id      = aws_vpc.this.id
  ingress     = []
  egress      = []
  tags        = merge(local.common_tags, { Name = "${var.name_prefix}-app-sg" })
}

resource "aws_vpc_security_group_ingress_rule" "app_from_alb" {
  #checkov:skip=CKV_AWS_260:Source is the ALB security group, not 0.0.0.0/0.
  security_group_id            = aws_security_group.app.id
  referenced_security_group_id = aws_security_group.alb.id
  description                  = "HTTP from the ALB target group."
  ip_protocol                  = "tcp"
  from_port                    = 80
  to_port                      = 80
}

resource "aws_vpc_security_group_egress_rule" "alb_to_app" {
  security_group_id            = aws_security_group.alb.id
  referenced_security_group_id = aws_security_group.app.id
  description                  = "Forward web traffic to WordPress targets."
  ip_protocol                  = "tcp"
  from_port                    = 80
  to_port                      = 80
}

# Needed for OS and WordPress package downloads through NAT; limited to ports 80/443.
#trivy:ignore:AWS-0104
resource "aws_vpc_security_group_egress_rule" "app_web_egress" {
  for_each = toset(["80", "443"])

  security_group_id = aws_security_group.app.id
  description       = "HTTP/HTTPS for operating-system and WordPress downloads."
  cidr_ipv4         = "0.0.0.0/0"
  ip_protocol       = "tcp"
  from_port         = tonumber(each.value)
  to_port           = tonumber(each.value)
}

resource "aws_vpc_security_group_egress_rule" "app_dns_egress" {
  for_each = toset(["udp", "tcp"])

  security_group_id = aws_security_group.app.id
  description       = "DNS queries to the VPC resolver."
  cidr_ipv4         = var.vpc_cidr
  ip_protocol       = each.value
  from_port         = 53
  to_port           = 53
}

resource "aws_security_group" "db" {
  name        = "${var.name_prefix}-db-sg"
  description = "Allow MySQL only from the WordPress application security group."
  vpc_id      = aws_vpc.this.id
  ingress     = []
  egress      = []
  tags        = merge(local.common_tags, { Name = "${var.name_prefix}-db-sg" })
}

resource "aws_vpc_security_group_egress_rule" "app_to_db" {
  security_group_id            = aws_security_group.app.id
  referenced_security_group_id = aws_security_group.db.id
  description                  = "MySQL to the RDS security group."
  ip_protocol                  = "tcp"
  from_port                    = 3306
  to_port                      = 3306
}

resource "aws_vpc_security_group_ingress_rule" "db_from_app" {
  security_group_id            = aws_security_group.db.id
  referenced_security_group_id = aws_security_group.app.id
  description                  = "MySQL from WordPress EC2 instances only."
  ip_protocol                  = "tcp"
  from_port                    = 3306
  to_port                      = 3306
}

resource "aws_network_acl" "public" {
  vpc_id     = aws_vpc.this.id
  subnet_ids = [for subnet in aws_subnet.public : subnet.id]

  dynamic "ingress" {
    for_each = local.public_ingress_rules
    content {
      rule_no    = ingress.value.rule_no
      protocol   = ingress.value.protocol
      action     = "allow"
      cidr_block = ingress.value.cidr
      from_port  = ingress.value.from_port
      to_port    = ingress.value.to_port
    }
  }
  dynamic "egress" {
    for_each = local.public_egress_rules
    content {
      rule_no    = egress.value.rule_no
      protocol   = egress.value.protocol
      action     = "allow"
      cidr_block = egress.value.cidr
      from_port  = egress.value.from_port
      to_port    = egress.value.to_port
    }
  }
  tags = merge(local.common_tags, { Name = "${var.name_prefix}-public-nacl" })
}

resource "aws_network_acl" "app" {
  vpc_id     = aws_vpc.this.id
  subnet_ids = [for subnet in aws_subnet.app : subnet.id]

  dynamic "ingress" {
    for_each = local.app_ingress_rules
    content {
      rule_no    = ingress.value.rule_no
      protocol   = ingress.value.protocol
      action     = "allow"
      cidr_block = ingress.value.cidr
      from_port  = ingress.value.from_port
      to_port    = ingress.value.to_port
    }
  }
  dynamic "egress" {
    for_each = local.app_egress_rules
    content {
      rule_no    = egress.value.rule_no
      protocol   = egress.value.protocol
      action     = "allow"
      cidr_block = egress.value.cidr
      from_port  = egress.value.from_port
      to_port    = egress.value.to_port
    }
  }
  tags = merge(local.common_tags, { Name = "${var.name_prefix}-app-nacl" })
}

resource "aws_network_acl" "db" {
  vpc_id     = aws_vpc.this.id
  subnet_ids = [for subnet in aws_subnet.db : subnet.id]

  dynamic "ingress" {
    for_each = local.db_ingress_rules
    content {
      rule_no    = ingress.value.rule_no
      protocol   = ingress.value.protocol
      action     = "allow"
      cidr_block = ingress.value.cidr
      from_port  = ingress.value.from_port
      to_port    = ingress.value.to_port
    }
  }
  dynamic "egress" {
    for_each = local.db_egress_rules
    content {
      rule_no    = egress.value.rule_no
      protocol   = egress.value.protocol
      action     = "allow"
      cidr_block = egress.value.cidr
      from_port  = egress.value.from_port
      to_port    = egress.value.to_port
    }
  }
  tags = merge(local.common_tags, { Name = "${var.name_prefix}-db-nacl" })
}

