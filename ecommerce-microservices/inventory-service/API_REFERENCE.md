# Inventory Service API Reference

## Add Inventory
- **URL**: `/inventory`
- **Method**: `POST`
- **Body**: `{ "productId": "UUID", "availableStock": 100, "lowStockThreshold": 5, "warehouseLocation": "A1" }`
- **Response**: `201 Created` with Inventory entity details.

## Update Inventory
- **URL**: `/inventory/{productId}`
- **Method**: `PUT`
- **Body**: `{ "availableStock": 150, "warehouseLocation": "B2" }`
- **Response**: `200 OK` with updated details.

## Get Inventory
- **URL**: `/inventory/{productId}`
- **Method**: `GET`
- **Response**: `200 OK` with stock details.

## Reduce Stock
- **URL**: `/inventory/{productId}/reduce`
- **Method**: `POST`
- **Body**: `{ "quantity": 2 }`
- **Response**: `200 OK` on successful atomic update, `409 Conflict` if stock is insufficient.

## Check Availability
- **URL**: `/inventory/{productId}/availability?quantity=2`
- **Method**: `GET`
- **Response**: `200 OK` with `{ "productId": "...", "available": true, "availableStock": 150 }`.
