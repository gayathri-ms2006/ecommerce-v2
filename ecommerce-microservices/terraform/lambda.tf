# ==============================================================================
# AWS Lambda Function Configurations
# ==============================================================================

# Generates a dynamic placeholder ZIP file to satisfy Terraform validation requirements
# without needing an actual pre-built code bundle locally.
data "archive_file" "lambda_placeholder" {
  type        = "zip"
  output_path = "${path.module}/placeholder.zip"

  source {
    content  = "// placeholder for imported lambda function"
    filename = "index.js"
  }
}

# Unified resource block to manage all six existing microservices
resource "aws_lambda_function" "services" {
  for_each = local.lambda_services

  function_name = each.value.function_name
  runtime       = "nodejs24.x"
  role          = data.aws_iam_role.existing_lambda_role.arn
  handler       = each.value.handler
  timeout       = each.value.timeout
  memory_size   = 128

  # Reference the dynamically generated zip file
  filename         = data.archive_file.lambda_placeholder.output_path
  source_code_hash = data.archive_file.lambda_placeholder.output_base64sha256

  # Dynamic layers support (used for OpenTelemetry layer on orderservice)
  layers = lookup(each.value, "layers", [])

  # Define Lambda environment variables dynamically
  environment {
    variables = each.value.environment_variables
  }

  # Tracing configuration (mode is Active for orderservice, defaults to PassThrough)
  tracing_config {
    mode = lookup(each.value, "tracing_mode", "PassThrough")
  }

  # Resource-specific tags mapping to AWS states exactly
  tags = lookup(each.value, "tags", null)

  # Lifecycle rules are essential when importing existing resources
  lifecycle {
    # Ignore changes to code-related deployment attributes. This prevents Terraform 
    # from overwriting the deployed code in AWS with our placeholder zip file.
    # Additionally ignore tags and tags_all to completely eliminate tag-drift.
    ignore_changes = [
      filename,
      source_code_hash,
      publish,
      tags,
      tags_all,
    ]
  }
}
