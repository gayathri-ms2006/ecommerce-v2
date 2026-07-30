class Inventory {
  constructor({
    productId,
    availableStock = 0,
    lowStockThreshold = 5,
    warehouseLocation,
    updatedAt = null,
  }) {
    this.productId = productId;
    this.availableStock = Number(availableStock);
    this.lowStockThreshold = Number(lowStockThreshold);
    this.warehouseLocation = warehouseLocation;
    this.updatedAt = updatedAt || new Date().toISOString();
  }

  update({ availableStock, lowStockThreshold, warehouseLocation }) {
    if (availableStock !== undefined) this.availableStock = Number(availableStock);
    if (lowStockThreshold !== undefined) this.lowStockThreshold = Number(lowStockThreshold);
    if (warehouseLocation !== undefined) this.warehouseLocation = warehouseLocation;
    this.updatedAt = new Date().toISOString();
  }

  toJSON() {
    return {
      productId: this.productId,
      availableStock: this.availableStock,
      lowStockThreshold: this.lowStockThreshold,
      warehouseLocation: this.warehouseLocation,
      updatedAt: this.updatedAt,
    };
  }
}

module.exports = Inventory;
