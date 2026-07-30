const Inventory = require("../models/Inventory");
const inventoryRepository = require("../repositories/inventoryRepository");
const { NotFoundError } = require("../utils/errors");

class InventoryService {

  async addInventory(data) {

    const existing =
      await inventoryRepository.getById(
        data.productId
      );

    if (existing) {

      const inventory =
        new Inventory(existing);

      inventory.availableStock +=
        Number(data.availableStock);

      inventory.updatedAt =
        new Date().toISOString();

      return await inventoryRepository.update(
        inventory.toJSON()
      );
    }

    const inventory =
      new Inventory(data);

    return await inventoryRepository.create(
      inventory.toJSON()
    );
  }

  // NEW METHOD
  async getAllInventory() {

    const inventoryList =
      await inventoryRepository.getAll();

    return inventoryList || [];
  }

  async getInventory(productId) {

    const inventoryData =
      await inventoryRepository.getById(
        productId
      );

    if (!inventoryData) {
      throw new NotFoundError(
        `Inventory not found for product ${productId}`
      );
    }

    return inventoryData;
  }

  async updateInventory(
    productId,
    data
  ) {

    const inventoryData =
      await inventoryRepository.getById(
        productId
      );

    if (!inventoryData) {
      throw new NotFoundError(
        `Inventory not found for product ${productId}`
      );
    }

    const inventory =
      new Inventory(inventoryData);

    inventory.update(data);

    return await inventoryRepository.update(
      inventory.toJSON()
    );
  }

  async reduceStock(
    productId,
    quantity
  ) {

    const inventoryData =
      await inventoryRepository.getById(
        productId
      );

    if (!inventoryData) {
      throw new NotFoundError(
        `Inventory not found for product ${productId}`
      );
    }

    return await inventoryRepository.reduceStock(
      productId,
      quantity
    );
  }

  async checkAvailability(
    productId,
    quantity
  ) {

    const inventoryData =
      await inventoryRepository.getById(
        productId
      );

    if (!inventoryData) {
      return {
        productId,
        available: false,
        availableStock: 0
      };
    }

    const available =
      inventoryData.availableStock >= quantity;

    return {
      productId,
      available,
      availableStock:
        inventoryData.availableStock
    };
  }
}

module.exports = new InventoryService();