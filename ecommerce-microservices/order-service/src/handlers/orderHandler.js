const response = require("../utils/response");
const orderService = require("../services/orderService");
const orderValidator = require("../validators/orderValidator");
const { BadRequestError, NotFoundError } = require("../utils/errors");

module.exports.handler = async (event) => {
  try {

    const method =
      event.httpMethod ||
      event.requestContext?.http?.method;

    const orderId =
      event.pathParameters?.orderId;

    switch (method) {

      // Create Order or Cancel Order
      case "POST": {

        const body =
          event.body ? JSON.parse(event.body) : {};

        const rawPath =
          event.rawPath || event.resource || "";

        if (rawPath.includes("cancel")) {
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

          return response.success(result, 200);
        }

        const validatedData =
          orderValidator.validateCreate(body);

        const result =
          await orderService.createOrder(
            validatedData
          );

        return response.success(result, 201);
      }

      // Get Order / List Orders / Track Order
      case "GET": {

        const rawPath =
          event.rawPath || event.resource || "";

        // Track Order
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

          return response.success(result, 200);
        }

        // Get Order By ID
        if (orderId) {

          const result =
            await orderService.getOrder(
              orderId
            );

          // Enforce ownership check if Cognito claims are present
          const authorizer = event.requestContext?.authorizer;
          if (authorizer) {
            const claims = authorizer.jwt?.claims || authorizer.claims;
            if (claims) {
              const userSub = claims.sub;
              const groups = claims['cognito:groups'] || claims.groups || [];
              const isAdmin = Array.isArray(groups)
                ? groups.some(g => String(g).toLowerCase() === 'admin')
                : String(groups).toLowerCase() === 'admin';

              if (!isAdmin && result.userId !== userSub) {
                throw new NotFoundError(`Order with ID ${orderId} not found`);
              }
            }
          }

          return response.success(result, 200);
        }

        // List Orders
        let userId = null;
        let isAdmin = false;

        const authorizer = event.requestContext?.authorizer;
        if (authorizer) {
          const claims = authorizer.jwt?.claims || authorizer.claims;
          if (claims) {
            userId = claims.sub;
            const groups = claims['cognito:groups'] || claims.groups || [];
            isAdmin = Array.isArray(groups)
              ? groups.some(g => String(g).toLowerCase() === 'admin')
              : String(groups).toLowerCase() === 'admin';
          }
        }

        // Fallback to query parameter for local development
        if (!userId) {
          userId = event.queryStringParameters?.userId || null;
        }

        // If user is admin and hasn't filtered by userId, fetch all.
        // Otherwise, if user is not admin, restrict retrieval strictly to their own user ID.
        if (isAdmin && !event.queryStringParameters?.userId) {
          userId = null; 
        }

        // If non-admin is logged in but no user ID could be resolved, return empty list
        if (!isAdmin && !userId) {
          return response.success([], 200);
        }

        const result =
          await orderService.listOrders(
            userId
          );

        return response.success(result, 200);
      }

      // Cancel Order
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

        return response.success(result, 200);
      }

      default:
        throw new BadRequestError(
          `Unsupported HTTP Method: ${method}`
        );
    }

  } catch (err) {

    console.error(
      "Order Handler Error:",
      err
    );

    return response.error(err);
  }
};