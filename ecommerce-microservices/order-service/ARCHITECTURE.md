# Order Service Architecture

Follows a layered clean architecture.

## Distributed Transactions (Saga / Compensation Pattern)
To maintain data consistency across services without shared databases:
1. **Check Availability**: Queries Inventory Service.
2. **Reduce Stock**: Decrements available inventory.
3. **Save Order (PENDING)**: Writes to Order DB.
4. **Charge Payment**: Calls Payment Service.
5. **Success**: Transition Order status to `PAID`.
6. **Failure (Rollback)**: If payment fails, restores stock on Inventory Service and marks Order as `FAILED`.

## Database Indexes
- **Partition Key**: `orderId`
- **Global Secondary Index (GSI)**: `UserOrdersIndex` (PK: `userId`, SK: `createdAt`) to query orders by user.
