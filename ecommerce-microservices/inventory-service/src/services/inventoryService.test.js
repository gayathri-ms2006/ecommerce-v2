const inventoryService = require("./inventoryService");
const inventoryRepository = require("../repositories/inventoryRepository");
const Inventory = require("../models/Inventory");
const { NotFoundError } = require("../utils/errors");

// Mock dependencies
jest.mock("../repositories/inventoryRepository", () => {
  return {
    getById: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    reduceStock: jest.fn(),
    getAll: jest.fn(),
  };
});
jest.mock("../models/Inventory");
jest.mock("../utils/errors", () => {
  class NotFoundError extends Error {
    constructor(message) {
      super(message);
      this.name = "NotFoundError";
    }
  }
  return { NotFoundError };
});

describe("InventoryService Unit Tests", () => {
  const mockProductId = "prod-123";
  const mockInventoryData = {
    productId: mockProductId,
    availableStock: 50,
    lowStockThreshold: 5,
    warehouseLocation: "Aisle 4",
    updatedAt: "2026-07-30T11:46:00.000Z"
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("addInventory", () => {
    it("should update stock if inventory already exists", async () => {
      // Arrange
      inventoryRepository.getById.mockResolvedValue(mockInventoryData);
      
      const mockInventoryInstance = {
        availableStock: mockInventoryData.availableStock,
        updatedAt: mockInventoryData.updatedAt,
        toJSON: jest.fn().mockReturnValue({
          ...mockInventoryData,
          availableStock: 70
        })
      };
      Inventory.mockImplementation(() => mockInventoryInstance);
      inventoryRepository.update.mockResolvedValue({
        ...mockInventoryData,
        availableStock: 70
      });

      // Act
      const result = await inventoryService.addInventory({
        productId: mockProductId,
        availableStock: 20
      });

      // Assert
      expect(inventoryRepository.getById).toHaveBeenCalledWith(mockProductId);
      expect(Inventory).toHaveBeenCalledWith(mockInventoryData);
      expect(mockInventoryInstance.availableStock).toBe(70);
      expect(mockInventoryInstance.updatedAt).toBeDefined();
      expect(mockInventoryInstance.toJSON).toHaveBeenCalled();
      expect(inventoryRepository.update).toHaveBeenCalledWith({
        ...mockInventoryData,
        availableStock: 70
      });
      expect(result.availableStock).toBe(70);
    });

    it("should create new inventory record if inventory does not exist", async () => {
      // Arrange
      inventoryRepository.getById.mockResolvedValue(null);

      const mockInventoryInstance = {
        toJSON: jest.fn().mockReturnValue(mockInventoryData)
      };
      Inventory.mockImplementation(() => mockInventoryInstance);
      inventoryRepository.create.mockResolvedValue(mockInventoryData);

      const newData = {
        productId: mockProductId,
        availableStock: 50,
        lowStockThreshold: 5,
        warehouseLocation: "Aisle 4"
      };

      // Act
      const result = await inventoryService.addInventory(newData);

      // Assert
      expect(inventoryRepository.getById).toHaveBeenCalledWith(mockProductId);
      expect(Inventory).toHaveBeenCalledWith(newData);
      expect(mockInventoryInstance.toJSON).toHaveBeenCalled();
      expect(inventoryRepository.create).toHaveBeenCalledWith(mockInventoryData);
      expect(result).toEqual(mockInventoryData);
    });
  });

  describe("getAllInventory", () => {
    it("should return inventory list", async () => {
      // Arrange
      const mockList = [mockInventoryData];
      inventoryRepository.getAll.mockResolvedValue(mockList);

      // Act
      const result = await inventoryService.getAllInventory();

      // Assert
      expect(inventoryRepository.getAll).toHaveBeenCalled();
      expect(result).toEqual(mockList);
    });

    it("should return empty array if no inventory exists", async () => {
      // Arrange
      inventoryRepository.getAll.mockResolvedValue(null);

      // Act
      const result = await inventoryService.getAllInventory();

      // Assert
      expect(inventoryRepository.getAll).toHaveBeenCalled();
      expect(result).toEqual([]);
    });
  });

  describe("getInventory", () => {
    it("should return inventory data if found", async () => {
      // Arrange
      inventoryRepository.getById.mockResolvedValue(mockInventoryData);

      // Act
      const result = await inventoryService.getInventory(mockProductId);

      // Assert
      expect(inventoryRepository.getById).toHaveBeenCalledWith(mockProductId);
      expect(result).toEqual(mockInventoryData);
    });

    it("should throw NotFoundError if inventory data is not found", async () => {
      // Arrange
      inventoryRepository.getById.mockResolvedValue(null);

      // Act & Assert
      await expect(
        inventoryService.getInventory(mockProductId)
      ).rejects.toThrow(NotFoundError);
      expect(inventoryRepository.getById).toHaveBeenCalledWith(mockProductId);
    });
  });

  describe("updateInventory", () => {
    it("should update and save inventory successfully", async () => {
      // Arrange
      inventoryRepository.getById.mockResolvedValue(mockInventoryData);
      
      const mockInventoryInstance = {
        update: jest.fn(),
        toJSON: jest.fn().mockReturnValue({
          ...mockInventoryData,
          warehouseLocation: "Aisle 5"
        })
      };
      Inventory.mockImplementation(() => mockInventoryInstance);
      inventoryRepository.update.mockResolvedValue({
        ...mockInventoryData,
        warehouseLocation: "Aisle 5"
      });

      const updateData = { warehouseLocation: "Aisle 5" };

      // Act
      const result = await inventoryService.updateInventory(mockProductId, updateData);

      // Assert
      expect(inventoryRepository.getById).toHaveBeenCalledWith(mockProductId);
      expect(Inventory).toHaveBeenCalledWith(mockInventoryData);
      expect(mockInventoryInstance.update).toHaveBeenCalledWith(updateData);
      expect(mockInventoryInstance.toJSON).toHaveBeenCalled();
      expect(inventoryRepository.update).toHaveBeenCalledWith({
        ...mockInventoryData,
        warehouseLocation: "Aisle 5"
      });
      expect(result.warehouseLocation).toBe("Aisle 5");
    });

    it("should throw NotFoundError if inventory to update does not exist", async () => {
      // Arrange
      inventoryRepository.getById.mockResolvedValue(null);

      // Act & Assert
      await expect(
        inventoryService.updateInventory(mockProductId, { availableStock: 10 })
      ).rejects.toThrow(NotFoundError);
      expect(inventoryRepository.getById).toHaveBeenCalledWith(mockProductId);
      expect(inventoryRepository.update).not.toHaveBeenCalled();
    });
  });

  describe("reduceStock", () => {
    it("should reduce stock successfully if inventory exists", async () => {
      // Arrange
      inventoryRepository.getById.mockResolvedValue(mockInventoryData);
      inventoryRepository.reduceStock.mockResolvedValue({
        ...mockInventoryData,
        availableStock: 40
      });

      // Act
      const result = await inventoryService.reduceStock(mockProductId, 10);

      // Assert
      expect(inventoryRepository.getById).toHaveBeenCalledWith(mockProductId);
      expect(inventoryRepository.reduceStock).toHaveBeenCalledWith(mockProductId, 10);
      expect(result.availableStock).toBe(40);
    });

    it("should throw NotFoundError if trying to reduce stock on non-existing inventory", async () => {
      // Arrange
      inventoryRepository.getById.mockResolvedValue(null);

      // Act & Assert
      await expect(
        inventoryService.reduceStock(mockProductId, 10)
      ).rejects.toThrow(NotFoundError);
      expect(inventoryRepository.getById).toHaveBeenCalledWith(mockProductId);
      expect(inventoryRepository.reduceStock).not.toHaveBeenCalled();
    });
  });

  describe("checkAvailability", () => {
    it("should return not available and stock 0 if inventory is not found", async () => {
      // Arrange
      inventoryRepository.getById.mockResolvedValue(null);

      // Act
      const result = await inventoryService.checkAvailability(mockProductId, 10);

      // Assert
      expect(inventoryRepository.getById).toHaveBeenCalledWith(mockProductId);
      expect(result).toEqual({
        productId: mockProductId,
        available: false,
        availableStock: 0
      });
    });

    it("should return available true and actual stock if availableStock is greater than or equal to quantity", async () => {
      // Arrange
      inventoryRepository.getById.mockResolvedValue(mockInventoryData); // stock is 50

      // Act
      const result = await inventoryService.checkAvailability(mockProductId, 10);

      // Assert
      expect(inventoryRepository.getById).toHaveBeenCalledWith(mockProductId);
      expect(result).toEqual({
        productId: mockProductId,
        available: true,
        availableStock: 50
      });
    });

    it("should return available false and actual stock if availableStock is less than quantity", async () => {
      // Arrange
      inventoryRepository.getById.mockResolvedValue(mockInventoryData); // stock is 50

      // Act
      const result = await inventoryService.checkAvailability(mockProductId, 60);

      // Assert
      expect(inventoryRepository.getById).toHaveBeenCalledWith(mockProductId);
      expect(result).toEqual({
        productId: mockProductId,
        available: false,
        availableStock: 50
      });
    });
  });
});
