const response = require("../utils/response");
const paymentService = require("../services/paymentService");
const paymentValidator = require("../validators/paymentValidator");
const { BadRequestError } = require("../utils/errors");

module.exports.handler = async (event) => {
  try {

    const method =
      event.httpMethod ||
      event.requestContext?.http?.method;

    const paymentId =
      event.pathParameters?.paymentId;

    switch (method) {

      // Create Payment
      case "POST": {

        const body =
          event.body ? JSON.parse(event.body) : {};

        const validatedData =
          paymentValidator.validateCreate(body);

        const result =
          await paymentService.createPayment(
            validatedData
          );

        return response.success(result, 201);
      }

      // Get Payment / Get Payment Status
      case "GET": {

        if (!paymentId) {
          throw new BadRequestError(
            "Missing path parameter: paymentId"
          );
        }

        const rawPath =
          event.rawPath || event.resource || "";

        // GET /payments/{paymentId}/status
        if (rawPath.includes("status")) {

          const result =
            await paymentService.getPaymentStatus(
              paymentId
            );

          return response.success(result, 200);
        }

        // GET /payments/{paymentId}
        const result =
          await paymentService.getPayment(
            paymentId
          );

        return response.success(result, 200);
      }

      // Refund Payment
      case "PUT": {

        const body =
          event.body ? JSON.parse(event.body) : {};

        const validatedData =
          paymentValidator.validateRefund(body);

        const result =
          await paymentService.refundPayment(
            validatedData
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
      "Payment Handler Error:",
      err
    );

    return response.error(err);
  }
};