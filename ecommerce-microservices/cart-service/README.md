# Cart Service

The **Cart Service** is a serverless microservice that manages customer shopping baskets. It maps items to a specific user using composite primary keys in DynamoDB.

## Technology Stack
- Node.js 20+
- AWS Lambda & API Gateway
- AWS DynamoDB
- Serverless Framework

## API Endpoints
- `POST /cart` - Add item to cart
- `PUT /cart` - Update item quantity in cart
- `DELETE /cart` - Remove item from cart
- `GET /cart/{userId}` - View cart for user

For detailed documentation, please refer to:
- [API_REFERENCE.md](API_REFERENCE.md)
- [ARCHITECTURE.md](ARCHITECTURE.md)
- [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md)
