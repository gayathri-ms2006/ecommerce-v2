const Product = require("../models/Product");
const productRepository = require("../repositories/productRepository");
const { NotFoundError } = require("../utils/errors");
const productService = require("./productService");

// Mocking dependencies
jest.mock("../repositories/productRepository", () => ({
  create: jest.fn(),
  getById: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  list: jest.fn(),
}));

const mockProductUpdate = jest.fn();
const mockProductToJSON = jest.fn();

jest.mock("../models/Product", () => {
  return jest.fn().mockImplementation(function (data) {
    this.update = mockProductUpdate;
    this.toJSON = mockProductToJSON;
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

describe("ProductService", () => {
  const sampleProductData = {
    name: "Sample Product",
    description: "A description of sample product",
    category: "Electronics",
    price: 99.99,
    imageUrl: "http://example.com/image.png",
  };

  const sampleProductWithId = {
    productId: "prod-123",
    ...sampleProductData,
    createdAt: "2026-07-26T22:53:35Z",
    updatedAt: "2026-07-26T22:53:35Z",
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("createProduct", () => {
    it("should create a product successfully", async () => {
      // Arrange
      const mockToJSONResult = { ...sampleProductData };
      mockProductToJSON.mockReturnValue(mockToJSONResult);
      productRepository.create.mockResolvedValue(sampleProductWithId);

      // Act
      const result = await productService.createProduct(sampleProductData);

      // Assert
      expect(result).toEqual(sampleProductWithId);
    });

    it("should call Product constructor", async () => {
      // Arrange
      const mockToJSONResult = { ...sampleProductData };
      mockProductToJSON.mockReturnValue(mockToJSONResult);
      productRepository.create.mockResolvedValue(sampleProductWithId);

      // Act
      await productService.createProduct(sampleProductData);

      // Assert
      expect(Product).toHaveBeenCalledTimes(1);
      expect(Product).toHaveBeenCalledWith(sampleProductData);
    });

    it("should call productRepository.create once", async () => {
      // Arrange
      const mockToJSONResult = { ...sampleProductData };
      mockProductToJSON.mockReturnValue(mockToJSONResult);
      productRepository.create.mockResolvedValue(sampleProductWithId);

      // Act
      await productService.createProduct(sampleProductData);

      // Assert
      expect(productRepository.create).toHaveBeenCalledTimes(1);
      expect(productRepository.create).toHaveBeenCalledWith(mockToJSONResult);
    });

    it("should return created product", async () => {
      // Arrange
      const mockToJSONResult = { ...sampleProductData };
      mockProductToJSON.mockReturnValue(mockToJSONResult);
      productRepository.create.mockResolvedValue(sampleProductWithId);

      // Act
      const result = await productService.createProduct(sampleProductData);

      // Assert
      expect(result).toBe(sampleProductWithId);
    });
  });

  describe("getProduct", () => {
    it("should return product when found", async () => {
      // Arrange
      productRepository.getById.mockResolvedValue(sampleProductWithId);

      // Act
      const result = await productService.getProduct("prod-123");

      // Assert
      expect(result).toEqual(sampleProductWithId);
    });

    it("should call productRepository.getById", async () => {
      // Arrange
      productRepository.getById.mockResolvedValue(sampleProductWithId);

      // Act
      await productService.getProduct("prod-123");

      // Assert
      expect(productRepository.getById).toHaveBeenCalledTimes(1);
      expect(productRepository.getById).toHaveBeenCalledWith("prod-123");
    });

    it("should throw NotFoundError when product is not found", async () => {
      // Arrange
      productRepository.getById.mockResolvedValue(null);

      // Act & Assert
      await expect(productService.getProduct("prod-123")).rejects.toThrow(NotFoundError);
      expect(mockNotFoundErrorConstructor).toHaveBeenCalledWith(
        "Product with ID prod-123 not found"
      );
    });
  });

  describe("updateProduct", () => {
    const updateData = { price: 89.99 };
    const updatedProductJSON = { ...sampleProductWithId, price: 89.99 };
    const updatedProduct = { ...sampleProductWithId, price: 89.99 };

    it("should update product successfully", async () => {
      // Arrange
      productRepository.getById.mockResolvedValue(sampleProductWithId);
      mockProductToJSON.mockReturnValue(updatedProductJSON);
      productRepository.update.mockResolvedValue(updatedProduct);

      // Act
      const result = await productService.updateProduct("prod-123", updateData);

      // Assert
      expect(result).toEqual(updatedProduct);
    });

    it("should call Product.update", async () => {
      // Arrange
      productRepository.getById.mockResolvedValue(sampleProductWithId);
      mockProductToJSON.mockReturnValue(updatedProductJSON);
      productRepository.update.mockResolvedValue(updatedProduct);

      // Act
      await productService.updateProduct("prod-123", updateData);

      // Assert
      expect(Product).toHaveBeenCalledWith(sampleProductWithId);
      expect(mockProductUpdate).toHaveBeenCalledTimes(1);
      expect(mockProductUpdate).toHaveBeenCalledWith(updateData);
    });

    it("should call productRepository.update", async () => {
      // Arrange
      productRepository.getById.mockResolvedValue(sampleProductWithId);
      mockProductToJSON.mockReturnValue(updatedProductJSON);
      productRepository.update.mockResolvedValue(updatedProduct);

      // Act
      await productService.updateProduct("prod-123", updateData);

      // Assert
      expect(productRepository.update).toHaveBeenCalledTimes(1);
      expect(productRepository.update).toHaveBeenCalledWith(updatedProductJSON);
    });

    it("should throw NotFoundError when product does not exist", async () => {
      // Arrange
      productRepository.getById.mockResolvedValue(null);

      // Act & Assert
      await expect(
        productService.updateProduct("prod-123", updateData)
      ).rejects.toThrow(NotFoundError);
      expect(mockNotFoundErrorConstructor).toHaveBeenCalledWith(
        "Product with ID prod-123 not found"
      );
      expect(productRepository.update).not.toHaveBeenCalled();
    });
  });

  describe("deleteProduct", () => {
    it("should delete product successfully", async () => {
      // Arrange
      productRepository.getById.mockResolvedValue(sampleProductWithId);
      productRepository.delete.mockResolvedValue(true);

      // Act
      const result = await productService.deleteProduct("prod-123");

      // Assert
      expect(result).toEqual({
        productId: "prod-123",
        deleted: true,
      });
    });

    it("should call productRepository.delete", async () => {
      // Arrange
      productRepository.getById.mockResolvedValue(sampleProductWithId);
      productRepository.delete.mockResolvedValue(true);

      // Act
      await productService.deleteProduct("prod-123");

      // Assert
      expect(productRepository.delete).toHaveBeenCalledTimes(1);
      expect(productRepository.delete).toHaveBeenCalledWith("prod-123");
    });

    it("should throw NotFoundError when product does not exist", async () => {
      // Arrange
      productRepository.getById.mockResolvedValue(null);

      // Act & Assert
      await expect(productService.deleteProduct("prod-123")).rejects.toThrow(NotFoundError);
      expect(mockNotFoundErrorConstructor).toHaveBeenCalledWith(
        "Product with ID prod-123 not found"
      );
      expect(productRepository.delete).not.toHaveBeenCalled();
    });
  });

  describe("listProducts", () => {
    const productsList = [sampleProductWithId];

    it("should return all products", async () => {
      // Arrange
      productRepository.list.mockResolvedValue(productsList);

      // Act
      const result = await productService.listProducts();

      // Assert
      expect(result).toEqual(productsList);
    });

    it("should call productRepository.list once", async () => {
      // Arrange
      productRepository.list.mockResolvedValue(productsList);

      // Act
      await productService.listProducts();

      // Assert
      expect(productRepository.list).toHaveBeenCalledTimes(1);
    });
  });
});
