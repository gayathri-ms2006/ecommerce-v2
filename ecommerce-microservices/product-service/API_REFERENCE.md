# Product Service API Reference

## Create Product
Creates a new product item in the catalog.

- **URL**: `/products`
- **Method**: `POST`
- **Headers**: `Content-Type: application/json`
- **Request Body**:
```json
{
  "name": "Wireless Mouse",
  "description": "Ergonomic 2.4GHz wireless mouse",
  "category": "Electronics",
  "price": 29.99,
  "imageUrl": "https://example.com/images/mouse.jpg"
}
```
- **Success Response (201 Created)**:
```json
{
  "success": true,
  "data": {
    "productId": "4a0815e9-d9d1-4190-b996-26795f57a908",
    "name": "Wireless Mouse",
    "description": "Ergonomic 2.4GHz wireless mouse",
    "category": "Electronics",
    "price": 29.99,
    "imageUrl": "https://example.com/images/mouse.jpg",
    "createdAt": "2026-07-01T10:15:00.000Z",
    "updatedAt": "2026-07-01T10:15:00.000Z"
  }
}
```

---

## Get Product
Retrieves product details by its unique identifier.

- **URL**: `/products/{productId}`
- **Method**: `GET`
- **Success Response (200 OK)**:
```json
{
  "success": true,
  "data": {
    "productId": "4a0815e9-d9d1-4190-b996-26795f57a908",
    "name": "Wireless Mouse",
    "description": "Ergonomic 2.4GHz wireless mouse",
    "category": "Electronics",
    "price": 29.99,
    "imageUrl": "https://example.com/images/mouse.jpg",
    "createdAt": "2026-07-01T10:15:00.000Z",
    "updatedAt": "2026-07-01T10:15:00.000Z"
  }
}
```

---

## Update Product
Updates specific fields of an existing product.

- **URL**: `/products/{productId}`
- **Method**: `PUT`
- **Request Body** (at least one field required):
```json
{
  "price": 24.99,
  "description": "Ergonomic 2.4GHz wireless mouse (Updated description)"
}
```
- **Success Response (200 OK)**:
```json
{
  "success": true,
  "data": {
    "productId": "4a0815e9-d9d1-4190-b996-26795f57a908",
    "name": "Wireless Mouse",
    "description": "Ergonomic 2.4GHz wireless mouse (Updated description)",
    "category": "Electronics",
    "price": 24.99,
    "imageUrl": "https://example.com/images/mouse.jpg",
    "createdAt": "2026-07-01T10:15:00.000Z",
    "updatedAt": "2026-07-01T10:17:30.000Z"
  }
}
```

---

## Delete Product
Removes a product from the catalog.

- **URL**: `/products/{productId}`
- **Method**: `DELETE`
- **Success Response (200 OK)**:
```json
{
  "success": true,
  "data": {
    "productId": "4a0815e9-d9d1-4190-b996-26795f57a908",
    "deleted": true
  }
}
```

---

## List Products
Retrieves all product items from the catalog.

- **URL**: `/products`
- **Method**: `GET`
- **Success Response (200 OK)**:
```json
{
  "success": true,
  "data": [
    {
      "productId": "4a0815e9-d9d1-4190-b996-26795f57a908",
      "name": "Wireless Mouse",
      "description": "Ergonomic 2.4GHz wireless mouse",
      "category": "Electronics",
      "price": 29.99,
      "imageUrl": "https://example.com/images/mouse.jpg",
      "createdAt": "2026-07-01T10:15:00.000Z",
      "updatedAt": "2026-07-01T10:15:00.000Z"
    }
  ]
}
```
