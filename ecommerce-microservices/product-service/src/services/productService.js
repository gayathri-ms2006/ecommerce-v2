const Product = require("../models/Product");
const productRepository = require("../repositories/productRepository");
const { NotFoundError } = require("../utils/errors");

class ProductService {
  async createProduct(data) {
    const product = new Product(data);
    return await productRepository.create(product.toJSON());
  }
// deployment verification
  async getProduct(productId) {
    const productData = await productRepository.getById(productId);

    if (!productData) {
      throw new NotFoundError(
        `Product with ID ${productId} not found`
      );
    }

    return productData;
  }

  async updateProduct(productId, data) {
    const productData = await productRepository.getById(productId);

    if (!productData) {
      throw new NotFoundError(
        `Product with ID ${productId} not found`
      );
    }

    const product = new Product(productData);

    product.update(data);

    return await productRepository.update(
      product.toJSON()
    );
  }

  async deleteProduct(productId) {
    const productData =
      await productRepository.getById(productId);

    if (!productData) {
      throw new NotFoundError(
        `Product with ID ${productId} not found`
      );
    }

    await productRepository.delete(productId);

    return {
      productId,
      deleted: true,
    };
  }

  async listProducts() {
    return await productRepository.list();
  }
}

module.exports = new ProductService();