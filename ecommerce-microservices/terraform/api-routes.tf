# ==============================================================================
# API Gateway Routes Configuration
# ==============================================================================

resource "aws_apigatewayv2_route" "routes" {
  for_each = local.api_routes

  api_id    = aws_apigatewayv2_api.ecommerce.id
  route_key = each.value.route_key
  target    = "integrations/${aws_apigatewayv2_integration.services[each.value.integration_key].id}"

  # Authorization configuration (used for JWT-secured payments routes)
  authorization_type = lookup(each.value, "authorization_type", "NONE")
  authorizer_id      = lookup(each.value, "authorizer_id", null)
}
