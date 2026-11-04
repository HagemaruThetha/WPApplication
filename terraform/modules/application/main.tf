locals {
  common_tags = merge(var.tags, { Name = var.name_prefix })
}

resource "aws_lb" "wordpress" {
  name                       = substr("${var.name_prefix}-alb", 0, 32)
  internal                   = false
  load_balancer_type         = "application"
  security_groups            = [var.alb_security_group_id]
  subnets                    = var.public_subnet_ids
  drop_invalid_header_fields = true

  tags = local.common_tags
}

resource "aws_lb_target_group" "wordpress" {
  name        = substr("${var.name_prefix}-wp-tg", 0, 32)
  port        = 80
  protocol    = "HTTP"
  vpc_id      = var.vpc_id
  target_type = "instance"

  health_check {
    enabled             = true
    path                = "/wp-login.php"
    protocol            = "HTTP"
    matcher             = "200-399"
    interval            = 30
    timeout             = 5
    healthy_threshold   = 2
    unhealthy_threshold = 3
  }

  tags = local.common_tags
}

resource "aws_lb_listener" "https" {
  load_balancer_arn = aws_lb.wordpress.arn
  port              = 443
  protocol          = "HTTPS"
  certificate_arn   = var.alb_certificate_arn
  ssl_policy        = "ELBSecurityPolicy-TLS13-1-2-2021-06"

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.wordpress.arn
  }
}

resource "aws_efs_file_system" "wordpress" {
  creation_token = "${var.name_prefix}-wordpress-uploads"
  encrypted      = true

  lifecycle_policy {
    transition_to_ia = "AFTER_30_DAYS"
  }

  tags = merge(local.common_tags, { Name = "${var.name_prefix}-wordpress-uploads" })
}

resource "aws_security_group" "efs" {
  name        = "${var.name_prefix}-efs"
  description = "NFS access from the WordPress application instances only"
  vpc_id      = var.vpc_id

  ingress {
    description     = "NFS from WordPress EC2 instances"
    from_port       = 2049
    to_port         = 2049
    protocol        = "tcp"
    security_groups = [var.app_security_group_id]
  }

  egress = []

  tags = local.common_tags
}

resource "aws_vpc_security_group_egress_rule" "app_to_efs" {
  security_group_id            = var.app_security_group_id
  referenced_security_group_id = aws_security_group.efs.id
  description                  = "NFS to shared WordPress uploads on EFS."
  ip_protocol                  = "tcp"
  from_port                    = 2049
  to_port                      = 2049
}

resource "aws_efs_mount_target" "wordpress" {
  for_each = toset(var.app_subnet_ids)

  file_system_id  = aws_efs_file_system.wordpress.id
  subnet_id       = each.value
  security_groups = [aws_security_group.efs.id]
}

resource "aws_iam_role" "wordpress" {
  name = "${var.name_prefix}-wordpress-ec2"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect    = "Allow"
      Principal = { Service = "ec2.amazonaws.com" }
      Action    = "sts:AssumeRole"
    }]
  })

  tags = local.common_tags
}

resource "aws_iam_role_policy" "read_db_secret" {
  name = "${var.name_prefix}-read-db-secret"
  role = aws_iam_role.wordpress.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect   = "Allow"
      Action   = ["secretsmanager:GetSecretValue"]
      Resource = var.db_secret_arn
    }]
  })
}

resource "aws_iam_instance_profile" "wordpress" {
  name = "${var.name_prefix}-wordpress"
  role = aws_iam_role.wordpress.name
  tags = local.common_tags
}

