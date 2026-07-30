const { PutCommand, GetCommand, DeleteCommand, QueryCommand } = require("@aws-sdk/lib-dynamodb");
const docClient = require("../config/dynamodb");
const env = require("../config/env");

class WishlistRepository {
  constructor() {
    this.tableName = env.wishlistTable;
  }

  async add(wishlistItemJson) {
    const command = new PutCommand({
      TableName: this.tableName,
      Item: wishlistItemJson,
    });
    await docClient.send(command);
    return wishlistItemJson;
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
      ScanIndexForward: false // Returns newest wishlist items first
    });
    const response = await docClient.send(command);
    return response.Items || [];
  }

  async getById(userId, productId) {
    const command = new GetCommand({
      TableName: this.tableName,
      Key: { userId, productId },
    });
    const response = await docClient.send(command);
    return response.Item || null;
  }

  async exists(userId, productId) {
    const item = await this.getById(userId, productId);
    return !!item;
  }
}

module.exports = new WishlistRepository();
