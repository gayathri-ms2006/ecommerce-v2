const response = require("../utils/response");
const productService = require("../services/productService");
const productValidator = require("../validators/productValidator");
const { BadRequestError } = require("../utils/errors");

module.exports.handler = async (event) => {
  try {

    const method =
      event.httpMethod ||
      event.requestContext?.http?.method;

    const productId =
      event.pathParameters?.productId;

    switch (method) {

      // Create Product
      case "POST": {

        const body =
          event.body ? JSON.parse(event.body) : {};

        const validatedData =
          productValidator.validateCreate(body);

        const product =
          await productService.createProduct(
            validatedData
          );

        return response.success(product, 201);
      }

      // Get Product / List Products
      case "GET": {

        // Get Product By ID
        if (productId) {

          const product =
            await productService.getProduct(
              productId
            );

          return response.success(product, 200);
        }

        // List Products
        const products =
          await productService.listProducts();

        return response.success(products, 200);
      }

      // Update Product
      case "PUT": {

        if (!productId) {
          throw new BadRequestError(
            "Missing path parameter: productId"
          );
        }

        const body =
          event.body ? JSON.parse(event.body) : {};

        const validatedData =
          productValidator.validateUpdate(body);

        const product =
          await productService.updateProduct(
            productId,
            validatedData
          );

        return response.success(product, 200);
      }

      // Delete Product
      case "DELETE": {

        if (!productId) {
          throw new BadRequestError(
            "Missing path parameter: productId"
          );
        }

        const result =
          await productService.deleteProduct(
            productId
          );

        return response.success(result, 200);
      }

      default:
        throw new BadRequestError(
          `Unsupported HTTP Method: ${method}`
        );
    }

  } catch (err) {

    console.error(
      "Product Handler Error:",
      err
    );

    return response.error(err);
  }
};