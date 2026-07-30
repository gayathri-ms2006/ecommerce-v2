const { PutCommand, GetCommand, QueryCommand, ScanCommand } = require("@aws-sdk/lib-dynamodb");
const docClient = require("../config/dynamodb");

class OrderRepository {
  constructor() {
    this.tableName = process.env.ORDERS_TABLE || "order-service-orders-dev";
  }

  async create(orderJson) {
    const command = new PutCommand({
      TableName: this.tableName,
      Item: orderJson,
    });
    await docClient.send(command);
    return orderJson;
  }

  async getById(orderId) {
    const command = new GetCommand({
      TableName: this.tableName,
      Key: { orderId },
    });
    const response = await docClient.send(command);
    return response.Item || null;
  }

  async update(orderJson) {
    const command = new PutCommand({
      TableName: this.tableName,
      Item: orderJson,
    });
    await docClient.send(command);
    return orderJson;
  }

  async getByUser(userId) {
    const command = new QueryCommand({
      TableName: this.tableName,
      IndexName: "UserOrdersIndex",
      KeyConditionExpression: "userId = :userId",
      ExpressionAttributeValues: {
        ":userId": userId,
      },
    });
    const response = await docClient.send(command);
    return response.Items || [];
  }

  async list() {
    const command = new ScanCommand({
      TableName: this.tableName,
    });
    const response = await docClient.send(command);
    return response.Items || [];
  }
}

module.exports = new OrderRepository();
