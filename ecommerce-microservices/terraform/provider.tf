# ==============================================================================
# AWS Provider Configuration
# ==============================================================================
# The provider configuration sets up the communication credentials and default
# settings for interacting with AWS APIs. We use variables to avoid hardcoding 
# regions, enabling the infrastructure to be redeployed to different regions easily.

provider "aws" {
  region = var.aws_region

  # By default, Terraform validates AWS credentials and requests your account ID.
  # For local/offline testing/planning, you can temporarily uncomment these bypass flags:
  # skip_credentials_validation = true
  # skip_metadata_api_check     = true
  # skip_requesting_account_id  = true

  # Default tags are a powerful feature introduced in the AWS Provider (v3.38.0+).
  # They automatically apply these tags to every resource managed by this provider
  # configuration, ensuring tagging compliance without needing to duplicate tags 
  # inside every resource block.
  default_tags {
    tags = {
      Project     = var.project_name
      Environment = var.environment
      ManagedBy   = "Terraform"
    }
  }

  ignore_tags {
    keys = ["ApplicationService", "CostCentre"]
  }
}
