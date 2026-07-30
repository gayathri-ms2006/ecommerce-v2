const wishlistService = require("./wishlistService");
const wishlistRepository = require("../repositories/wishlistRepository");
const Wishlist = require("../models/Wishlist");
const { NotFoundError } = require("../utils/errors");

// Mock dependencies
jest.mock("../repositories/wishlistRepository");
jest.mock("../models/Wishlist");
jest.mock("../utils/errors", () => {
  class NotFoundError extends Error {
    constructor(message) {
      super(message);
      this.name = "NotFoundError";
    }
  }
  return { NotFoundError };
});

describe("WishlistService Unit Tests", () => {
  const mockUserId = "user-123";
  const mockProductId = "product-456";
  const mockWishlistItemData = {
    userId: mockUserId,
    productId: mockProductId,
    productName: "Test Product",
    price: 99.99
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("addToWishlist", () => {
    it("should return existing wishlist item if product is already in the wishlist (no duplicate)", async () => {
      // Arrange
      wishlistRepository.getById.mockResolvedValue(mockWishlistItemData);

      // Act
      const result = await wishlistService.addToWishlist(mockWishlistItemData);

      // Assert
      expect(wishlistRepository.getById).toHaveBeenCalledWith(mockUserId, mockProductId);
      expect(Wishlist).not.toHaveBeenCalled();
      expect(wishlistRepository.add).not.toHaveBeenCalled();
      expect(result).toEqual({ item: mockWishlistItemData, isNew: false });
    });

    it("should create and add a new item to the wishlist if not already present", async () => {
      // Arrange
      wishlistRepository.getById.mockResolvedValue(null);
      const mockToJSON = jest.fn().mockReturnValue(mockWishlistItemData);
      Wishlist.mockImplementation(() => ({
        toJSON: mockToJSON
      }));
      wishlistRepository.add.mockResolvedValue(mockWishlistItemData);

      // Act
      const result = await wishlistService.addToWishlist(mockWishlistItemData);

      // Assert
      expect(wishlistRepository.getById).toHaveBeenCalledWith(mockUserId, mockProductId);
      expect(Wishlist).toHaveBeenCalledWith(mockWishlistItemData);
      expect(mockToJSON).toHaveBeenCalled();
      expect(wishlistRepository.add).toHaveBeenCalledWith(mockWishlistItemData);
      expect(result).toEqual({ item: mockWishlistItemData, isNew: true });
    });
  });

  describe("removeFromWishlist", () => {
    it("should remove item successfully if it exists in the wishlist", async () => {
      // Arrange
      wishlistRepository.getById.mockResolvedValue(mockWishlistItemData);
      wishlistRepository.delete.mockResolvedValue();

      // Act
      const result = await wishlistService.removeFromWishlist(mockUserId, mockProductId);

      // Assert
      expect(wishlistRepository.getById).toHaveBeenCalledWith(mockUserId, mockProductId);
      expect(wishlistRepository.delete).toHaveBeenCalledWith(mockUserId, mockProductId);
      expect(result).toEqual({ userId: mockUserId, productId: mockProductId, removed: true });
    });

    it("should throw NotFoundError if item does not exist in the wishlist", async () => {
      // Arrange
      wishlistRepository.getById.mockResolvedValue(null);

      // Act & Assert
      await expect(
        wishlistService.removeFromWishlist(mockUserId, mockProductId)
      ).rejects.toThrow(NotFoundError);
      expect(wishlistRepository.getById).toHaveBeenCalledWith(mockUserId, mockProductId);
      expect(wishlistRepository.delete).not.toHaveBeenCalled();
    });
  });

  describe("getWishlist", () => {
    it("should return wishlist items for a given user", async () => {
      // Arrange
      const mockItems = [mockWishlistItemData];
      wishlistRepository.getByUser.mockResolvedValue(mockItems);

      // Act
      const result = await wishlistService.getWishlist(mockUserId);

      // Assert
      expect(wishlistRepository.getByUser).toHaveBeenCalledWith(mockUserId);
      expect(result).toEqual(mockItems);
    });
  });

  describe("checkProduct", () => {
    it("should return exists true and the item if product exists in wishlist", async () => {
      // Arrange
      wishlistRepository.getById.mockResolvedValue(mockWishlistItemData);

      // Act
      const result = await wishlistService.checkProduct(mockUserId, mockProductId);

      // Assert
      expect(wishlistRepository.getById).toHaveBeenCalledWith(mockUserId, mockProductId);
      expect(result).toEqual({ exists: true, item: mockWishlistItemData });
    });

    it("should return exists false and null item if product does not exist in wishlist", async () => {
      // Arrange
      wishlistRepository.getById.mockResolvedValue(null);

      // Act
      const result = await wishlistService.checkProduct(mockUserId, mockProductId);

      // Assert
      expect(wishlistRepository.getById).toHaveBeenCalledWith(mockUserId, mockProductId);
      expect(result).toEqual({ exists: false, item: null });
    });
  });
});
