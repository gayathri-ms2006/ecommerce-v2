# ==============================================================================
# IAM Configurations
# ==============================================================================
# Reference the existing AWS IAM Role used for Lambda execution. 
# This prevents Terraform from trying to manage or recreate this shared security resource.

data "aws_iam_role" "existing_lambda_role" {
  name = "Gayathri_aws"
}
