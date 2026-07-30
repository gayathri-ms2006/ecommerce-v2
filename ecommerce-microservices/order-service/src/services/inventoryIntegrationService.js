const { LambdaClient, InvokeCommand } = require("@aws-sdk/client-lambda");

const region = process.env.AWS_REGION || "ap-southeast-1";

const config = {
  region,
};

if (process.env.IS_OFFLINE) {
  config.endpoint =
    process.env.MOCK_LAMBDA_ENDPOINT || "http://localhost:3002";
}

const lambda = new LambdaClient(config);

class InventoryIntegrationService {

  async checkAvailability(productId, quantity) {

    if (
      process.env.IS_OFFLINE &&
      !process.env.DISABLE_MOCK_INTEGRATION
    ) {
      console.log(
        `[Mock Offline Integration] Checking availability for product ${productId}`
      );

      return {
        productId,
        available: true,
        availableStock: 100,
      };
    }

    const functionName =
      process.env.INVENTORY_SERVICE_LAMBDA ||
      "inventoryservice";

    const payload = {
      httpMethod: "GET",
      resource: "/inventory/{productId}/availability",
      pathParameters: {
        productId,
      },
      queryStringParameters: {
        quantity: String(quantity),
      },
    };

    try {
      const command = new InvokeCommand({
        FunctionName: functionName,
        Payload: Buffer.from(JSON.stringify(payload)),
      });

      const response = await lambda.send(command);

      const result = JSON.parse(
        Buffer.from(response.Payload).toString()
      );

      const body = JSON.parse(result.body);

      if (!body.success) {
        throw new Error(
          body.error?.message ||
          "Failed inventory availability check"
        );
      }

      return body.data;

    } catch (err) {

      console.error(
        `Inventory checkAvailability failed: ${err.message}`
      );

      throw err;
    }
  }

  async reduceStock(productId, quantity) {

    if (
      process.env.IS_OFFLINE &&
      !process.env.DISABLE_MOCK_INTEGRATION
    ) {
      console.log(
        `[Mock Offline Integration] Reducing stock for product ${productId}`
      );

      return {
        productId,
        availableStock: 98,
      };
    }

    const functionName =
      process.env.INVENTORY_SERVICE_LAMBDA ||
      "inventoryservice";

    const payload = {
      httpMethod: "POST",
      resource: "/inventory/{productId}/reduce",
      pathParameters: {
        productId,
      },
      body: JSON.stringify({
        quantity,
      }),
    };

    try {
      const command = new InvokeCommand({
        FunctionName: functionName,
        Payload: Buffer.from(JSON.stringify(payload)),
      });

      const response = await lambda.send(command);

      const result = JSON.parse(
        Buffer.from(response.Payload).toString()
      );

      const body = JSON.parse(result.body);

      if (!body.success) {
        throw new Error(
          body.error?.message ||
          "Failed to reduce inventory stock"
        );
      }

      return body.data;

    } catch (err) {

      console.error(
        `Inventory reduceStock failed: ${err.message}`
      );

      throw err;
    }
  }

  async restoreStock(productId, quantity) {

    if (
      process.env.IS_OFFLINE &&
      !process.env.DISABLE_MOCK_INTEGRATION
    ) {
      console.log(
        `[Mock Offline Integration] Restoring stock for product ${productId}`
      );

      return {
        productId,
        availableStock: 100,
      };
    }

    const functionName =
      process.env.INVENTORY_SERVICE_LAMBDA ||
      "inventoryservice";

    const payload = {
      httpMethod: "POST",
      body: JSON.stringify({
        productId,
        availableStock: quantity,
        lowStockThreshold: 5,
        warehouseLocation: "Restored",
      }),
    };

    try {
      const command = new InvokeCommand({
        FunctionName: functionName,
        Payload: Buffer.from(JSON.stringify(payload)),
      });

      const response = await lambda.send(command);

      const result = JSON.parse(
        Buffer.from(response.Payload).toString()
      );

      const body = JSON.parse(result.body);

      if (!body.success) {
        throw new Error(
          body.error?.message ||
          "Failed to restore inventory stock"
        );
      }

      return body.data;

    } catch (err) {

      console.error(
        `Inventory restoreStock failed: ${err.message}`
      );

      throw err;
    }
  }
}

module.exports = new InventoryIntegrationService();