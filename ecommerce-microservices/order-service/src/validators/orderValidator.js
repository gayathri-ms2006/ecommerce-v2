const Joi = require("joi");
const { BadRequestError } = require("../utils/errors");

const createOrderSchema = Joi.object({
  userId: Joi.string().required(),
  paymentMethod: Joi.string().valid("CREDIT_CARD", "DEBIT_CARD", "PAYPAL", "STRIPE").required(),
  products: Joi.array()
    .items(
      Joi.object({
        productId: Joi.string().required(),
        productName: Joi.string().min(2).max(100).required(),
        quantity: Joi.number().integer().positive().required(),
        price: Joi.number().greater(0).required(),
      })
    )
    .min(1)
    .required(),
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
  validateCreate: (data) => validate(createOrderSchema, data),
};
