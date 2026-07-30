class CartItem {
  constructor({
    userId,
    productId,
    quantity,
    productName,
    price,
    imageUrl = "",
    createdAt = null,
  }) {
    this.userId = userId;
    this.productId = productId;
    this.quantity = Number(quantity);
    this.productName = productName;
    this.price = Number(price);

    // Save product image
    this.imageUrl = imageUrl;

    this.createdAt =
      createdAt || new Date().toISOString();
  }

  updateQuantity(quantity) {
    this.quantity = Number(quantity);
  }

  incrementQuantity(quantity) {
    this.quantity += Number(quantity);
  }

  toJSON() {
    return {
      userId: this.userId,
      productId: this.productId,
      quantity: this.quantity,
      productName: this.productName,
      price: this.price,

      // Include image URL in DynamoDB
      imageUrl: this.imageUrl,

      createdAt: this.createdAt,
    };
  }
}

module.exports = CartItem;