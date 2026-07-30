const Payment = require("../models/Payment");
const paymentRepository = require("../repositories/paymentRepository");
const { NotFoundError, BadRequestError } = require("../utils/errors");

class PaymentService {
  async createPayment(data) {
    // Check if order already has payments
    const existingPayments = await paymentRepository.getByOrder(data.orderId);
    const hasCompleted = existingPayments.some((p) => p.paymentStatus === "COMPLETED");
    if (hasCompleted) {
      throw new BadRequestError(`Order ${data.orderId} is already paid`);
    }

    const payment = new Payment(data);
    
    // Simulate payment authorization/charge gateway logic.
    // In production, we would integrate Stripe/BrainTree here.
    // For this Serverless SDK context, we simulate immediate completion:
    payment.updateStatus("COMPLETED");

    return await paymentRepository.create(payment.toJSON());
  }

  async getPayment(paymentId) {
    const payment = await paymentRepository.getById(paymentId);
    if (!payment) {
      throw new NotFoundError(`Payment with ID ${paymentId} not found`);
    }
    return payment;
  }

  async refundPayment(data) {
    const { paymentId, amount } = data;
    const paymentData = await paymentRepository.getById(paymentId);
    if (!paymentData) {
      throw new NotFoundError(`Payment with ID ${paymentId} not found`);
    }

    const payment = new Payment(paymentData);
    if (payment.paymentStatus === "REFUNDED") {
      return paymentData;
    }

    if (amount > payment.amount) {
      throw new BadRequestError(`Refund amount ($${amount}) exceeds transaction amount ($${payment.amount})`);
    }

    payment.updateStatus("REFUNDED");
    // Update amount if partial refund is supported, but here we update status.
    return await paymentRepository.update(payment.toJSON());
  }

  async getPaymentStatus(paymentId) {
    const payment = await this.getPayment(paymentId);
    return {
      paymentId: payment.paymentId,
      paymentStatus: payment.paymentStatus,
      transactionId: payment.transactionId,
    };
  }
}

module.exports = new PaymentService();
