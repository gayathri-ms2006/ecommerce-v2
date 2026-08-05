# ==============================================================================
# Outputs
# ==============================================================================
# Outputs are the public interface of a Terraform module. They expose selected 
# attributes of your resources to the command line or to other Terraform configurations.

output "dynamodb_table_names" {
  description = "A mapping of service names to their corresponding DynamoDB table names."
  # Using a for loop to extract the name attribute of each table dynamically.
  # Key is the logical name (e.g. product), value is the actual AWS resource name.
  value = {
    for service, table in aws_dynamodb_table.ecommerce : service => table.name
  }
}

output "dynamodb_table_arns" {
  description = "A mapping of service names to their corresponding DynamoDB table Amazon Resource Names (ARNs)."
  # Using a for loop to extract the ARN attribute of each table dynamically.
  value = {
    for service, table in aws_dynamodb_table.ecommerce : service => table.arn
  }
}

output "dynamodb_tables_summary" {
  description = "A combined summary of all created DynamoDB tables containing their names, partition keys, and ARNs."
  value = {
    for service, table in aws_dynamodb_table.ecommerce : service => {
      name          = table.name
      arn           = table.arn
      partition_key = table.hash_key
    }
  }
}

# ==============================================================================
# Lambda Outputs
# ==============================================================================

output "lambda_function_names" {
  description = "A mapping of service names to their corresponding Lambda function names."
  value = {
    for service, lambda in aws_lambda_function.services : service => lambda.function_name
  }
}

output "lambda_function_arns" {
  description = "A mapping of service names to their corresponding Lambda function Amazon Resource Names (ARNs)."
  value = {
    for service, lambda in aws_lambda_function.services : service => lambda.arn
  }
}

# ==============================================================================
# API Gateway Outputs
# ==============================================================================

output "api_gateway_id" {
  description = "The unique identifier of the HTTP API Gateway."
  value       = aws_apigatewayv2_api.ecommerce.id
}

output "api_gateway_endpoint" {
  description = "The execution endpoint URL of the HTTP API Gateway."
  value       = aws_apigatewayv2_api.ecommerce.api_endpoint
}

output "api_gateway_routes" {
  description = "A mapping of route keys to their corresponding route IDs."
  value = {
    for key, route in aws_apigatewayv2_route.routes : key => route.id
  }
}

output "api_gateway_integrations" {
  description = "A mapping of integration keys to their corresponding integration IDs."
  value = {
    for key, integration in aws_apigatewayv2_integration.services : key => integration.id
  }
}

output "cloudfront_domain_name" {
  description = "The domain name of the CloudFront distribution."
  value       = aws_cloudfront_distribution.ecommerce.domain_name
}

output "s3_bucket_arn" {
  description = "The ARN of the frontend S3 bucket."
  value       = aws_s3_bucket.frontend.arn
}

output "sns_topic_arn" {
  description = "The ARN of the order events SNS topic."
  value       = aws_sns_topic.order_events.arn
}

# ==============================================================================
# Observability Outputs
# ==============================================================================

output "dashboard_name" {
  description = "The name of the CloudWatch dashboard."
  value       = aws_cloudwatch_dashboard.ecommerce.dashboard_name
}

output "alert_topic_arn" {
  description = "The ARN of the alerts SNS topic."
  value       = aws_sns_topic.alerts.arn
}

output "alert_topic_name" {
  description = "The name of the alerts SNS topic."
  value       = aws_sns_topic.alerts.name
}

output "cloudfront_distribution_id" {
  description = "The ID of the CloudFront distribution."
  value       = aws_cloudfront_distribution.ecommerce.id
}



