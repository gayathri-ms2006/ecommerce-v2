const response = require("../utils/response");
const cartService = require("../services/cartService");
const cartValidator = require("../validators/cartValidator");
const { BadRequestError } = require("../utils/errors");

module.exports.handler = async (event) => {
  try {

    const method =
      event.httpMethod ||
      event.requestContext?.http?.method;

    switch (method) {

      // Add to Cart
      case "POST": {
        const body = event.body ? JSON.parse(event.body) : {};

        const validatedData =
          cartValidator.validateAdd(body);

        const result =
          await cartService.addToCart(validatedData);

        return response.success(result, 201);
      }

      // Get Cart by User
      case "GET": {

        const userId =
          event.pathParameters?.userId;

        if (!userId) {
          throw new BadRequestError(
            "Missing path parameter: userId"
          );
        }

        const result =
          await cartService.getCart(userId);

        return response.success(result, 200);
      }

      // Update Cart Item
      case "PUT": {

        const body = event.body ? JSON.parse(event.body) : {};

        const validatedData =
          cartValidator.validateUpdate(body);

        const result =
          await cartService.updateCart(validatedData);

        return response.success(result, 200);
      }

      // Remove Cart Item
      case "DELETE": {

        const body = event.body ? JSON.parse(event.body) : {};

        const validatedData =
          cartValidator.validateRemove(body);

        const result =
          await cartService.removeCart(
            validatedData.userId,
            validatedData.productId
          );

        return response.success(result, 200);
      }

      default:
        throw new BadRequestError(
          `Unsupported HTTP Method: ${method}`
        );
    }

  } catch (err) {

    console.error("Cart Handler Error:", err);

    return response.error(err);
  }
};
//testing 