const response = require("../utils/response");
const orderService = require("../services/orderService");
const orderValidator = require("../validators/orderValidator");
const { BadRequestError } = require("../utils/errors");

module.exports.handler = async (event) => {
  try {

    console.log("FULL EVENT:");
    console.log(JSON.stringify(event, null, 2));

    const method =
      event.httpMethod ||
      event.requestContext?.http?.method;

    const orderId =
      event.pathParameters?.orderId;

    switch (method) {

      case "POST": {

        const body =
          event.body
            ? JSON.parse(event.body)
            : {};

        const rawPath =
          event.rawPath ||
          event.resource ||
          "";

        console.log("RAW PATH:", rawPath);
        console.log("REQUEST BODY:");
        console.log(JSON.stringify(body, null, 2));

        // CANCEL ORDER
        if (rawPath.includes("/cancel")) {

          const orderId = body.orderId;

          if (!orderId) {
            throw new BadRequestError(
              "Missing request body parameter: orderId"
            );
          }

          const result =
            await orderService.cancelOrder(
              orderId
            );

          return response.success(
            result,
            200
          );
        }

        // CREATE ORDER
        const validatedData =
          orderValidator.validateCreate(
            body
          );

        console.log("VALIDATED DATA:");
        console.log(
          JSON.stringify(
            validatedData,
            null,
            2
          )
        );

        const result =
          await orderService.createOrder(
            validatedData
          );

        return response.success(
          result,
          201
        );
      }

      case "GET": {

        const rawPath =
          event.rawPath ||
          event.resource ||
          "";

        if (rawPath.includes("track")) {

          if (!orderId) {
            throw new BadRequestError(
              "Missing path parameter: orderId"
            );
          }

          const result =
            await orderService.trackOrder(
              orderId
            );

          return response.success(
            result,
            200
          );
        }

        if (orderId) {

          const result =
            await orderService.getOrder(
              orderId
            );

          return response.success(
            result,
            200
          );
        }

        const userId =
          event.queryStringParameters?.userId ||
          null;

        const result =
          await orderService.listOrders(
            userId
          );

        return response.success(
          result,
          200
        );
      }

      case "PUT": {

        if (!orderId) {
          throw new BadRequestError(
            "Missing path parameter: orderId"
          );
        }

        const result =
          await orderService.cancelOrder(
            orderId
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
      "ORDER ERROR:",
      JSON.stringify(err, null, 2)
    );

    return {
      statusCode:
        err.statusCode || 400,

      headers: {
        "Content-Type":
          "application/json",
        "Access-Control-Allow-Origin":
          "*"
      },

      body: JSON.stringify({
        success: false,
        message: err.message,
        details: err.details || [],
        stack: err.stack
      })
    };
  }
};