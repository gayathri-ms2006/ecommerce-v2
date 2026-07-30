const Wishlist = require("../models/Wishlist");
const wishlistRepository = require("../repositories/wishlistRepository");
const { NotFoundError } = require("../utils/errors");

class WishlistService {
  async addToWishlist(data) {
    const existing = await wishlistRepository.getById(data.userId, data.productId);
    
    // Return existing item if product already exists (no duplicates)
    if (existing) {
      return { item: existing, isNew: false };
    }
    
    const newItem = new Wishlist(data);
    const saved = await wishlistRepository.add(newItem.toJSON());
    return { item: saved, isNew: true };
  }

  async removeFromWishlist(userId, productId) {
    const existing = await wishlistRepository.getById(userId, productId);
    if (!existing) {
      throw new NotFoundError(`Product ${productId} not found in user's wishlist`);
    }

    await wishlistRepository.delete(userId, productId);
    return { userId, productId, removed: true };
  }

  async getWishlist(userId) {
    return await wishlistRepository.getByUser(userId);
  }

  async checkProduct(userId, productId) {
    const item = await wishlistRepository.getById(userId, productId);
    return {
      exists: !!item,
      item: item || null
    };
  }
}

module.exports = new WishlistService();
