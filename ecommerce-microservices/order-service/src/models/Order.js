const { v4: uuidv4 } = require("uuid");

class Order {
  constructor({
    orderId = null,
    userId,
    customerName = "",
    customerEmail = "",
    products,
    totalAmount = null,
    orderStatus = "PENDING",
    createdAt = null,
    updatedAt = null,
  }) {
    this.orderId = orderId || uuidv4();

    this.userId = userId;

    // New customer metadata
    this.customerName = customerName;
    this.customerEmail = customerEmail;

    this.products = products;

    this.totalAmount =
      totalAmount !== null
        ? Number(totalAmount)
        : this.calculateTotalAmount(products);

    this.orderStatus = orderStatus;

    this.createdAt =
      createdAt || new Date().toISOString();

    this.updatedAt =
      updatedAt || new Date().toISOString();
  }

  calculateTotalAmount(products) {
    return Number(
      products
        .reduce(
          (acc, curr) =>
            acc + curr.price * curr.quantity,
          0
        )
        .toFixed(2)
    );
  }

  updateStatus(status) {
    this.orderStatus = status;
    this.updatedAt = new Date().toISOString();
  }

  toJSON() {
    return {
      orderId: this.orderId,

      userId: this.userId,

      // New fields
      customerName: this.customerName,
      customerEmail: this.customerEmail,

      products: this.products,

      totalAmount: this.totalAmount,

      orderStatus: this.orderStatus,

      createdAt: this.createdAt,

      updatedAt: this.updatedAt,
    };
  }
}

module.exports = Order;