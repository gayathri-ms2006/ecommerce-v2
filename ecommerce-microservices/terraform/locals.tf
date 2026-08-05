# ==============================================================================
# Local Variables
# ==============================================================================
# Locals are evaluated expressions that can be reused throughout your configuration.
# They are ideal for computing resource names, tags, and mapping configuration sets 
# that shouldn't be exposed as input variables.

locals {
  # DynamoDB Table Definitions Map
  # Each key represents a specific microservice. The values define the exact schema
  # and metadata (including exact tags) of the existing AWS resources to eliminate
  # drift and prevent recreation.
  dynamodb_tables = {
    product = {
      name          = "product-${var.resource_owner}"
      hash_key      = "productId"
      hash_key_type = "S"
      service       = "product-service"
      attributes = [
        { name = "productId", type = "S" }
      ]
      tags = {
        ApplicationService = "ecommerce"
        CostCentre         = "ecommerce2"
      }
    }
    cart = {
      name          = "cart-${var.resource_owner}"
      hash_key      = "userId"
      hash_key_type = "S"
      range_key     = "productId"
      range_key_type = "S"
      service       = "cart-service"
      attributes = [
        { name = "userId", type = "S" },
        { name = "productId", type = "S" }
      ]
      tags = {
        ApplicationService = "ecommerce"
        CostCentre         = "ecommerce2"
      }
    }
    inventory = {
      name          = "inventory-${var.resource_owner}"
      hash_key      = "productId"
      hash_key_type = "S"
      service       = "inventory-service"
      attributes = [
        { name = "productId", type = "S" }
      ]
      tags = {
        ApplicationService = "ecommerce"
        CostCentre         = "ecommerce2"
      }
    }
    order = {
      name          = "order-${var.resource_owner}"
      hash_key      = "orderId"
      hash_key_type = "S"
      service       = "order-service"
      attributes = [
        { name = "orderId", type = "S" },
        { name = "userId", type = "S" },
        { name = "createdAt", type = "S" }
      ]
      global_secondary_indexes = [
        {
          name            = "UserOrdersIndex"
          hash_key        = "userId"
          range_key       = "createdAt"
          projection_type = "ALL"
        }
      ]
      tags = {
        ApplicationService = "ecommerce"
        CostCentre         = "ecommerce2"
      }
    }
    payment = {
      name          = "payment-${var.resource_owner}"
      hash_key      = "paymentId"
      hash_key_type = "S"
      service       = "payment-service"
      attributes = [
        { name = "paymentId", type = "S" },
        { name = "orderId", type = "S" }
      ]
      global_secondary_indexes = [
        {
          name            = "OrderIdIndex"
          hash_key        = "orderId"
          projection_type = "ALL"
        }
      ]
    }
    wishlist = {
      name          = "wishlist" # Exact name of the existing wishlist table in AWS
      hash_key      = "userId"
      hash_key_type = "S"
      range_key     = "productId"
      range_key_type = "S"
      service       = "wishlist-service"
      attributes = [
        { name = "userId", type = "S" },
        { name = "productId", type = "S" }
      ]
    }
  }

  # AWS Lambda Function Definitions Map
  # Each key represents a specific microservice. The values define the exact schema
  # and environment variables of the existing AWS Lambda resources to eliminate drift
  # and prevent recreation.
  lambda_services = {
    product = {
      function_name = "productservice"
      handler       = "src/handlers/productHandler.handler"
      timeout       = 30
      tags = {
        ApplicationService = "ecommerce"
        CostCentre         = "ecommerce2"
      }
      tracing_mode = "Active"
      layers       = ["arn:aws:lambda:ap-southeast-1:615299751070:layer:AWSOpenTelemetryDistroJs:15"]
      environment_variables = {
        PRODUCTS_TABLE          = "product-${var.resource_owner}"
        AWS_LAMBDA_EXEC_WRAPPER = "/opt/otel-instrument"
      }
    }
    cart = {
      function_name = "cartservice"
      handler       = "src/handlers/cartHandler.handler"
      timeout       = 3
      tags = {
        ApplicationService = "ecommerce"
        CostCentre         = "ecommerce2"
      }
      tracing_mode = "Active"
      layers       = ["arn:aws:lambda:ap-southeast-1:615299751070:layer:AWSOpenTelemetryDistroJs:15"]
      environment_variables = {
        CART_TABLE              = "cart-${var.resource_owner}"
        AWS_LAMBDA_EXEC_WRAPPER = "/opt/otel-instrument"
      }
    }
    inventory = {
      function_name = "inventoryservice"
      handler       = "src/handlers/inventoryHandler.handler"
      timeout       = 3
      tags = {
        ApplicationService = "ecommerce"
        CostCentre         = "ecommerce2"
      }
      tracing_mode = "Active"
      layers       = ["arn:aws:lambda:ap-southeast-1:615299751070:layer:AWSOpenTelemetryDistroJs:15"]
      environment_variables = {
        INVENTORY_TABLE         = "inventory-${var.resource_owner}"
        AWS_LAMBDA_EXEC_WRAPPER = "/opt/otel-instrument"
      }
    }
    wishlist = {
      function_name = "wishlist" # Exact name of the existing wishlist Lambda in AWS
      handler       = "src/handlers/wishlistHandler.handler"
      timeout       = 3
      tracing_mode  = "Active"
      layers        = ["arn:aws:lambda:ap-southeast-1:615299751070:layer:AWSOpenTelemetryDistroJs:15"]
      environment_variables = {
        WISHLIST_TABLE          = "wishlist"
        AWS_LAMBDA_EXEC_WRAPPER = "/opt/otel-instrument"
      }
    }
    payment = {
      function_name = "paymentservice"
      handler       = "src/handlers/paymentHandler.handler"
      timeout       = 3
      tracing_mode  = "Active"
      layers        = ["arn:aws:lambda:ap-southeast-1:615299751070:layer:AWSOpenTelemetryDistroJs:15"]
      environment_variables = {
        PAYMENTS_TABLE          = "payment-${var.resource_owner}"
        AWS_LAMBDA_EXEC_WRAPPER = "/opt/otel-instrument"
      }
    }
    order = {
      function_name = "orderservice"
      handler       = "src/handlers/orderHandler.handler"
      timeout       = 30
      tags = {
        ApplicationService = "ecommerce"
        CostCentre         = "ecommerce2"
      }
      tracing_mode = "Active"
      layers       = ["arn:aws:lambda:ap-southeast-1:615299751070:layer:AWSOpenTelemetryDistroJs:14"]
      environment_variables = {
        ORDERS_TABLE             = "order-${var.resource_owner}"
        INVENTORY_SERVICE_LAMBDA = "inventoryservice"
        PAYMENT_SERVICE_LAMBDA   = "paymentservice"
        AWS_LAMBDA_EXEC_WRAPPER  = "/opt/otel-instrument"
        ORDER_TOPIC_ARN          = "arn:aws:sns:ap-southeast-1:726101441380:order-events-topic-g"
      }
    }
  }

  # API Gateway Integrations Map
  # Maps internal service integration keys to the corresponding Lambda function key.
  # This matches the 10 distinct integrations retrieved from AWS.
  api_integrations = {
    wishlist = {
      lambda_key = "wishlist"
    }
    cart = {
      lambda_key = "cart"
    }
    inventory = {
      lambda_key = "inventory"
    }
    order = {
      lambda_key = "order"
    }
    product_root = {
      lambda_key = "product"
    }
    product_item = {
      lambda_key = "product"
    }
    payment_root = {
      lambda_key = "payment"
    }
    payment_item = {
      lambda_key = "payment"
    }
    payment_status = {
      lambda_key = "payment"
    }
    payment_refund = {
      lambda_key = "payment"
    }
  }

  # API Gateway Routes Map
  # Maps each route to its integrated target and configures JWT authorization
  # for the payment routes exactly as deployed in AWS.
  api_routes = {
    "cart_put" = {
      integration_key = "cart"
      route_key       = "PUT /cart"
    }
    "order_post" = {
      integration_key = "order"
      route_key       = "POST /orders"
    }
    "inventory_avail" = {
      integration_key = "inventory"
      route_key       = "GET /inventory/{productId}/availability"
    }
    "payment_status" = {
      integration_key    = "payment_status"
      route_key          = "ANY /payments/{paymentId}/status"
      authorization_type = "JWT"
      authorizer_id      = "pfkhlt"
    }
    "order_get_id" = {
      integration_key = "order"
      route_key       = "GET /orders/{orderId}"
    }
    "cart_post" = {
      integration_key = "cart"
      route_key       = "POST /cart"
    }
    "order_cancel" = {
      integration_key = "order"
      route_key       = "POST /orders/cancel"
    }
    "wishlist_delete_item" = {
      integration_key = "wishlist"
      route_key       = "DELETE /wishlist/{productId}"
    }
    "wishlist_check_item" = {
      integration_key = "wishlist"
      route_key       = "GET /wishlist/check/{productId}"
    }
    "inventory_put" = {
      integration_key = "inventory"
      route_key       = "PUT /inventory/{productId}"
    }
    "payment_refund" = {
      integration_key    = "payment_refund"
      route_key          = "ANY /payments/refund"
      authorization_type = "JWT"
      authorizer_id      = "pfkhlt"
    }
    "payment_root" = {
      integration_key    = "payment_root"
      route_key          = "ANY /payments"
      authorization_type = "JWT"
      authorizer_id      = "pfkhlt"
    }
    "inventory_get" = {
      integration_key = "inventory"
      route_key       = "GET /inventory"
    }
    "order_get" = {
      integration_key = "order"
      route_key       = "GET /orders"
    }
    "inventory_reduce_post" = {
      integration_key = "inventory"
      route_key       = "POST /inventory/reduce"
    }
    "product_item" = {
      integration_key = "product_item"
      route_key       = "ANY /products/{productId}"
    }
    "wishlist_get" = {
      integration_key = "wishlist"
      route_key       = "GET /wishlist"
    }
    "cart_delete" = {
      integration_key = "cart"
      route_key       = "DELETE /cart"
    }
    "order_track" = {
      integration_key = "order"
      route_key       = "POST /orders/track"
    }
    "cart_get_id" = {
      integration_key = "cart"
      route_key       = "GET /cart/{userId}"
    }
    "wishlist_post" = {
      integration_key = "wishlist"
      route_key       = "POST /wishlist"
    }
    "product_root" = {
      integration_key = "product_root"
      route_key       = "ANY /products"
    }
    "payment_item" = {
      integration_key    = "payment_item"
      route_key          = "ANY /payments/{paymentId}"
      authorization_type = "JWT"
      authorizer_id      = "pfkhlt"
    }
    "inventory_reduce_id" = {
      integration_key = "inventory"
      route_key       = "POST /inventory/{productId}/reduce"
    }
    "inventory_get_id" = {
      integration_key = "inventory"
      route_key       = "GET /inventory/{productId}"
    }
  }

  # AWS Lambda Permissions Map
  # Maps each existing Lambda policy statement in AWS to its function name, Sid (statement_id),
  # and specific source path for the execute-api SourceArn.
  lambda_permissions = {
    # Product Service
    "product_item" = {
      function_name = "productservice"
      statement_id  = "cdc15a0f-3b49-5070-bb57-f91daaa00fb9"
      source_path   = "/products/{productId}"
    }
    "product_root" = {
      function_name = "productservice"
      statement_id  = "81a0f6cf-7909-5bb4-aa7b-d8b66980845b"
      source_path   = "/products"
    }
    # Cart Service
    "cart_root" = {
      function_name = "cartservice"
      statement_id  = "748e5bcb-283a-526d-a947-0604a051757b"
      source_path   = "/cart"
    }
    "cart_user" = {
      function_name = "cartservice"
      statement_id  = "cf7d315a-d58a-5fd7-bda2-af5cec481172"
      source_path   = "/cart/{userId}"
    }
    # Inventory Service
    "inventory_item" = {
      function_name = "inventoryservice"
      statement_id  = "3770d800-f91f-51f6-9ea4-a2a2db0cffc0"
      source_path   = "/inventory/{productId}"
    }
    "inventory_root" = {
      function_name = "inventoryservice"
      statement_id  = "571dcc3e-42cc-5d36-aa9e-bf44d7eec6f5"
      source_path   = "/inventory"
    }
    "inventory_item_avail" = {
      function_name = "inventoryservice"
      statement_id  = "531eb988-6668-51f7-9e5a-43db52c57c9e"
      source_path   = "/inventory/{productId}/availability"
    }
    "inventory_item_reduce" = {
      function_name = "inventoryservice"
      statement_id  = "45c7e532-9e88-5991-a196-bdd4f158bd0c"
      source_path   = "/inventory/{productId}/reduce"
    }
    "inventory_avail" = {
      function_name = "inventoryservice"
      statement_id  = "17ff50c2-28d8-5ee3-a9e6-756f0b39691a"
      source_path   = "/inventory/availability"
    }
    "inventory_reduce" = {
      function_name = "inventoryservice"
      statement_id  = "1f9aec1f-3785-51e1-b46d-0db53dc56ef5"
      source_path   = "/inventory/reduce"
    }
    # Wishlist Service
    "wishlist_root" = {
      function_name = "wishlist"
      statement_id  = "1c6f440c-3183-5aa9-ae51-d1c0da7235a2"
      source_path   = "/wishlist"
    }
    "wishlist_item" = {
      function_name = "wishlist"
      statement_id  = "dc63bbb7-058a-5cab-923c-ad6d116cea28"
      source_path   = "/wishlist/{productId}"
    }
    "wishlist_check" = {
      function_name = "wishlist"
      statement_id  = "9a885037-4ea7-5d70-b51b-9f2293f6d1c9"
      source_path   = "/wishlist/check/{productId}"
    }
    # Payment Service
    "payment_root" = {
      function_name = "paymentservice"
      statement_id  = "2b16c30a-8b78-510d-adf8-d5febd117525"
      source_path   = "/payments"
    }
    "payment_item" = {
      function_name = "paymentservice"
      statement_id  = "bb4865e8-b16f-5d31-adc5-14a10efbd239"
      source_path   = "/payments/{paymentId}"
    }
    "payment_status" = {
      function_name = "paymentservice"
      statement_id  = "dc8a4efe-d8ed-59f3-a6d9-ee873d893c32"
      source_path   = "/payments/{paymentId}/status"
    }
    "payment_refund" = {
      function_name = "paymentservice"
      statement_id  = "a240e1db-079e-50d4-9dab-b788cb269e6f"
      source_path   = "/payments/refund"
    }
    # Order Service
    "order_item" = {
      function_name = "orderservice"
      statement_id  = "9ad665d2-56c3-535b-bcad-7148e311141f"
      source_path   = "/orders/{orderId}"
    }
    "order_root" = {
      function_name = "orderservice"
      statement_id  = "934ad409-4f30-5268-9fed-5dc37509c12c"
      source_path   = "/orders"
    }
    "order_item_cancel" = {
      function_name = "orderservice"
      statement_id  = "7aaae066-ecbc-5ec8-8b72-61cbbfaf7428"
      source_path   = "/orders/{orderId}/cancel"
    }
    "order_item_track" = {
      function_name = "orderservice"
      statement_id  = "d1a1d2b4-5c46-52aa-aa26-761ae403a317"
      source_path   = "/orders/{orderId}/track"
    }
    "order_track" = {
      function_name = "orderservice"
      statement_id  = "999ffdc3-e466-5e35-bfad-fba4a2e3afe4"
      source_path   = "/orders/track"
    }
    "order_cancel" = {
      function_name = "orderservice"
      statement_id  = "5022e9f6-0a9d-5b3b-8d13-84d91ed05153"
      source_path   = "/orders/cancel"
    }
  }
}
