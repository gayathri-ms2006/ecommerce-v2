const paymentService = require("./paymentService");
const paymentRepository = require("../repositories/paymentRepository");
const Payment = require("../models/Payment");
const { NotFoundError, BadRequestError } = require("../utils/errors");

// Mock dependencies
jest.mock("../repositories/paymentRepository");
jest.mock("../models/Payment");
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

describe("PaymentService Unit Tests", () => {
  const mockPaymentId = "pay-123";
  const mockOrderId = "order-123";
  const mockPaymentData = {
    paymentId: mockPaymentId,
    orderId: mockOrderId,
    amount: 150.00,
    paymentMethod: "CREDIT_CARD",
    paymentStatus: "COMPLETED",
    transactionId: "txn-123",
    createdAt: "2026-07-30T11:46:00.000Z"
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("createPayment", () => {
    it("should throw BadRequestError if order is already paid (has completed payment)", async () => {
      // Arrange
      paymentRepository.getByOrder.mockResolvedValue([
        { ...mockPaymentData, paymentStatus: "COMPLETED" }
      ]);

      // Act & Assert
      await expect(
        paymentService.createPayment({
          orderId: mockOrderId,
          amount: 150.00,
          paymentMethod: "CREDIT_CARD"
        })
      ).rejects.toThrow(BadRequestError);

      expect(paymentRepository.getByOrder).toHaveBeenCalledWith(mockOrderId);
      expect(Payment).not.toHaveBeenCalled();
      expect(paymentRepository.create).not.toHaveBeenCalled();
    });

    it("should create payment successfully if there are no existing completed payments for the order", async () => {
      // Arrange
      paymentRepository.getByOrder.mockResolvedValue([
        { ...mockPaymentData, paymentStatus: "FAILED" }
      ]);

      const mockPaymentInstance = {
        paymentStatus: "PENDING",
        updateStatus: jest.fn().mockImplementation(function (status) {
          this.paymentStatus = status;
        }),
        toJSON: jest.fn().mockImplementation(function () {
          return {
            ...mockPaymentData,
            paymentStatus: this.paymentStatus
          };
        })
      };
      Payment.mockImplementation(() => mockPaymentInstance);
      paymentRepository.create.mockResolvedValue(mockPaymentData);

      const inputData = {
        orderId: mockOrderId,
        amount: 150.00,
        paymentMethod: "CREDIT_CARD"
      };

      // Act
      const result = await paymentService.createPayment(inputData);

      // Assert
      expect(paymentRepository.getByOrder).toHaveBeenCalledWith(mockOrderId);
      expect(Payment).toHaveBeenCalledWith(inputData);
      expect(mockPaymentInstance.updateStatus).toHaveBeenCalledWith("COMPLETED");
      expect(mockPaymentInstance.toJSON).toHaveBeenCalled();
      expect(paymentRepository.create).toHaveBeenCalledWith({
        ...mockPaymentData,
        paymentStatus: "COMPLETED"
      });
      expect(result).toEqual(mockPaymentData);
    });
  });

  describe("getPayment", () => {
    it("should successfully retrieve payment when it exists", async () => {
      // Arrange
      paymentRepository.getById.mockResolvedValue(mockPaymentData);

      // Act
      const result = await paymentService.getPayment(mockPaymentId);

      // Assert
      expect(paymentRepository.getById).toHaveBeenCalledWith(mockPaymentId);
      expect(result).toEqual(mockPaymentData);
    });

    it("should throw NotFoundError if payment is not found", async () => {
      // Arrange
      paymentRepository.getById.mockResolvedValue(null);

      // Act & Assert
      await expect(
        paymentService.getPayment(mockPaymentId)
      ).rejects.toThrow(NotFoundError);

      expect(paymentRepository.getById).toHaveBeenCalledWith(mockPaymentId);
    });
  });

  describe("refundPayment", () => {
    it("should throw NotFoundError if payment is not found", async () => {
      // Arrange
      paymentRepository.getById.mockResolvedValue(null);

      // Act & Assert
      await expect(
        paymentService.refundPayment({ paymentId: mockPaymentId, amount: 50 })
      ).rejects.toThrow(NotFoundError);

      expect(paymentRepository.getById).toHaveBeenCalledWith(mockPaymentId);
    });

    it("should return the payment unchanged if paymentStatus is already REFUNDED", async () => {
      // Arrange
      const refundedPayment = { ...mockPaymentData, paymentStatus: "REFUNDED" };
      paymentRepository.getById.mockResolvedValue(refundedPayment);

      const mockPaymentInstance = {
        paymentStatus: "REFUNDED"
      };
      Payment.mockImplementation(() => mockPaymentInstance);

      // Act
      const result = await paymentService.refundPayment({ paymentId: mockPaymentId, amount: 50 });

      // Assert
      expect(paymentRepository.getById).toHaveBeenCalledWith(mockPaymentId);
      expect(Payment).toHaveBeenCalledWith(refundedPayment);
      expect(paymentRepository.update).not.toHaveBeenCalled();
      expect(result).toEqual(refundedPayment);
    });

    it("should throw BadRequestError if refund amount exceeds original transaction amount", async () => {
      // Arrange
      paymentRepository.getById.mockResolvedValue(mockPaymentData); // amount is 150

      const mockPaymentInstance = {
        amount: mockPaymentData.amount,
        paymentStatus: "COMPLETED"
      };
      Payment.mockImplementation(() => mockPaymentInstance);

      // Act & Assert
      await expect(
        paymentService.refundPayment({ paymentId: mockPaymentId, amount: 200 })
      ).rejects.toThrow(BadRequestError);

      expect(paymentRepository.getById).toHaveBeenCalledWith(mockPaymentId);
      expect(Payment).toHaveBeenCalledWith(mockPaymentData);
      expect(paymentRepository.update).not.toHaveBeenCalled();
    });

    it("should update status to REFUNDED and update repository on successful refund", async () => {
      // Arrange
      paymentRepository.getById.mockResolvedValue(mockPaymentData);

      const mockPaymentInstance = {
        amount: mockPaymentData.amount,
        paymentStatus: "COMPLETED",
        updateStatus: jest.fn().mockImplementation(function (status) {
          this.paymentStatus = status;
        }),
        toJSON: jest.fn().mockImplementation(function () {
          return {
            ...mockPaymentData,
            paymentStatus: this.paymentStatus
          };
        })
      };
      Payment.mockImplementation(() => mockPaymentInstance);
      
      const refundedPaymentData = { ...mockPaymentData, paymentStatus: "REFUNDED" };
      paymentRepository.update.mockResolvedValue(refundedPaymentData);

      // Act
      const result = await paymentService.refundPayment({ paymentId: mockPaymentId, amount: 50 });

      // Assert
      expect(paymentRepository.getById).toHaveBeenCalledWith(mockPaymentId);
      expect(Payment).toHaveBeenCalledWith(mockPaymentData);
      expect(mockPaymentInstance.updateStatus).toHaveBeenCalledWith("REFUNDED");
      expect(paymentRepository.update).toHaveBeenCalledWith(refundedPaymentData);
      expect(result).toEqual(refundedPaymentData);
    });
  });

  describe("getPaymentStatus", () => {
    it("should return the status details of the payment", async () => {
      // Arrange
      paymentRepository.getById.mockResolvedValue(mockPaymentData);

      // Act
      const result = await paymentService.getPaymentStatus(mockPaymentId);

      // Assert
      expect(paymentRepository.getById).toHaveBeenCalledWith(mockPaymentId);
      expect(result).toEqual({
        paymentId: mockPaymentData.paymentId,
        paymentStatus: mockPaymentData.paymentStatus,
        transactionId: mockPaymentData.transactionId
      });
    });
  });
});
