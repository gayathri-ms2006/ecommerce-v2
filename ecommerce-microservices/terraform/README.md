# E-commerce Infrastructure as Code: DynamoDB (Phase 1)

This repository contains the Phase 1 Terraform infrastructure definition for provisioning the serverless e-commerce platform DynamoDB tables in AWS.

## Architecture & Design Patterns

1. **DRY (Don't Repeat Yourself) Design**: We use a dynamic lookup map in `locals.tf` combined with Terraform's `for_each` meta-argument in `dynamodb.tf`. This means we only maintain a single definition block for all DynamoDB tables.
2. **Provider default_tags**: Instead of manually passing the tags map to every single table, common tags (`Project`, `Environment`, and `ManagedBy`) are managed centrally inside the AWS provider configuration in `provider.tf`.
3. **Collision Avoidance**: To support multiple developers deploying into the same AWS account without collision, the suffix `resource_owner` variable is appended to all table names (e.g., `product-gayathri`).

---

## Directory Structure

```text
terraform/
├── README.md                 # Project instructions and architecture overview (this file)
├── provider.tf               # Configures the AWS Provider with default tags and region
├── versions.tf               # Pinning Terraform version (>=1.5.0) and AWS Provider (~>5.0)
├── variables.tf              # Input parameters (environment, region, billing, owner)
├── locals.tf                 # Configures the dynamic metadata mapping of tables
├── dynamodb.tf               # The single resource block deploying all 6 tables via loop
├── outputs.tf                # Declares output tables and ARNs mappings
└── terraform.tfvars.example  # Configuration values template for local environment
```

---

## Prerequisites

Before running the commands, ensure you have the following installed and configured:
1. **Terraform CLI** (v1.5.0 or later). Check with `terraform --version`.
2. **AWS CLI** configured with appropriate permissions. Run `aws sts get-caller-identity` to verify access.

---

## Getting Started: CLI commands

### 1. Copy the variables template
Create your local custom variables file:
```bash
cp terraform.tfvars.example terraform.tfvars
```
*(Open `terraform.tfvars` and verify your settings, such as `resource_owner = "gayathri"`).*

### 2. Initialize Terraform
The `init` command downloads the correct version of the AWS provider plugin defined in `versions.tf` and prepares the working directory.
```bash
terraform init
```

### 3. Generate Execution Plan
The `plan` command creates an execution plan, letting you preview the actions Terraform will take to reach the desired state. It performs a dry run.
```bash
terraform plan
```
Verify that the output displays **Plan: 6 to add, 0 to change, 0 to destroy.**

### 4. Deploy Infrastructure
The `apply` command executes the actions proposed in the plan to create the resources in AWS.
```bash
terraform apply
```
*Note: You will be prompted to type `yes` to confirm the deployment. Once finished, Terraform will print the outputs showing the table names and ARNs.*

### 5. Destroy Infrastructure
To remove all the resources managed by this configuration, run the `destroy` command.
```bash
terraform destroy
```
*Caution: This operation is destructive and will remove all tables and their data. Use with caution in production.*

---

## Managed DynamoDB Tables Summary

| Table Name | Partition Key | Type | Service Component |
|---|---|---|---|
| `product-gayathri` | `productId` | String (`S`) | `product-service` |
| `cart-gayathri` | `cartId` | String (`S`) | `cart-service` |
| `inventory-gayathri` | `inventoryId` | String (`S`) | `inventory-service` |
| `wishlist-gayathri` | `wishlistId` | String (`S`) | `wishlist-service` |
| `payment-gayathri` | `paymentId` | String (`S`) | `payment-service` |
| `order-gayathri` | `orderId` | String (`S`) | `order-service` |
