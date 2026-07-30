const { PutCommand, GetCommand, DeleteCommand, ScanCommand } = require("@aws-sdk/lib-dynamodb");
const docClient = require("../config/dynamodb");

class ProductRepository {
  constructor() {
    this.tableName = process.env.PRODUCTS_TABLE || "product-service-products-dev";
  }

  async create(productJson) {
    const command = new PutCommand({
      TableName: this.tableName,
      Item: productJson,
    });
    await docClient.send(command);
    return productJson;
  }

  async getById(productId) {
    const command = new GetCommand({
      TableName: this.tableName,
      Key: { productId },
    });
    const response = await docClient.send(command);
    return response.Item || null;
  }

  async update(productJson) {
    // Overwrite the full item for standard repository pattern, or do single attributes.
    // For repositories, saving the full updated model is clean and complies with standard Domain Model pattern.
    const command = new PutCommand({
      TableName: this.tableName,
      Item: productJson,
    });
    await docClient.send(command);
    return productJson;
  }

  async delete(productId) {
    const command = new DeleteCommand({
      TableName: this.tableName,
      Key: { productId },
    });
    await docClient.send(command);
    return true;
  }

  async list() {
    const command = new ScanCommand({
      TableName: this.tableName,
    });
    const response = await docClient.send(command);
    return response.Items || [];
  }
}

module.exports = new ProductRepository();
