# Payment Service API Reference

## Create Payment
- **URL**: `/payments`
- **Method**: `POST`
- **Body**: `{ "orderId": "order-123", "amount": 119.97, "paymentMethod": "CREDIT_CARD" }`
- **Response**: `201 Created` with Payment details. Status defaults to `COMPLETED`.

## Get Payment Details
- **URL**: `/payments/{paymentId}`
- **Method**: `GET`
- **Response**: `200 OK` with payment record details.

## Refund Payment
- **URL**: `/payments/refund`
- **Method**: `POST`
- **Body**: `{ "paymentId": "UUID", "amount": 119.97 }`
- **Response**: `200 OK`. Updates status to `REFUNDED`.

## Track Payment Status
- **URL**: `/payments/{paymentId}/status`
- **Method**: `GET`
- **Response**: `200 OK` returning transaction status.
```json
{
  "success": true,
  "data": {
    "paymentId": "...",
    "paymentStatus": "COMPLETED",
    "transactionId": "txn_..."
  }
}
```
