# ==============================================================================
# Observability - CloudWatch Dashboard
# ==============================================================================

resource "aws_cloudwatch_dashboard" "ecommerce" {
  dashboard_name = "eshop-dashboard"

  dashboard_body = jsonencode({
    widgets = [
      # SECTION 1: Executive Overview Title
      {
        type   = "text"
        x      = 0
        y      = 0
        width  = 24
        height = 4
        properties = {
          markdown = <<-EOT
            # E-Commerce Production Dashboard
            
            This executive dashboard provides real-time visibility into the performance, health, and throughput of the E-Commerce Microservices Platform.
            
            ### Core Architectural Layers Monitored:
            * **CDN & Edge:** CloudFront Distribution (`E32J4PC8PSE27H`)
            * **API Entrypoint:** HTTP API Gateway (`ecommerce-gayathri`)
            * **Compute Layer:** Lambda Functions (6 Microservices)
            * **Storage Layer:** DynamoDB Tables (6 Database Tables)
            * **Alerting Status:** Integrated Platform Alarms Status
            * **Distributed Tracing:** X-Ray Service Analytics
          EOT
        }
      },

      # SECTION 2: CloudFront Monitoring (Metrics are us-east-1)
      {
        type   = "text"
        x      = 0
        y      = 4
        width  = 24
        height = 1
        properties = {
          markdown = "## 1. CloudFront CDN Performance (Global via us-east-1)"
        }
      },
      {
        type   = "metric"
        x      = 0
        y      = 5
        width  = 8
        height = 6
        properties = {
          metrics = [
            [ "AWS/CloudFront", "Requests", "DistributionId", "E32J4PC8PSE27H", "Region", "Global" ]
          ]
          view    = "timeSeries"
          stacked = false
          region  = "us-east-1"
          title   = "CloudFront Requests (Sum)"
          period  = 300
          stat    = "Sum"
        }
      },
      {
        type   = "metric"
        x      = 8
        y      = 5
        width  = 8
        height = 6
        properties = {
          metrics = [
            [ "AWS/CloudFront", "4xxErrorRate", "DistributionId", "E32J4PC8PSE27H", "Region", "Global" ]
          ]
          view    = "timeSeries"
          stacked = false
          region  = "us-east-1"
          title   = "CloudFront 4xx Error Rate (%)"
          period  = 300
          stat    = "Average"
        }
      },
      {
        type   = "metric"
        x      = 16
        y      = 5
        width  = 8
        height = 6
        properties = {
          metrics = [
            [ "AWS/CloudFront", "5xxErrorRate", "DistributionId", "E32J4PC8PSE27H", "Region", "Global" ]
          ]
          view    = "timeSeries"
          stacked = false
          region  = "us-east-1"
          title   = "CloudFront 5xx Error Rate (%)"
          period  = 300
          stat    = "Average"
        }
      },
      {
        type   = "metric"
        x      = 0
        y      = 11
        width  = 12
        height = 6
        properties = {
          metrics = [
            [ "AWS/CloudFront", "BytesDownloaded", "DistributionId", "E32J4PC8PSE27H", "Region", "Global" ]
          ]
          view    = "timeSeries"
          stacked = false
          region  = "us-east-1"
          title   = "Data Out - Bytes Downloaded (Sum)"
          period  = 300
          stat    = "Sum"
        }
      },
      {
        type   = "metric"
        x      = 12
        y      = 11
        width  = 12
        height = 6
        properties = {
          metrics = [
            [ "AWS/CloudFront", "BytesUploaded", "DistributionId", "E32J4PC8PSE27H", "Region", "Global" ]
          ]
          view    = "timeSeries"
          stacked = false
          region  = "us-east-1"
          title   = "Data In - Bytes Uploaded (Sum)"
          period  = 300
          stat    = "Sum"
        }
      },

      # SECTION 3: API Gateway Monitoring
      {
        type   = "text"
        x      = 0
        y      = 17
        width  = 24
        height = 1
        properties = {
          markdown = "## 2. API Gateway Health & Latency (ecommerce-gayathri)"
        }
      },
      {
        type   = "metric"
        x      = 0
        y      = 18
        width  = 8
        height = 6
        properties = {
          metrics = [
            [ "AWS/ApiGateway", "Count", "ApiId", aws_apigatewayv2_api.ecommerce.id, "Stage", aws_apigatewayv2_stage.default.name ]
          ]
          view    = "timeSeries"
          stacked = false
          region  = var.aws_region
          title   = "API Gateway Requests (Count)"
          period  = 300
          stat    = "Sum"
        }
      },
      {
        type   = "metric"
        x      = 8
        y      = 18
        width  = 8
        height = 6
        properties = {
          metrics = [
            [ "AWS/ApiGateway", "4XXError", "ApiId", aws_apigatewayv2_api.ecommerce.id, "Stage", aws_apigatewayv2_stage.default.name ]
          ]
          view    = "timeSeries"
          stacked = false
          region  = var.aws_region
          title   = "API Gateway 4XX Client Errors"
          period  = 300
          stat    = "Sum"
        }
      },
      {
        type   = "metric"
        x      = 16
        y      = 18
        width  = 8
        height = 6
        properties = {
          metrics = [
            [ "AWS/ApiGateway", "5XXError", "ApiId", aws_apigatewayv2_api.ecommerce.id, "Stage", aws_apigatewayv2_stage.default.name ]
          ]
          view    = "timeSeries"
          stacked = false
          region  = var.aws_region
          title   = "API Gateway 5XX Server Errors"
          period  = 300
          stat    = "Sum"
        }
      },
      {
        type   = "metric"
        x      = 0
        y      = 24
        width  = 12
        height = 6
        properties = {
          metrics = [
            [ "AWS/ApiGateway", "Latency", "ApiId", aws_apigatewayv2_api.ecommerce.id, "Stage", aws_apigatewayv2_stage.default.name, { "stat": "Average", "label": "Avg Latency" } ],
            [ "AWS/ApiGateway", "Latency", "ApiId", aws_apigatewayv2_api.ecommerce.id, "Stage", aws_apigatewayv2_stage.default.name, { "stat": "p99", "label": "p99 Latency" } ]
          ]
          view    = "timeSeries"
          stacked = false
          region  = var.aws_region
          title   = "API Gateway Latency (Avg / p99)"
          period  = 300
        }
      },
      {
        type   = "metric"
        x      = 12
        y      = 24
        width  = 12
        height = 6
        properties = {
          metrics = [
            [ "AWS/ApiGateway", "IntegrationLatency", "ApiId", aws_apigatewayv2_api.ecommerce.id, "Stage", aws_apigatewayv2_stage.default.name, { "stat": "Average", "label": "Avg Integration Latency" } ],
            [ "AWS/ApiGateway", "IntegrationLatency", "ApiId", aws_apigatewayv2_api.ecommerce.id, "Stage", aws_apigatewayv2_stage.default.name, { "stat": "p99", "label": "p99 Integration Latency" } ]
          ]
          view    = "timeSeries"
          stacked = false
          region  = var.aws_region
          title   = "API Gateway Integration Latency (Avg / p99)"
          period  = 300
        }
      },

      # SECTION 4: Lambda Monitoring
      {
        type   = "text"
        x      = 0
        y      = 30
        width  = 24
        height = 1
        properties = {
          markdown = "## 3. Lambda Microservices Performance (Multi-Line Metrics)"
        }
      },
      {
        type   = "metric"
        x      = 0
        y      = 31
        width  = 8
        height = 6
        properties = {
          metrics = [
            for svc_key, svc in local.lambda_services : [
              "AWS/Lambda", "Invocations", "FunctionName", svc.function_name, { "label": svc.function_name }
            ]
          ]
          view    = "timeSeries"
          stacked = false
          region  = var.aws_region
          title   = "Lambda Invocations"
          period  = 300
          stat    = "Sum"
        }
      },
      {
        type   = "metric"
        x      = 8
        y      = 31
        width  = 8
        height = 6
        properties = {
          metrics = [
            for svc_key, svc in local.lambda_services : [
              "AWS/Lambda", "Errors", "FunctionName", svc.function_name, { "label": svc.function_name }
            ]
          ]
          view    = "timeSeries"
          stacked = false
          region  = var.aws_region
          title   = "Lambda Errors"
          period  = 300
          stat    = "Sum"
        }
      },
      {
        type   = "metric"
        x      = 16
        y      = 31
        width  = 8
        height = 6
        properties = {
          metrics = [
            for svc_key, svc in local.lambda_services : [
              "AWS/Lambda", "Throttles", "FunctionName", svc.function_name, { "label": svc.function_name }
            ]
          ]
          view    = "timeSeries"
          stacked = false
          region  = var.aws_region
          title   = "Lambda Throttles"
          period  = 300
          stat    = "Sum"
        }
      },
      {
        type   = "metric"
        x      = 0
        y      = 37
        width  = 12
        height = 6
        properties = {
          metrics = [
            for svc_key, svc in local.lambda_services : [
              "AWS/Lambda", "Duration", "FunctionName", svc.function_name, { "stat": "p99", "label": "${svc.function_name} p99" }
            ]
          ]
          view    = "timeSeries"
          stacked = false
          region  = var.aws_region
          title   = "Lambda Execution Duration (p99)"
          period  = 300
        }
      },
      {
        type   = "metric"
        x      = 12
        y      = 37
        width  = 12
        height = 6
        properties = {
          metrics = [
            for svc_key, svc in local.lambda_services : [
              "AWS/Lambda", "ConcurrentExecutions", "FunctionName", svc.function_name, { "label": svc.function_name }
            ]
          ]
          view    = "timeSeries"
          stacked = false
          region  = var.aws_region
          title   = "Lambda Concurrent Executions"
          period  = 300
          stat    = "Maximum"
        }
      },

      # SECTION 5: DynamoDB Monitoring
      {
        type   = "text"
        x      = 0
        y      = 43
        width  = 24
        height = 1
        properties = {
          markdown = "## 4. DynamoDB Tables Analytics"
        }
      },
      {
        type   = "metric"
        x      = 0
        y      = 44
        width  = 12
        height = 6
        properties = {
          metrics = [
            for tbl_key, tbl in local.dynamodb_tables : [
              "AWS/DynamoDB", "ConsumedReadCapacityUnits", "TableName", tbl.name, { "label": tbl.name }
            ]
          ]
          view    = "timeSeries"
          stacked = false
          region  = var.aws_region
          title   = "Consumed Read Capacity Units (Sum)"
          period  = 300
          stat    = "Sum"
        }
      },
      {
        type   = "metric"
        x      = 12
        y      = 44
        width  = 12
        height = 6
        properties = {
          metrics = [
            for tbl_key, tbl in local.dynamodb_tables : [
              "AWS/DynamoDB", "ConsumedWriteCapacityUnits", "TableName", tbl.name, { "label": tbl.name }
            ]
          ]
          view    = "timeSeries"
          stacked = false
          region  = var.aws_region
          title   = "Consumed Write Capacity Units (Sum)"
          period  = 300
          stat    = "Sum"
        }
      },
      {
        type   = "metric"
        x      = 0
        y      = 50
        width  = 12
        height = 6
        properties = {
          metrics = [
            for tbl_key, tbl in local.dynamodb_tables : [
              "AWS/DynamoDB", "SuccessfulRequestLatency", "TableName", tbl.name, { "stat": "p99", "label": "${tbl.name} p99" }
            ]
          ]
          view    = "timeSeries"
          stacked = false
          region  = var.aws_region
          title   = "Successful Request Latency (p99)"
          period  = 300
        }
      },
      {
        type   = "metric"
        x      = 12
        y      = 50
        width  = 12
        height = 6
        properties = {
          metrics = [
            for tbl_key, tbl in local.dynamodb_tables : [
              "AWS/DynamoDB", "ThrottledRequests", "TableName", tbl.name, { "label": tbl.name }
            ]
          ]
          view    = "timeSeries"
          stacked = false
          region  = var.aws_region
          title   = "Throttled Requests (Sum)"
          period  = 300
          stat    = "Sum"
        }
      },
      {
        type   = "metric"
        x      = 0
        y      = 56
        width  = 12
        height = 6
        properties = {
          metrics = [
            for tbl_key, tbl in local.dynamodb_tables : [
              "AWS/DynamoDB", "SystemErrors", "TableName", tbl.name, { "label": tbl.name }
            ]
          ]
          view    = "timeSeries"
          stacked = false
          region  = var.aws_region
          title   = "DynamoDB System Errors (Sum)"
          period  = 300
          stat    = "Sum"
        }
      },
      {
        type   = "metric"
        x      = 12
        y      = 56
        width  = 12
        height = 6
        properties = {
          metrics = [
            for tbl_key, tbl in local.dynamodb_tables : [
              "AWS/DynamoDB", "UserErrors", "TableName", tbl.name, { "label": tbl.name }
            ]
          ]
          view    = "timeSeries"
          stacked = false
          region  = var.aws_region
          title   = "DynamoDB User Errors (Sum)"
          period  = 300
          stat    = "Sum"
        }
      },

      # SECTION 6: CloudWatch Alarm Status
      {
        type   = "text"
        x      = 0
        y      = 62
        width  = 24
        height = 1
        properties = {
          markdown = "## 5. Platform Alarms Overview"
        }
      },
      {
        type   = "alarm"
        x      = 0
        y      = 63
        width  = 24
        height = 6
        properties = {
          title = "Active Alarms Status (API, Lambda, and DynamoDB)"
          alarms = concat(
            [
              aws_cloudwatch_metric_alarm.api_latency.arn,
              aws_cloudwatch_metric_alarm.api_4xx.arn,
              aws_cloudwatch_metric_alarm.api_5xx.arn
            ],
            [for k, v in aws_cloudwatch_metric_alarm.lambda_errors : v.arn],
            [for k, v in aws_cloudwatch_metric_alarm.lambda_throttles : v.arn],
            [for k, v in aws_cloudwatch_metric_alarm.lambda_durations : v.arn],
            [for k, v in aws_cloudwatch_metric_alarm.dynamodb_system_errors : v.arn],
            [for k, v in aws_cloudwatch_metric_alarm.dynamodb_throttles : v.arn]
          )
        }
      },

      # SECTION 7: AWS X-Ray Monitoring
      {
        type   = "text"
        x      = 0
        y      = 69
        width  = 24
        height = 6
        properties = {
          markdown = <<-EOT
            # AWS X-Ray Distributed Tracing
            AWS X-Ray is configured on the platform to trace requests end-to-end and troubleshoot bottlenecks.
            
            ### Core Distributed Tracing Features:
            * **Active Tracing:** Enabled on the compute layer (`orderservice`) to trace requests down to dependencies.
            * **End-to-End Visibility:** Maps client calls through API Gateway and microservices down to DynamoDB tables.
            * **Lambda Trace Analysis:** Analyzes cold starts, execution times, and dependency response delays.
            * **Service Map:** Visually displays relationships between active microservices and databases.
            * **Bottleneck Identification:** Identifies slow SQL queries, downstream API calls, or connection problems quickly.
          EOT
        }
      }
    ]
  })
}
