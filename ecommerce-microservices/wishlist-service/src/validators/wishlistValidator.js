const Joi = require("joi");
const { BadRequestError } = require("../utils/errors");

const addToWishlistSchema = Joi.object({
  userId: Joi.string().required(),
  productId: Joi.string().required(),
  productName: Joi.string().min(2).max(100).required(),
  productPrice: Joi.number().greater(0).required(),
  productImage: Joi.string().allow("").optional(),
  priceWhenAdded: Joi.number().greater(0).optional(),
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
  validateAdd: (data) => validate(addToWishlistSchema, data),
  validateProductId: (productId) => {
    if (!productId || typeof productId !== "string") {
      throw new BadRequestError("Invalid productId");
    }
    return productId;
  }
};
