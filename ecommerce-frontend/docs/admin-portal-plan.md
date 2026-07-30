# Admin Portal Implementation Plan

## Frontend structure
- Pages
  - /admin/login
  - /admin/dashboard
  - /admin/products
  - /admin/inventory
  - /admin/orders
  - /admin/customers
  - /admin/analytics
  - /admin/settings
- Shared UI
  - AdminLayout shell
  - Admin CSS theme system

## Routing behavior
- Customer routes remain unchanged at /login, /products, /cart, /checkout, /orders, /track-order.
- Admin routes require an authenticated user with an admin role claim.
- Non-admin users are redirected away from the admin portal.

## API integration plan
- Products: use /products for list/create/update/delete operations.
- Inventory: use /inventory/:productId or /inventory for stock adjustments.
- Orders: use /orders and /orders/:orderId for status updates.
- Users: query from Cognito or a dedicated admin user management endpoint.
- Analytics: aggregate from orders and products services.

## DynamoDB schema updates
- products table: add status, sku, discount, imageUrl, updatedAt.
- inventory table: add productId, availableQuantity, lowStockThreshold, updatedAt.
- orders table: add status, updatedAt, customerEmail, totalAmount.
- users table or Cognito group mapping: add role, createdAt, totalOrders.

## Notes
- The current frontend uses local fallback state for admin CRUD flows to keep the experience functional even when API endpoints are unavailable.
- Production should replace the local fallback with real admin endpoints and server-side authorization checks.
