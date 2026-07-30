const Joi = require("joi");
const { BadRequestError } = require("../utils/errors");

const createPaymentSchema = Joi.object({
  orderId: Joi.string().required(),
  amount: Joi.number().greater(0).required(),
  paymentMethod: Joi.string().valid("CREDIT_CARD", "DEBIT_CARD", "PAYPAL", "STRIPE").required(),
});

const refundPaymentSchema = Joi.object({
  paymentId: Joi.string().uuid().required(),
  amount: Joi.number().greater(0).required(),
});

const validate = (schema, data) => {
  const { error, value } = schema.validate(data, { abortEarly: false });
  if (error) {
    const details = error.details.map((detail) => ({
      message: detail.message,
      path: detail.path,
    }));
    throw new BadRequestError("Validation failed", details);
  }
  return value;
};

module.exports = {
  validateCreate: (data) => validate(createPaymentSchema, data),
  validateRefund: (data) => validate(refundPaymentSchema, data),
};
