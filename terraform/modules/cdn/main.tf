data "aws_caller_identity" "current" {}

# Log-storage bucket: server access logging would recurse.
#trivy:ignore:AWS-0089
resource "aws_s3_bucket" "logs" {
  bucket        = "${var.name_prefix}-cf-logs-${data.aws_caller_identity.current.account_id}"
  force_destroy = true
  tags          = var.tags
}

resource "aws_s3_bucket_ownership_controls" "logs" {
  bucket = aws_s3_bucket.logs.id
  rule {
    object_ownership = "BucketOwnerPreferred"
  }
}

resource "aws_s3_bucket_acl" "logs" {
  bucket     = aws_s3_bucket.logs.id
  acl        = "private"
  depends_on = [aws_s3_bucket_ownership_controls.logs]
}

resource "aws_s3_bucket_public_access_block" "logs" {
  bucket                  = aws_s3_bucket.logs.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_versioning" "logs" {
  bucket = aws_s3_bucket.logs.id
  versioning_configuration {
    status = "Enabled"
  }
}

# SSE-S3 is required for ELB/CloudFront log delivery.
#trivy:ignore:AWS-0132
resource "aws_s3_bucket_server_side_encryption_configuration" "logs" {
  bucket = aws_s3_bucket.logs.id
  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_lifecycle_configuration" "logs" {
  bucket = aws_s3_bucket.logs.id
  rule {
    id     = "expire-logs"
    status = "Enabled"
    filter {}
    expiration {
      days = 90
    }
    abort_incomplete_multipart_upload {
      days_after_initiation = 7
    }
  }
}

resource "aws_cloudfront_distribution" "this" {
  #checkov:skip=CKV_AWS_310:Single ALB origin; origin failover needs a second origin, out of scope.
  web_acl_id          = var.web_acl_arn
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

  logging_config {
    bucket          = aws_s3_bucket.logs.bucket_domain_name
    prefix          = "cloudfront/"
    include_cookies = false
  }

  restrictions {
    geo_restriction {
      restriction_type = length(var.geo_allowlist) > 0 ? "whitelist" : "none"
      locations        = var.geo_allowlist
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
