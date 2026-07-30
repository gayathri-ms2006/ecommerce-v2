const { v4: uuidv4 } = require("uuid");

class Payment {
  constructor({
    paymentId = null,
    orderId,
    amount,
    paymentMethod,
    paymentStatus = "PENDING",
    transactionId = null,
    createdAt = null,
  }) {
    this.paymentId = paymentId || uuidv4();
    this.orderId = orderId;
    this.amount = Number(amount);
    this.paymentMethod = paymentMethod;
    this.paymentStatus = paymentStatus;
    this.transactionId = transactionId || `txn_${uuidv4().substring(0, 8)}`;
    this.createdAt = createdAt || new Date().toISOString();
  }

  updateStatus(status) {
    this.paymentStatus = status;
  }

  toJSON() {
    return {
      paymentId: this.paymentId,
      orderId: this.orderId,
      amount: this.amount,
      paymentMethod: this.paymentMethod,
      paymentStatus: this.paymentStatus,
      transactionId: this.transactionId,
      createdAt: this.createdAt,
    };
  }
}

module.exports = Payment;
