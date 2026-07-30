# Product Service

The **Product Service** is a serverless microservice responsible for managing the e-commerce product catalog. It allows creating, retrieving, updating, and deleting products.

## Technology Stack
- Node.js 20+
- AWS Lambda & API Gateway
- AWS DynamoDB
- Serverless Framework

## API Endpoints
- `POST /products` - Create a product
- `GET /products/{productId}` - Get a product
- `PUT /products/{productId}` - Update a product
- `DELETE /products/{productId}` - Delete a product
- `GET /products` - List products

For detailed documentation, please refer to:
- [API_REFERENCE.md](API_REFERENCE.md)
- [ARCHITECTURE.md](ARCHITECTURE.md)
- [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md)
