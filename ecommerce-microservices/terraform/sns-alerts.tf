# ==============================================================================
# Observability - SNS Alerts Topic & Subscription
# ==============================================================================

resource "aws_sns_topic" "alerts" {
  name = "ecommerce-alerts"

  # Prevent drift on manually managed tags if any exist
  lifecycle {
    ignore_changes = [
      tags,
      tags_all,
    ]
  }
}

resource "aws_sns_topic_subscription" "email" {
  topic_arn = aws_sns_topic.alerts.arn
  protocol  = "email"
  endpoint  = "gayathri3056@gmail.com"
}
