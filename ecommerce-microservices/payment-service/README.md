# Payment Service

The **Payment Service** is a serverless microservice that manages customer transactions and invoice refunds.

## Technology Stack
- Node.js 20+
- AWS Lambda & API Gateway
- AWS DynamoDB
- Serverless Framework

## API Endpoints
- `POST /payments` - Create payment
- `GET /payments/{paymentId}` - Get payment details
- `POST /payments/refund` - Process payment refunds
- `GET /payments/{paymentId}/status` - Get transaction status

For detailed documentation, please refer to:
- [API_REFERENCE.md](API_REFERENCE.md)
- [ARCHITECTURE.md](ARCHITECTURE.md)
- [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md)
