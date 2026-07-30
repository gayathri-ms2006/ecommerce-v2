const orderService = require("./orderService");
const orderRepository = require("../repositories/orderRepository");
const inventoryIntegrationService = require("./inventoryIntegrationService");
const paymentIntegrationService = require("./paymentIntegrationService");
const Order = require("../models/Order");
const snsPublisher = require("../utils/snsPublisher");
const { NotFoundError, BadRequestError } = require("../utils/errors");

// Mock dependencies
jest.mock("../repositories/orderRepository", () => {
  return {
    create: jest.fn(),
    getById: jest.fn(),
    update: jest.fn(),
    getByUser: jest.fn(),
    list: jest.fn()
  };
});
jest.mock("./inventoryIntegrationService", () => {
  return {
    checkAvailability: jest.fn(),
    reduceStock: jest.fn(),
    restoreStock: jest.fn()
  };
});
jest.mock("./paymentIntegrationService", () => {
  return {
    createPayment: jest.fn()
  };
});
jest.mock("../utils/snsPublisher", () => {
  return {
    publishOrderCreated: jest.fn()
  };
});
jest.mock("../models/Order");

jest.mock("../utils/errors", () => {
  class AppError extends Error {
    constructor(message, statusCode) {
      super(message);
      this.statusCode = statusCode;
    }
  }
  class NotFoundError extends AppError {
    constructor(message) {
      super(message, 404);
      this.name = "NotFoundError";
    }
  }
  class BadRequestError extends AppError {
    constructor(message) {
      super(message, 400);
      this.name = "BadRequestError";
    }
  }
  return { NotFoundError, BadRequestError };
});

