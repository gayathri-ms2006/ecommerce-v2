# ==============================================================================
# AWS CloudFront Distribution Configuration
# ==============================================================================

resource "aws_cloudfront_origin_access_control" "ecommerce" {
  name                              = "gayathrifrontend.s3.ap-southeast-1.amazonaws.com"
  description                       = ""
  origin_access_control_origin_type = "s3"
  signing_behavior                  = "always"
  signing_protocol                  = "sigv4"
}

resource "aws_cloudfront_distribution" "ecommerce" {
  enabled             = true
  default_root_object = "index.html"
  price_class         = "PriceClass_200"
  is_ipv6_enabled     = true
  web_acl_id          = "arn:aws:wafv2:us-east-1:726101441380:global/webacl/FMManagedWebACLV2-LTNonprodStandardWAF-CloudFront-1784696886154/52e72a2e-5297-4bc5-9d1e-1aaea46e88a9"

  origin {
    domain_name              = "gayathrifrontend.s3.ap-southeast-1.amazonaws.com"
    origin_id                = "gayathrifrontend.s3.ap-southeast-1.amazonaws.com-mrt45az09tj"
    origin_access_control_id = aws_cloudfront_origin_access_control.ecommerce.id
  }

  default_cache_behavior {
    allowed_methods  = ["GET", "HEAD"]
    cached_methods   = ["GET", "HEAD"]
    target_origin_id = "gayathrifrontend.s3.ap-southeast-1.amazonaws.com-mrt45az09tj"
    cache_policy_id  = "4135ea2d-6df8-44a3-9df3-4b5a84be39ad"

    viewer_protocol_policy = "redirect-to-https"
    compress               = true
  }

  custom_error_response {
    error_code            = 403
    response_page_path    = "/index.html"
    response_code         = 200
    error_caching_min_ttl = 10
  }

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  viewer_certificate {
    cloudfront_default_certificate = true
    minimum_protocol_version       = "TLSv1"
  }

  lifecycle {
    ignore_changes = [
      tags,
      tags_all,
    ]
  }
}
