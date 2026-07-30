class Wishlist {
  constructor({
    userId,
    productId,
    productName,

    // Frontend fields
    price,
    imageUrl,

    // Optional internal fields
    productPrice,
    productImage,

    priceWhenAdded,
    addedAt = null
  }) {
    this.userId = userId;
    this.productId = productId;
    this.productName = productName;

    // Support both field names
    const resolvedPrice =
      productPrice !== undefined
        ? productPrice
        : price;

    this.productPrice = Number(resolvedPrice);

    if (Number.isNaN(this.productPrice)) {
      throw new Error("Invalid product price");
    }

    this.productImage =
      productImage ||
      imageUrl ||
      "";

    this.priceWhenAdded =
      priceWhenAdded !== undefined
        ? Number(priceWhenAdded)
        : this.productPrice;

    if (Number.isNaN(this.priceWhenAdded)) {
      this.priceWhenAdded = this.productPrice;
    }

    this.addedAt =
      addedAt || new Date().toISOString();
  }

  /**
   * Future Price Drop Tracking
   */
  getPriceDifference() {
    return this.priceWhenAdded - this.productPrice;
  }

  hasPriceDropped() {
    return this.productPrice < this.priceWhenAdded;
  }

  /**
   * Future Move-To-Cart Feature
   */
  toCartItem(quantity = 1) {
    return {
      userId: this.userId,
      productId: this.productId,
      productName: this.productName,
      price: this.productPrice,
      quantity: Number(quantity)
    };
  }

  toJSON() {
    return {
      userId: this.userId,
      productId: this.productId,
      productName: this.productName,
      productPrice: this.productPrice,
      productImage: this.productImage,
      priceWhenAdded: this.priceWhenAdded,
      addedAt: this.addedAt
    };
  }
}

module.exports = Wishlist;