describe("OrderService Unit Tests", () => {
  const mockOrderData = {
    orderId: "order-123",
    userId: "user-123",
    customerName: "John Doe",
    customerEmail: "john@example.com",
    products: [
      { productId: "prod-1", productName: "Product 1", price: 10, quantity: 2 },
      { productId: "prod-2", productName: "Product 2", price: 15, quantity: 1 }
    ],
    totalAmount: 35,
    orderStatus: "PENDING",
    createdAt: "2026-07-30T11:46:00.000Z",
    updatedAt: "2026-07-30T11:46:00.000Z"
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("createOrder", () => {
    it("should successfully create order and handle completed payment status", async () => {
      // Arrange
      inventoryIntegrationService.checkAvailability
        .mockResolvedValueOnce({ productId: "prod-1", available: true, availableStock: 10 })
        .mockResolvedValueOnce({ productId: "prod-2", available: true, availableStock: 5 });

      inventoryIntegrationService.reduceStock.mockResolvedValue({ success: true });

      const mockOrderInstance = {
        orderId: mockOrderData.orderId,
        userId: mockOrderData.userId,
        customerName: mockOrderData.customerName,
        customerEmail: mockOrderData.customerEmail,
        products: mockOrderData.products,
        totalAmount: mockOrderData.totalAmount,
        orderStatus: "PENDING",
        updateStatus: jest.fn().mockImplementation(function (status) {
          this.orderStatus = status;
        }),
        toJSON: jest.fn().mockImplementation(function () {
          return {
            orderId: this.orderId,
            userId: this.userId,
            customerName: this.customerName,
            customerEmail: this.customerEmail,
            products: this.products,
            totalAmount: this.totalAmount,
            orderStatus: this.orderStatus,
            createdAt: mockOrderData.createdAt,
            updatedAt: mockOrderData.updatedAt
          };
        })
      };
      Order.mockImplementation(() => mockOrderInstance);

      orderRepository.create.mockResolvedValue(mockOrderData);
      paymentIntegrationService.createPayment.mockResolvedValue({
        paymentId: "pay-123",
        paymentStatus: "COMPLETED",
        transactionId: "txn-123"
      });
      orderRepository.update.mockImplementation(async (data) => data);

      // Act
      const result = await orderService.createOrder({
        userId: "user-123",
        customerName: "John Doe",
        customerEmail: "john@example.com",
        paymentMethod: "CREDIT_CARD",
        products: mockOrderData.products
      });

      // Assert
      expect(inventoryIntegrationService.checkAvailability).toHaveBeenNthCalledWith(1, "prod-1", 2);
      expect(inventoryIntegrationService.checkAvailability).toHaveBeenNthCalledWith(2, "prod-2", 1);
      expect(inventoryIntegrationService.reduceStock).toHaveBeenNthCalledWith(1, "prod-1", 2);
      expect(inventoryIntegrationService.reduceStock).toHaveBeenNthCalledWith(2, "prod-2", 1);
      expect(orderRepository.create).toHaveBeenCalledWith({
        ...mockOrderData,
        orderStatus: "PENDING"
      });
      expect(paymentIntegrationService.createPayment).toHaveBeenCalledWith(
        mockOrderData.orderId,
        mockOrderData.totalAmount,
        "CREDIT_CARD"
      );
      expect(mockOrderInstance.updateStatus).toHaveBeenCalledWith("PAID");
      expect(orderRepository.update).toHaveBeenCalled();
      expect(snsPublisher.publishOrderCreated).toHaveBeenCalledWith({
        ...mockOrderData,
        orderStatus: "PAID"
      });
      expect(result.orderStatus).toBe("PAID");
    });

    it("should throw BadRequestError if product is unavailable", async () => {
      // Arrange
      inventoryIntegrationService.checkAvailability.mockResolvedValueOnce({
        productId: "prod-1",
        available: false,
        availableStock: 1
      });

      // Act & Assert
      await expect(
        orderService.createOrder({
          userId: "user-123",
          customerName: "John Doe",
          customerEmail: "john@example.com",
          paymentMethod: "CREDIT_CARD",
          products: mockOrderData.products
        })
      ).rejects.toThrow(BadRequestError);

      expect(inventoryIntegrationService.checkAvailability).toHaveBeenCalledWith("prod-1", 2);
      expect(inventoryIntegrationService.reduceStock).not.toHaveBeenCalled();
      expect(Order).not.toHaveBeenCalled();
    });

    it("should rollback reduced stocks if stock reduction fails midway", async () => {
      // Arrange
      inventoryIntegrationService.checkAvailability
        .mockResolvedValueOnce({ productId: "prod-1", available: true, availableStock: 10 })
        .mockResolvedValueOnce({ productId: "prod-2", available: true, availableStock: 5 });

      inventoryIntegrationService.reduceStock
        .mockResolvedValueOnce({ success: true }) // First succeeds
        .mockRejectedValueOnce(new Error("Database offline")); // Second fails

      inventoryIntegrationService.restoreStock.mockResolvedValue({ success: true });

      // Act & Assert
      await expect(
        orderService.createOrder({
          userId: "user-123",
          customerName: "John Doe",
          customerEmail: "john@example.com",
          paymentMethod: "CREDIT_CARD",
          products: mockOrderData.products
        })
      ).rejects.toThrow("Database offline");

      expect(inventoryIntegrationService.reduceStock).toHaveBeenCalledTimes(2);
      expect(inventoryIntegrationService.restoreStock).toHaveBeenCalledWith("prod-1", 2);
      expect(inventoryIntegrationService.restoreStock).not.toHaveBeenCalledWith("prod-2", 1);
    });

    it("should handle error if restore stock fails during rollback", async () => {
      // Arrange
      inventoryIntegrationService.checkAvailability
        .mockResolvedValueOnce({ productId: "prod-1", available: true, availableStock: 10 })
        .mockResolvedValueOnce({ productId: "prod-2", available: true, availableStock: 5 });

      inventoryIntegrationService.reduceStock
        .mockResolvedValueOnce({ success: true })
        .mockRejectedValueOnce(new Error("Stock reduction failed"));

      inventoryIntegrationService.restoreStock.mockRejectedValue(new Error("Restore endpoint failed"));

      // Act & Assert
      await expect(
        orderService.createOrder({
          userId: "user-123",
          customerName: "John Doe",
          customerEmail: "john@example.com",
          paymentMethod: "CREDIT_CARD",
          products: mockOrderData.products
        })
      ).rejects.toThrow("Stock reduction failed");

      expect(inventoryIntegrationService.restoreStock).toHaveBeenCalledWith("prod-1", 2);
    });

    it("should fail payment and restore stock, and mark order FAILED", async () => {
      // Arrange
      inventoryIntegrationService.checkAvailability
        .mockResolvedValueOnce({ productId: "prod-1", available: true, availableStock: 10 })
        .mockResolvedValueOnce({ productId: "prod-2", available: true, availableStock: 5 });

      inventoryIntegrationService.reduceStock.mockResolvedValue({ success: true });

      const mockOrderInstance = {
        orderId: mockOrderData.orderId,
        userId: mockOrderData.userId,
        customerName: mockOrderData.customerName,
        customerEmail: mockOrderData.customerEmail,
        products: mockOrderData.products,
        totalAmount: mockOrderData.totalAmount,
        orderStatus: "PENDING",
        updateStatus: jest.fn().mockImplementation(function (status) {
          this.orderStatus = status;
        }),
        toJSON: jest.fn().mockImplementation(function () {
          return {
            orderId: this.orderId,
            userId: this.userId,
            customerName: this.customerName,
            customerEmail: this.customerEmail,
            products: this.products,
            totalAmount: this.totalAmount,
            orderStatus: this.orderStatus,
            createdAt: mockOrderData.createdAt,
            updatedAt: mockOrderData.updatedAt
          };
        })
      };
      Order.mockImplementation(() => mockOrderInstance);

      orderRepository.create.mockResolvedValue(mockOrderData);
      // Mock payment return incomplete
      paymentIntegrationService.createPayment.mockResolvedValue({
        paymentId: "pay-123",
        paymentStatus: "INCOMPLETE"
      });
      inventoryIntegrationService.restoreStock.mockResolvedValue({ success: true });
      orderRepository.update.mockImplementation(async (data) => data);

      // Act & Assert
      await expect(
        orderService.createOrder({
          userId: "user-123",
          customerName: "John Doe",
          customerEmail: "john@example.com",
          paymentMethod: "CREDIT_CARD",
          products: mockOrderData.products
        })
      ).rejects.toThrow(BadRequestError);

      expect(paymentIntegrationService.createPayment).toHaveBeenCalled();
      expect(inventoryIntegrationService.restoreStock).toHaveBeenNthCalledWith(1, "prod-1", 2);
      expect(inventoryIntegrationService.restoreStock).toHaveBeenNthCalledWith(2, "prod-2", 1);
      expect(mockOrderInstance.updateStatus).toHaveBeenCalledWith("FAILED");
      expect(orderRepository.update).toHaveBeenCalled();
    });

    it("should handle rollback failures on restore stock if payment fails", async () => {
      // Arrange
      inventoryIntegrationService.checkAvailability
        .mockResolvedValueOnce({ productId: "prod-1", available: true, availableStock: 10 });

      inventoryIntegrationService.reduceStock.mockResolvedValue({ success: true });

      const mockOrderInstance = {
        orderId: mockOrderData.orderId,
        userId: mockOrderData.userId,
        customerName: mockOrderData.customerName,
        customerEmail: mockOrderData.customerEmail,
        products: [mockOrderData.products[0]],
        totalAmount: mockOrderData.totalAmount,
        orderStatus: "PENDING",
        updateStatus: jest.fn(),
        toJSON: jest.fn().mockReturnValue(mockOrderData)
      };
      Order.mockImplementation(() => mockOrderInstance);

      orderRepository.create.mockResolvedValue(mockOrderData);
      paymentIntegrationService.createPayment.mockRejectedValue(new Error("Gateway Error"));
      inventoryIntegrationService.restoreStock.mockRejectedValue(new Error("Restore failure"));
      orderRepository.update.mockResolvedValue(mockOrderData);

      // Act & Assert
      await expect(
        orderService.createOrder({
          userId: "user-123",
          customerName: "John Doe",
          customerEmail: "john@example.com",
          paymentMethod: "CREDIT_CARD",
          products: [mockOrderData.products[0]]
        })
      ).rejects.toThrow(BadRequestError);

      expect(inventoryIntegrationService.restoreStock).toHaveBeenCalledWith("prod-1", 2);
      expect(mockOrderInstance.updateStatus).toHaveBeenCalledWith("FAILED");
    });
  });

  describe("getOrder", () => {
    it("should successfully return order details if found", async () => {
      // Arrange
      orderRepository.getById.mockResolvedValue(mockOrderData);

      // Act
      const result = await orderService.getOrder("order-123");

      // Assert
      expect(orderRepository.getById).toHaveBeenCalledWith("order-123");
      expect(result).toEqual(mockOrderData);
    });

    it("should throw NotFoundError if order is not found", async () => {
      // Arrange
      orderRepository.getById.mockResolvedValue(null);

      // Act & Assert
      await expect(
        orderService.getOrder("order-123")
      ).rejects.toThrow(NotFoundError);
      expect(orderRepository.getById).toHaveBeenCalledWith("order-123");
    });
  });

  describe("cancelOrder", () => {
    it("should throw NotFoundError if order is not found", async () => {
      // Arrange
      orderRepository.getById.mockResolvedValue(null);

      // Act & Assert
      await expect(
        orderService.cancelOrder("order-123")
      ).rejects.toThrow(NotFoundError);
    });

    it("should return the order unchanged if status is already CANCELLED", async () => {
      // Arrange
      const cancelledOrder = { ...mockOrderData, orderStatus: "CANCELLED" };
      orderRepository.getById.mockResolvedValue(cancelledOrder);

      const mockOrderInstance = {
        orderStatus: "CANCELLED"
      };
      Order.mockImplementation(() => mockOrderInstance);

      // Act
      const result = await orderService.cancelOrder("order-123");

      // Assert
      expect(orderRepository.getById).toHaveBeenCalledWith("order-123");
      expect(inventoryIntegrationService.restoreStock).not.toHaveBeenCalled();
      expect(orderRepository.update).not.toHaveBeenCalled();
      expect(result).toEqual(cancelledOrder);
    });

    it("should restore stock and set status to CANCELLED for PAID order", async () => {
      // Arrange
      const paidOrder = { ...mockOrderData, orderStatus: "PAID" };
      orderRepository.getById.mockResolvedValue(paidOrder);

      const mockOrderInstance = {
        orderId: mockOrderData.orderId,
        products: mockOrderData.products,
        orderStatus: "PAID",
        updateStatus: jest.fn().mockImplementation(function (status) {
          this.orderStatus = status;
        }),
        toJSON: jest.fn().mockImplementation(function () {
          return {
            ...paidOrder,
            orderStatus: this.orderStatus
          };
        })
      };
      Order.mockImplementation(() => mockOrderInstance);
      inventoryIntegrationService.restoreStock.mockResolvedValue({ success: true });
      orderRepository.update.mockImplementation(async (data) => data);

      // Act
      const result = await orderService.cancelOrder("order-123");

      // Assert
      expect(inventoryIntegrationService.restoreStock).toHaveBeenNthCalledWith(1, "prod-1", 2);
      expect(inventoryIntegrationService.restoreStock).toHaveBeenNthCalledWith(2, "prod-2", 1);
      expect(mockOrderInstance.updateStatus).toHaveBeenCalledWith("CANCELLED");
      expect(orderRepository.update).toHaveBeenCalled();
      expect(result.orderStatus).toBe("CANCELLED");
    });

    it("should set status to CANCELLED for other status (e.g. FAILED) without restoring stock", async () => {
      // Arrange
      const failedOrder = { ...mockOrderData, orderStatus: "FAILED" };
      orderRepository.getById.mockResolvedValue(failedOrder);

      const mockOrderInstance = {
        orderId: mockOrderData.orderId,
        products: mockOrderData.products,
        orderStatus: "FAILED",
        updateStatus: jest.fn().mockImplementation(function (status) {
          this.orderStatus = status;
        }),
        toJSON: jest.fn().mockImplementation(function () {
          return {
            ...failedOrder,
            orderStatus: this.orderStatus
          };
        })
      };
      Order.mockImplementation(() => mockOrderInstance);
      orderRepository.update.mockImplementation(async (data) => data);

      // Act
      const result = await orderService.cancelOrder("order-123");

      // Assert
      expect(inventoryIntegrationService.restoreStock).not.toHaveBeenCalled();
      expect(mockOrderInstance.updateStatus).toHaveBeenCalledWith("CANCELLED");
      expect(orderRepository.update).toHaveBeenCalled();
      expect(result.orderStatus).toBe("CANCELLED");
    });

    it("should handle error if restore stock fails during cancelOrder", async () => {
      // Arrange
      const paidOrder = { ...mockOrderData, orderStatus: "PAID" };
      orderRepository.getById.mockResolvedValue(paidOrder);

      const mockOrderInstance = {
        orderId: mockOrderData.orderId,
        products: mockOrderData.products,
        orderStatus: "PAID",
        updateStatus: jest.fn(),
        toJSON: jest.fn().mockReturnValue({ ...paidOrder, orderStatus: "CANCELLED" })
      };
      Order.mockImplementation(() => mockOrderInstance);
      inventoryIntegrationService.restoreStock.mockRejectedValue(new Error("Restore endpoint down"));
      orderRepository.update.mockImplementation(async (data) => data);

      // Act
      const result = await orderService.cancelOrder("order-123");

      // Assert
      expect(inventoryIntegrationService.restoreStock).toHaveBeenCalledTimes(2);
      expect(mockOrderInstance.updateStatus).toHaveBeenCalledWith("CANCELLED");
      expect(orderRepository.update).toHaveBeenCalled();
      expect(result.orderStatus).toBe("CANCELLED");
    });
  });

  describe("listOrders", () => {
    it("should return orders of user when userId is provided", async () => {
      // Arrange
      const mockOrdersList = [mockOrderData];
      orderRepository.getByUser.mockResolvedValue(mockOrdersList);

      // Act
      const result = await orderService.listOrders("user-123");

      // Assert
      expect(orderRepository.getByUser).toHaveBeenCalledWith("user-123");
      expect(orderRepository.list).not.toHaveBeenCalled();
      expect(result).toEqual(mockOrdersList);
    });

    it("should return all orders when userId is not provided", async () => {
      // Arrange
      const mockOrdersList = [mockOrderData];
      orderRepository.list.mockResolvedValue(mockOrdersList);

      // Act
      const result = await orderService.listOrders();

      // Assert
      expect(orderRepository.list).toHaveBeenCalled();
      expect(orderRepository.getByUser).not.toHaveBeenCalled();
      expect(result).toEqual(mockOrdersList);
    });
  });

  describe("trackOrder", () => {
    it("should return tracking details with delivery estimates", async () => {
      // Arrange
      orderRepository.getById.mockResolvedValue(mockOrderData);

      // Act
      const result = await orderService.trackOrder("order-123");

      // Assert
      expect(orderRepository.getById).toHaveBeenCalledWith("order-123");
      expect(result.orderId).toBe(mockOrderData.orderId);
      expect(result.orderStatus).toBe(mockOrderData.orderStatus);
      expect(result.trackingInfo.carrier).toBe("USPSServerless");
      expect(result.trackingInfo.trackingNumber).toBe("TXNORDER-12");
      expect(result.trackingInfo.estimatedDelivery).toBe(
        new Date(new Date(mockOrderData.createdAt).getTime() + 3 * 24 * 60 * 60 * 1000).toISOString()
      );
    });
  });
});
