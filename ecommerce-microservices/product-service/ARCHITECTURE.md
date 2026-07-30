# Product Service Architecture

## Layered Design
The Product Service is designed around the clean onion/layered architecture using the Repository-Service Pattern:

```
+-------------------------------------------------+
|               API Gateway Proxy                 |
+-------------------------------------------------+
                        |
                        v
+-------------------------------------------------+
|             Lambda Handlers Layer               |
|      (createProduct, getProduct, etc.)          |
+-------------------------------------------------+
                        |
                        v
+-------------------------------------------------+
|                 Service Layer                   |
|             (productService.js)                 |
+-------------------------------------------------+
                        |
                        v
+-------------------------------------------------+
|               Repository Layer                  |
|           (productRepository.js)                |
+-------------------------------------------------+
                        |
                        v
+-------------------------------------------------+
|                  DynamoDB                       |
|              (Products Table)                   |
+-------------------------------------------------+
```

### Components
1. **Handlers**: Receive the APIGateway proxy event, parse inputs, trigger schema validation, invoke the service, and format JSON responses.
2. **Service Layer**: Contains domain logic. Maps parameters to domain model entities, performs business assertions, and interacts with repositories.
3. **Repository Layer**: Encapsulates DynamoDB queries using `@aws-sdk/lib-dynamodb` document client commands.
4. **Domain Model (`Product.js`)**: Encapsulates entity business data structure, mutations, and transformations.
