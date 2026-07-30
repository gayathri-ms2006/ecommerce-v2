const { PutCommand, GetCommand, DeleteCommand, QueryCommand } = require("@aws-sdk/lib-dynamodb");
const docClient = require("../config/dynamodb");

class CartRepository {
  constructor() {
    this.tableName = process.env.CART_TABLE || "cart-service-cart-dev";
  }

  async createOrUpdate(cartItemJson) {
    const command = new PutCommand({
      TableName: this.tableName,
      Item: cartItemJson,
    });
    await docClient.send(command);
    return cartItemJson;
  }

  async getByUserAndProduct(userId, productId) {
    const command = new GetCommand({
      TableName: this.tableName,
      Key: { userId, productId },
    });
    const response = await docClient.send(command);
    return response.Item || null;
  }

  async delete(userId, productId) {
    const command = new DeleteCommand({
      TableName: this.tableName,
      Key: { userId, productId },
    });
    await docClient.send(command);
    return true;
  }

  async getByUser(userId) {
    const command = new QueryCommand({
      TableName: this.tableName,
      KeyConditionExpression: "userId = :userId",
      ExpressionAttributeValues: {
        ":userId": userId,
      },
    });
    const response = await docClient.send(command);
    return response.Items || [];
  }
}

module.exports = new CartRepository();
