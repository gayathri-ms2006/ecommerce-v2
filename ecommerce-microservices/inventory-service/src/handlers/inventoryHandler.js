const response = require("../utils/response");
const inventoryService = require("../services/inventoryService");
const inventoryValidator = require("../validators/inventoryValidator");
const { BadRequestError } = require("../utils/errors");

module.exports.handler = async (event) => {
  try {

    const method =
      event.httpMethod ||
      event.requestContext?.http?.method;

    const productId =
      event.pathParameters?.productId;

    switch (method) {

      // Add Inventory OR Reduce Stock
      case "POST": {

        // POST /inventory
        if (!productId) {

          const body =
            event.body
              ? JSON.parse(event.body)
              : {};

          const validatedData =
            inventoryValidator.validateAdd(body);

          const result =
            await inventoryService.addInventory(
              validatedData
            );

          return response.success(result, 201);
        }

        // POST /inventory/{productId}/reduce
        const body =
          event.body
            ? JSON.parse(event.body)
            : {};

        const validatedData =
          inventoryValidator.validateReduce(body);

        const result =
          await inventoryService.reduceStock(
            productId,
            validatedData.quantity
          );

        return response.success(result, 200);
      }

      // Get Inventory OR Check Availability
      case "GET": {

        const rawPath =
          event.rawPath ||
          event.resource ||
          "";

        // GET /inventory
        if (!productId) {

          const result =
            await inventoryService.getAllInventory();

          return response.success(
            result,
            200
          );
        }

        // GET /inventory/{productId}/availability
        if (rawPath.includes("availability")) {

          const quantity =
            event.queryStringParameters?.quantity
              ? parseInt(
                  event.queryStringParameters.quantity,
                  10
                )
              : 1;

          if (
            isNaN(quantity) ||
            quantity <= 0
          ) {
            throw new BadRequestError(
              "Query parameter 'quantity' must be a positive integer"
            );
          }

          const result =
            await inventoryService.checkAvailability(
              productId,
              quantity
            );

          return response.success(
            result,
            200
          );
        }

        // GET /inventory/{productId}
        const result =
          await inventoryService.getInventory(
            productId
          );

        return response.success(
          result,
          200
        );
      }

      // Update Inventory
      case "PUT": {

        if (!productId) {
          throw new BadRequestError(
            "Missing path parameter: productId"
          );
        }

        const body =
          event.body
            ? JSON.parse(event.body)
            : {};

        const validatedData =
          inventoryValidator.validateUpdate(
            body
          );

        const result =
          await inventoryService.updateInventory(
            productId,
            validatedData
          );

        return response.success(
          result,
          200
        );
      }

      default:
        throw new BadRequestError(
          `Unsupported HTTP Method: ${method}`
        );
    }

  } catch (err) {

    console.error(
      "Inventory Handler Error:",
      err
    );

    return response.error(err);
  }
};