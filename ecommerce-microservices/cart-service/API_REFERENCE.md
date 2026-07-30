# Cart Service API Reference

## Add To Cart
- **URL**: `/cart`
- **Method**: `POST`
- **Body**: `{ "userId": "user-123", "productId": "UUID", "quantity": 1, "productName": "Shoes", "price": 89.99 }`
- **Response**: `200 OK` with CartItem details. Increments quantity if the item is already in the cart.

## Update Cart
- **URL**: `/cart`
- **Method**: `PUT`
- **Body**: `{ "userId": "user-123", "productId": "UUID", "quantity": 3 }`
- **Response**: `200 OK` with updated item.

## Remove Cart Item
- **URL**: `/cart`
- **Method**: `DELETE`
- **Body**: `{ "userId": "user-123", "productId": "UUID" }`
- **Response**: `200 OK` showing success details.

## View Cart
- **URL**: `/cart/{userId}`
- **Method**: `GET`
- **Response**: `200 OK` with an array of CartItems for the user.
