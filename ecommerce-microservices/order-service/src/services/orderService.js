const Order = require("../models/Order");
const orderRepository = require("../repositories/orderRepository");
const inventoryIntegrationService = require("./inventoryIntegrationService");
const paymentIntegrationService = require("./paymentIntegrationService");
const { NotFoundError, BadRequestError } = require("../utils/errors");
const snsPublisher = require("../utils/snsPublisher");

class OrderService {

  async createOrder(data) {

    const {
      userId,
      products,
      paymentMethod,
      customerName,
      customerEmail
    } = data;

    // 1. Verify stock availability for all products
    for (const item of products) {

      const stock =
        await inventoryIntegrationService.checkAvailability(
          item.productId,
          item.quantity
        );

      if (!stock.available) {
        throw new BadRequestError(
          `Product ${item.productId} (${item.productName}) has insufficient stock. Available: ${stock.availableStock}`
        );
      }
    }

    const reducedProducts = [];

    try {

      // 2. Reduce inventory stock
      for (const item of products) {

        await inventoryIntegrationService.reduceStock(
          item.productId,
          item.quantity
        );

        reducedProducts.push(item);
      }

    } catch (err) {

      console.warn(
        "Stock reduction failed, initiating rollback compensation...",
        err
      );

      for (const item of reducedProducts) {

        try {

          await inventoryIntegrationService.restoreStock(
            item.productId,
            item.quantity
          );

        } catch (rollbackErr) {

          console.error(
            `Failed to restore stock for product ${item.productId}:`,
            rollbackErr
          );
        }
      }

      throw err;
    }

    // 3. Create Order
    const order = new Order({
      userId,
      customerName,
      customerEmail,
      products
    });

    const orderJson = order.toJSON();

    await orderRepository.create(orderJson);

    // 4. Create Payment
    try {

      const paymentResult =
        await paymentIntegrationService.createPayment(
          orderJson.orderId,
          orderJson.totalAmount,
          paymentMethod
        );

      if (paymentResult.paymentStatus === "COMPLETED") {

        order.updateStatus("PAID");

        const updatedOrder =
          await orderRepository.update(
            order.toJSON()
          );

        await snsPublisher.publishOrderCreated(
          updatedOrder
        );

        console.log(
          `ORDER_CREATED event published for order ${updatedOrder.orderId}`
        );

        return updatedOrder;
      }

      throw new Error(
        "Payment status incomplete"
      );

    } catch (paymentErr) {

      console.error(
        "Payment failed, initiating inventory restore and order marking...",
        paymentErr
      );

      for (const item of products) {

        try {

          await inventoryIntegrationService.restoreStock(
            item.productId,
            item.quantity
          );

        } catch (rollbackErr) {

          console.error(
            `Rollback restore failed for product ${item.productId}:`,
            rollbackErr
          );
        }
      }

      order.updateStatus("FAILED");

      await orderRepository.update(
        order.toJSON()
      );

      throw new BadRequestError(
        `Checkout failed due to payment gateway error: ${paymentErr.message}`
      );
    }
  }

  async getOrder(orderId) {

    const order =
      await orderRepository.getById(orderId);

    if (!order) {

      throw new NotFoundError(
        `Order with ID ${orderId} not found`
      );
    }

    return order;
  }

  async cancelOrder(orderId) {

    const orderData =
      await orderRepository.getById(orderId);

    if (!orderData) {

      throw new NotFoundError(
        `Order with ID ${orderId} not found`
      );
    }

    const order = new Order(orderData);

    if (order.orderStatus === "CANCELLED") {
      return orderData;
    }

    if (
      order.orderStatus === "PAID" ||
      order.orderStatus === "PENDING"
    ) {

      console.log(
        `Order ${orderId} cancelled, restoring items stock...`
      );

      for (const item of order.products) {

        try {

          await inventoryIntegrationService.restoreStock(
            item.productId,
            item.quantity
          );

        } catch (err) {

          console.error(
            `Failed to restore stock for product ${item.productId} on cancel:`,
            err
          );
        }
      }
    }

    order.updateStatus("CANCELLED");

    return await orderRepository.update(
      order.toJSON()
    );
  }

  async listOrders(userId = null) {

    if (userId) {

      return await orderRepository.getByUser(
        userId
      );
    }

    return await orderRepository.list();
  }

  async trackOrder(orderId) {

    const order =
      await this.getOrder(orderId);

    return {

      orderId: order.orderId,

      orderStatus: order.orderStatus,

      updatedAt: order.updatedAt,

      trackingInfo: {

        carrier: "USPSServerless",

        trackingNumber:
          `TXN${order.orderId
            .substring(0, 8)
            .toUpperCase()}`,

        estimatedDelivery:
          new Date(
            new Date(order.createdAt).getTime() +
            3 * 24 * 60 * 60 * 1000
          ).toISOString()
      }
    };
  }
}

module.exports = new OrderService();