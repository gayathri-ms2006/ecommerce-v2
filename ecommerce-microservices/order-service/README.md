# Order Service

The **Order Service** coordinates order placement, inventory verification/reduction, and payment collection. It handles distributed transactions with compensatory rollback logic.

## Technology Stack
- Node.js 20+
- AWS Lambda & API Gateway
- AWS DynamoDB
- Serverless Framework

## API Endpoints
- `POST /orders` - Create order
- `GET /orders/{orderId}` - Get order
- `PUT /orders/{orderId}/cancel` - Cancel order
- `GET /orders` - List orders
- `GET /orders/{orderId}/track` - Track order

For detailed documentation, please refer to:
- [API_REFERENCE.md](API_REFERENCE.md)
- [ARCHITECTURE.md](ARCHITECTURE.md)
- [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md)