resource "aws_launch_template" "wordpress" {
  name_prefix            = "${var.name_prefix}-wp-"
  image_id               = var.ami_id
  instance_type          = var.instance_type
  update_default_version = true
  user_data = base64encode(templatefile("${path.module}/user_data.sh.tftpl", {
    aws_region        = data.aws_region.current.name
    db_endpoint       = var.db_endpoint
    db_name           = var.db_name
    db_username       = var.db_username
    db_secret_arn     = var.db_secret_arn
    website_domain    = var.website_domain
    efs_id            = aws_efs_file_system.wordpress.id
    wordpress_version = var.wordpress_version
  }))

  iam_instance_profile {
    name = aws_iam_instance_profile.wordpress.name
  }

  network_interfaces {
    associate_public_ip_address = false
    security_groups             = [var.app_security_group_id]
  }

  block_device_mappings {
    device_name = "/dev/xvda"
    ebs {
      encrypted             = true
      volume_size           = 20
      volume_type           = "gp3"
      delete_on_termination = true
    }
  }

  metadata_options {
    http_endpoint               = "enabled"
    http_tokens                 = "required"
    http_put_response_hop_limit = 1
  }

  tag_specifications {
    resource_type = "instance"
    tags          = local.common_tags
  }

  tag_specifications {
    resource_type = "volume"
    tags          = local.common_tags
  }
}

data "aws_region" "current" {}

resource "aws_autoscaling_group" "wordpress" {
  name                      = "${var.name_prefix}-wordpress"
  min_size                  = var.min_size
  max_size                  = var.max_size
  desired_capacity          = var.desired_capacity
  vpc_zone_identifier       = var.app_subnet_ids
  target_group_arns         = [aws_lb_target_group.wordpress.arn]
  health_check_type         = "ELB"
  health_check_grace_period = 900
  default_instance_warmup   = 300
  force_delete              = false
  depends_on                = [aws_efs_mount_target.wordpress, aws_iam_role_policy.read_db_secret]

  launch_template {
    id      = aws_launch_template.wordpress.id
    version = "$Latest"
  }

  tag {
    key                 = "Name"
    value               = "${var.name_prefix}-wordpress"
    propagate_at_launch = true
  }

  dynamic "tag" {
    for_each = var.tags
    content {
      key                 = tag.key
      value               = tag.value
      propagate_at_launch = true
    }
  }

  lifecycle {
    ignore_changes = [desired_capacity]
  }
}

resource "aws_autoscaling_policy" "scale_out" {
  name                   = "${var.name_prefix}-cpu-scale-out"
  autoscaling_group_name = aws_autoscaling_group.wordpress.name
  adjustment_type        = "ChangeInCapacity"
  scaling_adjustment     = 1
  cooldown               = 300
  policy_type            = "SimpleScaling"
}

resource "aws_autoscaling_policy" "scale_in" {
  name                   = "${var.name_prefix}-cpu-scale-in"
  autoscaling_group_name = aws_autoscaling_group.wordpress.name
  adjustment_type        = "ChangeInCapacity"
  scaling_adjustment     = -1
  cooldown               = 300
  policy_type            = "SimpleScaling"
}

resource "aws_cloudwatch_metric_alarm" "cpu_high" {
  alarm_name          = "${var.name_prefix}-cpu-high"
  alarm_description   = "Scale out when average EC2 CPU exceeds 80% for 30 minutes."
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = var.scale_evaluation_periods
  datapoints_to_alarm = var.scale_evaluation_periods
  metric_name         = "CPUUtilization"
  namespace           = "AWS/EC2"
  period              = 300
  statistic           = "Average"
  threshold           = var.scale_out_cpu_threshold
  treat_missing_data  = "notBreaching"
  dimensions = {
    AutoScalingGroupName = aws_autoscaling_group.wordpress.name
  }
  alarm_actions = [aws_autoscaling_policy.scale_out.arn]
  tags          = local.common_tags
}

resource "aws_cloudwatch_metric_alarm" "cpu_low" {
  alarm_name          = "${var.name_prefix}-cpu-low"
  alarm_description   = "Scale in when average EC2 CPU is below 40% for 30 minutes."
  comparison_operator = "LessThanThreshold"
  evaluation_periods  = var.scale_evaluation_periods
  datapoints_to_alarm = var.scale_evaluation_periods
  metric_name         = "CPUUtilization"
  namespace           = "AWS/EC2"
  period              = 300
  statistic           = "Average"
  threshold           = var.scale_in_cpu_threshold
  treat_missing_data  = "notBreaching"
  dimensions = {
    AutoScalingGroupName = aws_autoscaling_group.wordpress.name
  }
  alarm_actions = [aws_autoscaling_policy.scale_in.arn]
  tags          = local.common_tags
}
