# ==============================================================================
# AWS SNS Topic & Subscriptions Configuration
# ==============================================================================

resource "aws_sns_topic" "order_events" {
  name = "order-events-topic-g"

  lifecycle {
    ignore_changes = [
      tags,
      tags_all,
    ]
  }
}

resource "aws_sns_topic_subscription" "inventory" {
  topic_arn                       = aws_sns_topic.order_events.arn
  protocol                        = "sqs"
  endpoint                        = "arn:aws:sqs:ap-southeast-1:726101441380:inventory-queue-g"
  raw_message_delivery            = false
  confirmation_timeout_in_minutes = 1
  endpoint_auto_confirms          = false

  lifecycle {
    ignore_changes = [
      confirmation_timeout_in_minutes,
      endpoint_auto_confirms,
    ]
  }
}

resource "aws_sns_topic_subscription" "payment" {
  topic_arn                       = aws_sns_topic.order_events.arn
  protocol                        = "sqs"
  endpoint                        = "arn:aws:sqs:ap-southeast-1:726101441380:payment-queue-g"
  raw_message_delivery            = false
  confirmation_timeout_in_minutes = 1
  endpoint_auto_confirms          = false

  lifecycle {
    ignore_changes = [
      confirmation_timeout_in_minutes,
      endpoint_auto_confirms,
    ]
  }
}
