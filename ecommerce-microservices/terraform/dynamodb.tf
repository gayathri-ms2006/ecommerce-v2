# ==============================================================================
# DynamoDB Resource Configurations
# ==============================================================================
# This resource block maps to AWS DynamoDB. Using 'for_each' allows us to define
# a single, reusable resource template that scales dynamically based on the 
# configuration map defined in locals.tf.

resource "aws_dynamodb_table" "ecommerce" {
  # Loops through each element in the 'dynamodb_tables' map.
  for_each = local.dynamodb_tables

  # Retrieve exact table name from the map configuration.
  name = each.value.name

  # Set the billing mode to PAY_PER_REQUEST (On-Demand billing).
  billing_mode = var.billing_mode

  # Define the Partition Key (Hash Key) attribute name.
  hash_key = each.value.hash_key

  # Define the Sort Key (Range Key) attribute name if it exists.
  range_key = lookup(each.value, "range_key", null)

  # Attribute schema mapping. For DynamoDB tables, you only define attributes
  # that are used as keys (Partition Key, Sort Key, or index keys).
  dynamic "attribute" {
    for_each = each.value.attributes
    content {
      name = attribute.value.name
      type = attribute.value.type
    }
  }

  # Global Secondary Indexes (GSIs) are defined dynamically.
  dynamic "global_secondary_index" {
    for_each = lookup(each.value, "global_secondary_indexes", [])
    content {
      name               = global_secondary_index.value.name
      hash_key           = global_secondary_index.value.hash_key
      range_key          = lookup(global_secondary_index.value, "range_key", null)
      projection_type    = global_secondary_index.value.projection_type
      non_key_attributes = lookup(global_secondary_index.value, "non_key_attributes", null)
    }
  }

  # Resource-specific tags. Pulls directly from matching AWS state tag map.
  tags = lookup(each.value, "tags", null)

  # Production Best Practice: Prevent accidental deletion of DynamoDB tables.
  # In actual production environments, you may uncomment the deletion_protection setting.
  # deletion_protection = true

  # Lifecycle rules are block settings that control Terraform's resource update behavior.
  lifecycle {
    # Ignore tags and tags_all to completely eliminate tag-drift notifications in plans
    # since default provider tags might not be present on imported resources, and to
    # prevent any tag updates from cluttering the plan output.
    ignore_changes = [
      tags,
      tags_all,
    ]
  }
}
