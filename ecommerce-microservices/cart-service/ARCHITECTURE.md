# Cart Service Architecture

Follows a layered clean architecture.

## Database Indexing Strategy
To support multiple cart items per user, the `Cart` table uses a composite key design:
- **Partition Key**: `userId`
- **Sort Key**: `productId`

This allows:
1. Retrieval of the user's entire cart using a single `Query` operation filtering on `userId`.
2. O(1) additions, quantity updates, and deletions using `Get` or `Put` directly with the composite key.
