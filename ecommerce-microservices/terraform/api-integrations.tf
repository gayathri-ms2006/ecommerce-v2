# ==============================================================================
# API Gateway Integrations & Permissions
# ==============================================================================

resource "aws_apigatewayv2_integration" "services" {
  for_each = local.api_integrations

  api_id           = aws_apigatewayv2_api.ecommerce.id
  integration_type = "AWS_PROXY"
  integration_uri  = aws_lambda_function.services[each.value.lambda_key].arn

  integration_method     = "POST"
  payload_format_version = "2.0"
  timeout_milliseconds   = 30000
}

# Grant API Gateway permissions to invoke the Lambdas
# We loop over the precise permissions map matching what exists in AWS.
resource "aws_lambda_permission" "apigw_lambda" {
  for_each = local.lambda_permissions

  statement_id  = each.value.statement_id
  action        = "lambda:InvokeFunction"
  function_name = each.value.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.ecommerce.execution_arn}/*/*${each.value.source_path}"
}
