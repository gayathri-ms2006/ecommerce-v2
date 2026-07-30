const response = require("../utils/response");
const logger = require("../utils/logger");
const wishlistService = require("../services/wishlistService");
const wishlistValidator = require("../validators/wishlistValidator");
const { BadRequestError } = require("../utils/errors");

module.exports.handler = async (event) => {
  try {
    logger.info("Wishlist Request", event);

    const method =
      event.httpMethod ||
      event.requestContext?.http?.method;

    const rawPath =
      event.rawPath ||
      event.path ||
      event.resource ||
      "";

    const productId =
      event.pathParameters?.productId;

    switch (method) {

      // =========================
      // ADD PRODUCT TO WISHLIST
      // =========================
      case "POST": {
        const body =
          event.body ? JSON.parse(event.body) : {};

        const validatedData =
          wishlistValidator.validateAdd(body);

        const { item, isNew } =
          await wishlistService.addToWishlist(
            validatedData
          );

        return response.success(
          item,
          isNew ? 201 : 200
        );
      }

      // =========================
      // GET WISHLIST
      // CHECK PRODUCT
      // =========================
      case "GET": {

        const userId =
          event.queryStringParameters?.userId;

        if (!userId) {
          throw new BadRequestError(
            "Missing query parameter: userId"
          );
        }

        const isCheckRoute =
          rawPath.includes("/check");

        // GET /wishlist/check/{productId}
        if (isCheckRoute) {

          if (!productId) {
            throw new BadRequestError(
              "Missing path parameter: productId"
            );
          }

          const validatedProductId =
            wishlistValidator.validateProductId(
              productId
            );

          const result =
            await wishlistService.checkProduct(
              userId,
              validatedProductId
            );

          return response.success(result, 200);
        }

        // GET /wishlist
        const result =
          await wishlistService.getWishlist(
            userId
          );

        return response.success(result, 200);
      }

      // =========================
      // REMOVE FROM WISHLIST
      // =========================
      case "DELETE": {

        const userId =
          event.queryStringParameters?.userId;

        if (!userId) {
          throw new BadRequestError(
            "Missing query parameter: userId"
          );
        }

        if (!productId) {
          throw new BadRequestError(
            "Missing path parameter: productId"
          );
        }

        const validatedProductId =
          wishlistValidator.validateProductId(
            productId
          );

        const result =
          await wishlistService.removeFromWishlist(
            userId,
            validatedProductId
          );

        return response.success(result, 200);
      }

      default:
        throw new BadRequestError(
          `Unsupported HTTP Method: ${method}`
        );
    }

  } catch (err) {
    logger.error(
      "Wishlist Handler Error:",
      err
    );

    return response.error(err);
  }
};