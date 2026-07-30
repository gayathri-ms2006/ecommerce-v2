const Joi = require("joi");
const { BadRequestError } = require("../utils/errors");

const addToCartSchema = Joi.object({
  userId: Joi.string().required(),

  productId: Joi.string()
    .uuid()
    .required(),

  quantity: Joi.number()
    .integer()
    .positive()
    .required(),

  productName: Joi.string()
    .min(2)
    .max(100)
    .required(),

  price: Joi.number()
    .greater(0)
    .required(),

  imageUrl: Joi.string()
    .allow("")
    .optional(),
});

const updateCartSchema = Joi.object({
  userId: Joi.string().required(),

  productId: Joi.string()
    .uuid()
    .required(),

  quantity: Joi.number()
    .integer()
    .positive()
    .required(),
});

const removeCartSchema = Joi.object({
  userId: Joi.string().required(),

  productId: Joi.string()
    .uuid()
    .required(),
});

const validate = (schema, data) => {
  const { error, value } = schema.validate(
    data,
    {
      abortEarly: false,
    }
  );

  if (error) {
    const details = error.details.map(
      (detail) => ({
        message: detail.message,
        path: detail.path,
      })
    );

    throw new BadRequestError(
      "Validation failed",
      details
    );
  }

  return value;
};

module.exports = {
  validateAdd: (data) =>
    validate(addToCartSchema, data),

  validateUpdate: (data) =>
    validate(updateCartSchema, data),

  validateRemove: (data) =>
    validate(removeCartSchema, data),
};