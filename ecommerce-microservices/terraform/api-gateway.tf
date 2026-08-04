# ==============================================================================
# API Gateway HTTP API Configuration
# ==============================================================================

resource "aws_apigatewayv2_api" "ecommerce" {
  name          = "ecommerce-gayathri"
  protocol_type = "HTTP"

  # Exact CORS configuration as retrieved from AWS
  cors_configuration {
    allow_credentials = false
    allow_headers     = ["authorization", "content-type"]
    allow_methods     = ["GET", "POST", "OPTIONS", "PUT", "DELETE"]
    allow_origins     = ["http://localhost:5173", "https://d30dvwr72k2y05.cloudfront.net"]
    max_age           = 0
  }

  lifecycle {
    ignore_changes = [
      tags,
      tags_all,
    ]
  }
}

resource "aws_apigatewayv2_stage" "default" {
  api_id      = aws_apigatewayv2_api.ecommerce.id
  name        = "$default"
  auto_deploy = true

  lifecycle {
    ignore_changes = [
      tags,
      tags_all,
    ]
  }
}
