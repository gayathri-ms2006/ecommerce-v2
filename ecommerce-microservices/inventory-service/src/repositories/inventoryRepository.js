const {
  PutCommand,
  GetCommand,
  UpdateCommand,
  ScanCommand
} = require("@aws-sdk/lib-dynamodb");

const docClient = require("../config/dynamodb");
const { ConflictError } = require("../utils/errors");

class InventoryRepository {

  constructor() {
    this.tableName =
      process.env.INVENTORY_TABLE ||
      "inventory-gayathri";
  }

  async create(inventoryJson) {

    const command = new PutCommand({
      TableName: this.tableName,
      Item: inventoryJson,
    });

    await docClient.send(command);

    return inventoryJson;
  }

  async getById(productId) {

    const command = new GetCommand({
      TableName: this.tableName,
      Key: { productId },
    });

    const response =
      await docClient.send(command);

    return response.Item || null;
  }

  // NEW METHOD
  async getAll() {

    const command = new ScanCommand({
      TableName: this.tableName,
    });

    const response =
      await docClient.send(command);

    return response.Items || [];
  }

  async update(inventoryJson) {

    const command = new PutCommand({
      TableName: this.tableName,
      Item: inventoryJson,
    });

    await docClient.send(command);

    return inventoryJson;
  }

  async reduceStock(
    productId,
    quantity
  ) {

    try {

      const command =
        new UpdateCommand({
          TableName: this.tableName,

          Key: {
            productId,
          },

          UpdateExpression:
            "SET availableStock = availableStock - :qty, updatedAt = :updatedAt",

          ConditionExpression:
            "availableStock >= :qty",

          ExpressionAttributeValues: {
            ":qty": quantity,
            ":updatedAt":
              new Date().toISOString(),
          },

          ReturnValues: "ALL_NEW",
        });

      const response =
        await docClient.send(command);

      return response.Attributes;

    } catch (err) {

      if (
        err.name ===
        "ConditionalCheckFailedException"
      ) {
        throw new ConflictError(
          `Insufficient stock for product ${productId} to reduce by ${quantity}`
        );
      }

      throw err;
    }
  }
}

module.exports =
  new InventoryRepository();