const CartItem = require("../models/CartItem");
const cartRepository = require("../repositories/cartRepository");
const { NotFoundError } = require("../utils/errors");

class CartService {
  async addToCart(data) {
    const existing = await cartRepository.getByUserAndProduct(data.userId, data.productId);
    
    if (existing) {
      const item = new CartItem(existing);
      item.incrementQuantity(data.quantity);
      return await cartRepository.createOrUpdate(item.toJSON());
    }
    
    const newItem = new CartItem(data);
    return await cartRepository.createOrUpdate(newItem.toJSON());
  }

  async updateCart(data) {
    const existing = await cartRepository.getByUserAndProduct(data.userId, data.productId);
    if (!existing) {
      throw new NotFoundError(`Product ${data.productId} not found in user's cart`);
    }

    const item = new CartItem(existing);
    item.updateQuantity(data.quantity);
    return await cartRepository.createOrUpdate(item.toJSON());
  }

  async removeCart(userId, productId) {
    const existing = await cartRepository.getByUserAndProduct(userId, productId);
    if (!existing) {
      throw new NotFoundError(`Product ${productId} not found in user's cart`);
    }

    await cartRepository.delete(userId, productId);
    return { userId, productId, removed: true };
  }

  async clearCart(userId) {
    const items = await cartRepository.getByUser(userId) || [];
    for (const item of items) {
      await cartRepository.delete(userId, item.productId);
    }
    return { userId, cleared: true };
  }

  async getCart(userId) {
    return await cartRepository.getByUser(userId);
  }
}

module.exports = new CartService();
//