# Order Service API Reference

## Create Order
- **URL**: `/orders`
- **Method**: `POST`
- **Body**:
```json
{
  "userId": "user-123",
  "paymentMethod": "CREDIT_CARD",
  "products": [
    {
      "productId": "4a0815e9-d9d1-4190-b996-26795f57a908",
      "productName": "Wireless Mouse",
      "quantity": 1,
      "price": 29.99
    }
  ]
}
```
- **Response**: `201 Created` with Order details. Status will be `PAID` if the payment succeeds.

## Get Order
- **URL**: `/orders/{orderId}`
- **Method**: `GET`
- **Response**: `200 OK` with order details.

## Cancel Order
- **URL**: `/orders/{orderId}/cancel`
- **Method**: `PUT`
- **Response**: `200 OK`. Restores inventory stock for the products in the order.

## List Orders
- **URL**: `/orders?userId=user-123`
- **Method**: `GET`
- **Response**: `200 OK` listing orders (optionally filtered by `userId`).

## Track Order Status
- **URL**: `/orders/{orderId}/track`
- **Method**: `GET`
- **Response**: `200 OK` containing delivery status and estimations.
```json
{
  "success": true,
  "data": {
    "orderId": "...",
    "orderStatus": "PAID",
    "trackingInfo": {
      "carrier": "USPSServerless",
      "trackingNumber": "TXN...",
      "estimatedDelivery": "..."
    }
  }
}
```
