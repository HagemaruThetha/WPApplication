resource "aws_cloudfront_distribution" "this" {
  enabled             = true
  comment             = "${var.name_prefix} WordPress distribution"
  aliases             = var.aliases
  default_root_object = "index.php"
  price_class         = "PriceClass_100"
  is_ipv6_enabled     = true

  origin {
    domain_name = var.origin_domain_name
    origin_id   = "${var.name_prefix}-alb-origin"

    custom_origin_config {
      http_port              = 80
      https_port             = 443
      origin_protocol_policy = "https-only"
      origin_ssl_protocols   = ["TLSv1.2"]
    }
  }

  default_cache_behavior {
    target_origin_id       = "${var.name_prefix}-alb-origin"
    viewer_protocol_policy = "redirect-to-https"
    allowed_methods        = ["DELETE", "GET", "HEAD", "OPTIONS", "PATCH", "POST", "PUT"]
    cached_methods         = ["GET", "HEAD", "OPTIONS"]
    compress               = true

    # WordPress is dynamic. Disable object caching here and forward viewer
    # cookies, headers, and query strings to preserve login and page behavior.
    cache_policy_id          = "4135ea2d-6df8-44a3-9df3-4b5a84be39ad"
    origin_request_policy_id = "b689b0a8-53d0-40ab-baf2-68738e2966ac"
  }

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  viewer_certificate {
    cloudfront_default_certificate = var.viewer_certificate_arn == null
    acm_certificate_arn            = var.viewer_certificate_arn
    ssl_support_method             = var.viewer_certificate_arn == null ? null : "sni-only"
    minimum_protocol_version       = var.viewer_certificate_arn == null ? null : "TLSv1.2_2021"
  }

  tags = var.tags

  lifecycle {
    precondition {
      condition     = contains(var.aliases, var.website_domain)
      error_message = "cloudfront_aliases must include website_domain so WordPress canonical URLs resolve through the distribution."
    }
    precondition {
      condition     = var.viewer_certificate_arn != null
      error_message = "Custom CloudFront aliases require a matching ACM viewer certificate in us-east-1."
    }
  }
}
