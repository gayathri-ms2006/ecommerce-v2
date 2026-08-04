# ==============================================================================
# Terraform & Provider Version Constraints
# ==============================================================================
# This file defines the version requirements for both the Terraform CLI and
# the individual providers utilized in this project. Declaring strict version
# constraints is a production best practice to prevent unexpected breaking changes 
# when working across different teams or CI/CD environments.

terraform {
  # Require Terraform CLI version 1.5.0 or higher.
  # Using >= allows minor and patch updates, while keeping a safe baseline.
  required_version = ">= 1.5.0"

  # Declare the required providers and their sources/versions.
  required_providers {
    aws = {
      source = "hashicorp/aws"
      # Node.js 24.x runtime support requires AWS Provider version 6.19.0 or later.
      # We allow minor and patch updates within the 6.x line.
      version = "~> 6.0"
    }
  }
}
