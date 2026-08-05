# ==============================================================================
# Observability - CloudWatch Alarms
# ==============================================================================

# ------------------------------------------------------------------------------
# API Gateway Alarms
# ------------------------------------------------------------------------------

resource "aws_cloudwatch_metric_alarm" "api_latency" {
  alarm_name          = "api-gateway-high-latency"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "Latency"
  namespace           = "AWS/ApiGateway"
  period              = 300
  statistic           = "Average"
  threshold           = 1000 # 1 second in milliseconds
  alarm_description   = "Alarms when API Gateway latency exceeds 1 second on average for 10 minutes"
  
  dimensions = {
    ApiId = aws_apigatewayv2_api.ecommerce.id
    Stage = aws_apigatewayv2_stage.default.name
  }

  alarm_actions = [aws_sns_topic.alerts.arn]
}

resource "aws_cloudwatch_metric_alarm" "api_4xx" {
  alarm_name          = "api-gateway-high-4xx-errors"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "4XXError"
  namespace           = "AWS/ApiGateway"
  period              = 300
  statistic           = "Sum"
  threshold           = 10 # More than 10 client errors in 10 minutes
  alarm_description   = "Alarms when API Gateway client errors (4XX) exceed 10 in 10 minutes"

  dimensions = {
    ApiId = aws_apigatewayv2_api.ecommerce.id
    Stage = aws_apigatewayv2_stage.default.name
  }

  alarm_actions = [aws_sns_topic.alerts.arn]
}

resource "aws_cloudwatch_metric_alarm" "api_5xx" {
  alarm_name          = "api-gateway-high-5xx-errors"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "5XXError"
  namespace           = "AWS/ApiGateway"
  period              = 300
  statistic           = "Sum"
  threshold           = 0 # Alarm immediately on any 5XX server error
  alarm_description   = "Alarms when API Gateway server errors (5XX) occur"

  dimensions = {
    ApiId = aws_apigatewayv2_api.ecommerce.id
    Stage = aws_apigatewayv2_stage.default.name
  }

  alarm_actions = [aws_sns_topic.alerts.arn]
}

# ------------------------------------------------------------------------------
# Lambda Alarms (For all 6 Lambda functions)
# ------------------------------------------------------------------------------

resource "aws_cloudwatch_metric_alarm" "lambda_errors" {
  for_each = local.lambda_services

  alarm_name          = "lambda-${each.key}-errors"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "Errors"
  namespace           = "AWS/Lambda"
  period              = 300
  statistic           = "Sum"
  threshold           = 0
  alarm_description   = "Alarms when the Lambda function ${each.value.function_name} encounters errors"

  dimensions = {
    FunctionName = each.value.function_name
  }

  alarm_actions = [aws_sns_topic.alerts.arn]
}

resource "aws_cloudwatch_metric_alarm" "lambda_throttles" {
  for_each = local.lambda_services

  alarm_name          = "lambda-${each.key}-throttles"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "Throttles"
  namespace           = "AWS/Lambda"
  period              = 300
  statistic           = "Sum"
  threshold           = 0
  alarm_description   = "Alarms when the Lambda function ${each.value.function_name} encounters throttles"

  dimensions = {
    FunctionName = each.value.function_name
  }

  alarm_actions = [aws_sns_topic.alerts.arn]
}

resource "aws_cloudwatch_metric_alarm" "lambda_durations" {
  for_each = local.lambda_services

  alarm_name          = "lambda-${each.key}-duration"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "Duration"
  namespace           = "AWS/Lambda"
  period              = 300
  statistic           = "Average"
  # Duration metric is in milliseconds, timeout is in seconds. Alarm at 80% of timeout.
  threshold           = each.value.timeout * 800
  alarm_description   = "Alarms when duration of ${each.value.function_name} exceeds 80% of its configured timeout"

  dimensions = {
    FunctionName = each.value.function_name
  }

  alarm_actions = [aws_sns_topic.alerts.arn]
}

# ------------------------------------------------------------------------------
# DynamoDB Alarms (For all 6 tables)
# ------------------------------------------------------------------------------

resource "aws_cloudwatch_metric_alarm" "dynamodb_system_errors" {
  for_each = local.dynamodb_tables

  alarm_name          = "dynamodb-${each.key}-system-errors"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "SystemErrors"
  namespace           = "AWS/DynamoDB"
  period              = 300
  statistic           = "Sum"
  threshold           = 0
  alarm_description   = "Alarms when DynamoDB table ${each.value.name} encounters system errors"

  dimensions = {
    TableName = each.value.name
  }

  alarm_actions = [aws_sns_topic.alerts.arn]
}

resource "aws_cloudwatch_metric_alarm" "dynamodb_throttles" {
  for_each = local.dynamodb_tables

  alarm_name          = "dynamodb-${each.key}-throttled-requests"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "ThrottledRequests"
  namespace           = "AWS/DynamoDB"
  period              = 300
  statistic           = "Sum"
  threshold           = 0
  alarm_description   = "Alarms when DynamoDB table ${each.value.name} encounters throttled requests"

  dimensions = {
    TableName = each.value.name
  }

  alarm_actions = [aws_sns_topic.alerts.arn]
}
