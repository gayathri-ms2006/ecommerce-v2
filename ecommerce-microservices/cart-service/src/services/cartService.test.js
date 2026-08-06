const CartItem = require("../models/CartItem");
const cartRepository = require("../repositories/cartRepository");
const { NotFoundError } = require("../utils/errors");
const cartService = require("./cartService");

// Mocking dependencies
jest.mock("../repositories/cartRepository", () => ({
  getByUserAndProduct: jest.fn(),
  createOrUpdate: jest.fn(),
  delete: jest.fn(),
  getByUser: jest.fn(),
}));

const mockIncrementQuantity = jest.fn();
const mockUpdateQuantity = jest.fn();
const mockToJSON = jest.fn();

jest.mock("../models/CartItem", () => {
  return jest.fn().mockImplementation(function (data) {
    this.incrementQuantity = mockIncrementQuantity;
    this.updateQuantity = mockUpdateQuantity;
    this.toJSON = mockToJSON;
    Object.assign(this, data);
  });
});

const mockNotFoundErrorConstructor = jest.fn();
jest.mock("../utils/errors", () => {
  const MockNotFoundError = jest.fn().mockImplementation(function (message) {
    this.message = message;
    this.name = "NotFoundError";
    mockNotFoundErrorConstructor(message);
  });
  // Ensure instanceof works as expected
  Object.setPrototypeOf(MockNotFoundError.prototype, Error.prototype);
  return {
    NotFoundError: MockNotFoundError,
  };
});

