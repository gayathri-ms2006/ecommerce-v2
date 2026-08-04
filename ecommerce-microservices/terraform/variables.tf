# ==============================================================================
# Input Variables
# ==============================================================================
# Variables act as parameters for your Terraform modules. They allow your
# code to remain flexible, reusable, and free of hardcoded environment specifics.

variable "aws_region" {
  type        = string
  description = "The target AWS Region for deployment."
  default     = "ap-southeast-1"
}

variable "project_name" {
  type        = string
  description = "The name of the overall project, used for resource tagging and organization."
  default     = "ecommerce-v2"
}

variable "environment" {
  type        = string
  description = "The target environment name (e.g., dev, staging, prod) used for tagging."
  default     = "dev"
}

variable "resource_owner" {
  type        = string
  description = "The suffix identifying the resource owner, appended to resource names to prevent collision."
  default     = "gayathri"
}

variable "billing_mode" {
  type        = string
  description = "DynamoDB billing mode. Can be PROVISIONED or PAY_PER_REQUEST."
  default     = "PAY_PER_REQUEST"

  validation {
    condition     = contains(["PROVISIONED", "PAY_PER_REQUEST"], var.billing_mode)
    error_message = "The billing_mode variable must be either PROVISIONED or PAY_PER_REQUEST."
  }
}
