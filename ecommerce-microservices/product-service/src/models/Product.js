const { v4: uuidv4 } = require("uuid");

class Product {
  constructor({
    productId = null,
    name,
    description,
    category,
    price,
    imageUrl,
    createdAt = null,
    updatedAt = null,
  }) {
    this.productId = productId || uuidv4();
    this.name = name;
    this.description = description;
    this.category = category;
    this.price = Number(price);
    this.imageUrl = imageUrl;
    this.createdAt = createdAt || new Date().toISOString();
    this.updatedAt = updatedAt || new Date().toISOString();
  }

  update({ name, description, category, price, imageUrl }) {
    if (name !== undefined) this.name = name;
    if (description !== undefined) this.description = description;
    if (category !== undefined) this.category = category;
    if (price !== undefined) this.price = Number(price);
    if (imageUrl !== undefined) this.imageUrl = imageUrl;
    this.updatedAt = new Date().toISOString();
  }

  toJSON() {
    return {
      productId: this.productId,
      name: this.name,
      description: this.description,
      category: this.category,
      price: this.price,
      imageUrl: this.imageUrl,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}

module.exports = Product;
