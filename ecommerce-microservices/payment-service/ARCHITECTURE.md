# Payment Service Architecture

Follows a layered clean architecture.

## Database Indexes
- **Partition Key**: `paymentId`
- **Global Secondary Index (GSI)**: `OrderIdIndex` (PK: `orderId`) to support reverse-lookups from orders to payments.