describe("CartService", () => {
  const userId = "user-123";
  const productId = "prod-abc";
  
  const sampleCartItemData = {
    userId,
    productId,
    quantity: 2,
    productName: "T-Shirt",
    price: 19.99,
    imageUrl: "http://example.com/image.png",
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("addToCart", () => {
    it("should create a new cart item when product does not exist", async () => {
      // Arrange
      cartRepository.getByUserAndProduct.mockResolvedValue(null);
      const jsonItem = { ...sampleCartItemData };
      mockToJSON.mockReturnValue(jsonItem);
      cartRepository.createOrUpdate.mockResolvedValue(jsonItem);

      // Act
      const result = await cartService.addToCart(sampleCartItemData);

      // Assert
      expect(CartItem).toHaveBeenCalledWith(sampleCartItemData);
      expect(cartRepository.createOrUpdate).toHaveBeenCalledWith(jsonItem);
      expect(result).toEqual(jsonItem);
    });

    it("should increase quantity when product already exists", async () => {
      // Arrange
      const existingItem = { ...sampleCartItemData, quantity: 1 };
      cartRepository.getByUserAndProduct.mockResolvedValue(existingItem);
      const jsonItem = { ...sampleCartItemData, quantity: 3 };
      mockToJSON.mockReturnValue(jsonItem);
      cartRepository.createOrUpdate.mockResolvedValue(jsonItem);

      // Act
      const result = await cartService.addToCart({ userId, productId, quantity: 2 });

      // Assert
      expect(CartItem).toHaveBeenCalledWith(existingItem);
      expect(mockIncrementQuantity).toHaveBeenCalledWith(2);
      expect(cartRepository.createOrUpdate).toHaveBeenCalledWith(jsonItem);
      expect(result).toEqual(jsonItem);
    });

    it("should call cartRepository.getByUserAndProduct", async () => {
      // Arrange
      cartRepository.getByUserAndProduct.mockResolvedValue(null);
      mockToJSON.mockReturnValue({ ...sampleCartItemData });
      cartRepository.createOrUpdate.mockResolvedValue(sampleCartItemData);

      // Act
      await cartService.addToCart(sampleCartItemData);

      // Assert
      expect(cartRepository.getByUserAndProduct).toHaveBeenCalledTimes(1);
      expect(cartRepository.getByUserAndProduct).toHaveBeenCalledWith(userId, productId);
    });

    it("should call cartRepository.createOrUpdate", async () => {
      // Arrange
      cartRepository.getByUserAndProduct.mockResolvedValue(null);
      const jsonItem = { ...sampleCartItemData };
      mockToJSON.mockReturnValue(jsonItem);
      cartRepository.createOrUpdate.mockResolvedValue(jsonItem);

      // Act
      await cartService.addToCart(sampleCartItemData);

      // Assert
      expect(cartRepository.createOrUpdate).toHaveBeenCalledTimes(1);
      expect(cartRepository.createOrUpdate).toHaveBeenCalledWith(jsonItem);
    });

    it("should return created cart item", async () => {
      // Arrange
      cartRepository.getByUserAndProduct.mockResolvedValue(null);
      const jsonItem = { ...sampleCartItemData };
      mockToJSON.mockReturnValue(jsonItem);
      cartRepository.createOrUpdate.mockResolvedValue(jsonItem);

      // Act
      const result = await cartService.addToCart(sampleCartItemData);

      // Assert
      expect(result).toBe(jsonItem);
    });
  });

  describe("updateCart", () => {
    const updateData = { userId, productId, quantity: 5 };
    const existingItem = { ...sampleCartItemData, quantity: 2 };
    const updatedJSON = { ...sampleCartItemData, quantity: 5 };

    it("should update quantity successfully", async () => {
      // Arrange
      cartRepository.getByUserAndProduct.mockResolvedValue(existingItem);
      mockToJSON.mockReturnValue(updatedJSON);
      cartRepository.createOrUpdate.mockResolvedValue(updatedJSON);

      // Act
      const result = await cartService.updateCart(updateData);

      // Assert
      expect(result).toEqual(updatedJSON);
    });

    it("should call CartItem.updateQuantity", async () => {
      // Arrange
      cartRepository.getByUserAndProduct.mockResolvedValue(existingItem);
      mockToJSON.mockReturnValue(updatedJSON);
      cartRepository.createOrUpdate.mockResolvedValue(updatedJSON);

      // Act
      await cartService.updateCart(updateData);

      // Assert
      expect(CartItem).toHaveBeenCalledWith(existingItem);
      expect(mockUpdateQuantity).toHaveBeenCalledWith(5);
    });

    it("should call cartRepository.createOrUpdate", async () => {
      // Arrange
      cartRepository.getByUserAndProduct.mockResolvedValue(existingItem);
      mockToJSON.mockReturnValue(updatedJSON);
      cartRepository.createOrUpdate.mockResolvedValue(updatedJSON);

      // Act
      await cartService.updateCart(updateData);

      // Assert
      expect(cartRepository.createOrUpdate).toHaveBeenCalledTimes(1);
      expect(cartRepository.createOrUpdate).toHaveBeenCalledWith(updatedJSON);
    });

    it("should throw NotFoundError when cart item does not exist", async () => {
      // Arrange
      cartRepository.getByUserAndProduct.mockResolvedValue(null);

      // Act & Assert
      await expect(cartService.updateCart(updateData)).rejects.toThrow(NotFoundError);
      expect(mockNotFoundErrorConstructor).toHaveBeenCalledWith(
        `Product ${productId} not found in user's cart`
      );
      expect(cartRepository.createOrUpdate).not.toHaveBeenCalled();
    });
  });

  describe("removeCart", () => {
    const existingItem = { ...sampleCartItemData };

    it("should remove item successfully", async () => {
      // Arrange
      cartRepository.getByUserAndProduct.mockResolvedValue(existingItem);
      cartRepository.delete.mockResolvedValue(true);

      // Act
      const result = await cartService.removeCart(userId, productId);

      // Assert
      expect(result).toEqual({ userId, productId, removed: true });
    });

    it("should call cartRepository.delete", async () => {
      // Arrange
      cartRepository.getByUserAndProduct.mockResolvedValue(existingItem);
      cartRepository.delete.mockResolvedValue(true);

      // Act
      await cartService.removeCart(userId, productId);

      // Assert
      expect(cartRepository.delete).toHaveBeenCalledTimes(1);
      expect(cartRepository.delete).toHaveBeenCalledWith(userId, productId);
    });

    it("should throw NotFoundError when cart item does not exist", async () => {
      // Arrange
      cartRepository.getByUserAndProduct.mockResolvedValue(null);

      // Act & Assert
      await expect(cartService.removeCart(userId, productId)).rejects.toThrow(NotFoundError);
      expect(mockNotFoundErrorConstructor).toHaveBeenCalledWith(
        `Product ${productId} not found in user's cart`
      );
      expect(cartRepository.delete).not.toHaveBeenCalled();
    });
  });

  describe("getCart", () => {
    const userCartItems = [sampleCartItemData];

    it("should return user cart items", async () => {
      // Arrange
      cartRepository.getByUser.mockResolvedValue(userCartItems);

      // Act
      const result = await cartService.getCart(userId);

      // Assert
      expect(result).toEqual(userCartItems);
    });

    it("should call cartRepository.getByUser", async () => {
      // Arrange
      cartRepository.getByUser.mockResolvedValue(userCartItems);

      // Act
      await cartService.getCart(userId);

      // Assert
      expect(cartRepository.getByUser).toHaveBeenCalledTimes(1);
      expect(cartRepository.getByUser).toHaveBeenCalledWith(userId);
    });
  });

  describe("clearCart", () => {
    it("should delete all items from user's cart", async () => {
      // Arrange
      const userCartItems = [
        { productId: "p1", userId },
        { productId: "p2", userId }
      ];
      cartRepository.getByUser.mockResolvedValue(userCartItems);
      cartRepository.delete.mockResolvedValue(true);

      // Act
      const result = await cartService.clearCart(userId);

      // Assert
      expect(cartRepository.getByUser).toHaveBeenCalledWith(userId);
      expect(cartRepository.delete).toHaveBeenCalledTimes(2);
      expect(cartRepository.delete).toHaveBeenNthCalledWith(1, userId, "p1");
      expect(cartRepository.delete).toHaveBeenNthCalledWith(2, userId, "p2");
      expect(result).toEqual({ userId, cleared: true });
    });

    it("should handle empty cart safely", async () => {
      // Arrange
      cartRepository.getByUser.mockResolvedValue([]);

      // Act
      const result = await cartService.clearCart(userId);

      // Assert
      expect(cartRepository.getByUser).toHaveBeenCalledWith(userId);
      expect(cartRepository.delete).not.toHaveBeenCalled();
      expect(result).toEqual({ userId, cleared: true });
    });

    it("should handle null response from repository safely", async () => {
      // Arrange
      cartRepository.getByUser.mockResolvedValue(null);

      // Act
      const result = await cartService.clearCart(userId);

      // Assert
      expect(cartRepository.getByUser).toHaveBeenCalledWith(userId);
      expect(cartRepository.delete).not.toHaveBeenCalled();
      expect(result).toEqual({ userId, cleared: true });
    });
  });
});
