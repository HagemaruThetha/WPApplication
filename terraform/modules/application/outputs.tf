output "alb_dns_name" {
  description = "Public DNS name of the WordPress application load balancer."
  value       = aws_lb.wordpress.dns_name
}

output "alb_zone_id" {
  description = "Route 53 hosted-zone ID associated with the ALB."
  value       = aws_lb.wordpress.zone_id
}

output "asg_name" {
  description = "Name of the WordPress Auto Scaling Group."
  value       = aws_autoscaling_group.wordpress.name
}

output "efs_id" {
  description = "EFS file system ID used for shared WordPress uploads."
  value       = aws_efs_file_system.wordpress.id
}
