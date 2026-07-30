const { PutCommand, GetCommand, QueryCommand } = require("@aws-sdk/lib-dynamodb");
const docClient = require("../config/dynamodb");

class PaymentRepository {
  constructor() {
    this.tableName = process.env.PAYMENTS_TABLE || "payment-gayathri";
  }

  async create(paymentJson) {
    const command = new PutCommand({
      TableName: this.tableName,
      Item: paymentJson,
    });
    await docClient.send(command);
    return paymentJson;
  }

  async getById(paymentId) {
    const command = new GetCommand({
      TableName: this.tableName,
      Key: { paymentId },
    });
    const response = await docClient.send(command);
    return response.Item || null;
  }

  async update(paymentJson) {
    const command = new PutCommand({
      TableName: this.tableName,
      Item: paymentJson,
    });
    await docClient.send(command);
    return paymentJson;
  }

  async getByOrder(orderId) {
    const command = new QueryCommand({
      TableName: this.tableName,
      IndexName: "OrderIdIndex",
      KeyConditionExpression: "orderId = :orderId",
      ExpressionAttributeValues: {
        ":orderId": orderId,
      },
    });
    const response = await docClient.send(command);
    return response.Items || [];
  }
}

module.exports = new PaymentRepository();
