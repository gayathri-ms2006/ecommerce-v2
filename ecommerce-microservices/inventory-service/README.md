# Inventory Service

The **Inventory Service** is a serverless microservice that manages stock counts, warehouse coordinates, and low-stock alerts. It handles stock availability queries and atomic deductions.

## Technology Stack
- Node.js 20+
- AWS Lambda & API Gateway
- AWS DynamoDB
- Serverless Framework

## API Endpoints
- `POST /inventory` - Add stock record
- `PUT /inventory/{productId}` - Update stock configuration
- `GET /inventory/{productId}` - Fetch stock info
- `POST /inventory/{productId}/reduce` - Atomically reduce stock
- `GET /inventory/{productId}/availability` - Query stock availability

For detailed documentation, please refer to:
- [API_REFERENCE.md](API_REFERENCE.md)
- [ARCHITECTURE.md](ARCHITECTURE.md)
- [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md)
