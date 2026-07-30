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

class PaymentIntegrationService {

  async createPayment(orderId, amount, paymentMethod) {

    if (
      process.env.IS_OFFLINE &&
      !process.env.DISABLE_MOCK_INTEGRATION
    ) {
      console.log(
        `[Mock Offline Integration] Processing payment for order ${orderId}`
      );

      const { v4: uuidv4 } = require("uuid");

      return {
        paymentId: uuidv4(),
        orderId,
        amount,
        paymentMethod,
        paymentStatus: "COMPLETED",
        transactionId: `txn_${uuidv4().substring(0, 8)}`,
        createdAt: new Date().toISOString(),
      };
    }

    const functionName =
      process.env.PAYMENT_SERVICE_LAMBDA ||
      "paymentservice";

    const payload = {
      httpMethod: "POST",
      body: JSON.stringify({
        orderId,
        amount,
        paymentMethod,
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
          "Failed payment transaction processing"
        );
      }

      return body.data;

    } catch (err) {

      console.error(
        `Payment createPayment integration failed: ${err.message}`
      );

      throw err;
    }
  }
}

module.exports = new PaymentIntegrationService();