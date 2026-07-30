# Inventory Service Architecture

Follows a layered clean architecture matching the Product Service structure.

## Database Concurrency
Uses DynamoDB `ConditionExpression: "availableStock >= :qty"` within `UpdateCommand` to guarantee atomic operations and avoid race conditions or double booking.
```
Handler -> Service -> Repository -> DynamoDB (Atomic ConditionExpression)
```
