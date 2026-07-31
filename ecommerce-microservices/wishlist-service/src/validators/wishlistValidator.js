const Joi = require("joi");

const addWishlistSchema = Joi.object({
  userId: Joi.string().required(),

  productId: Joi.string().required(),

  productName: Joi.string().required(),

  price: Joi.number()
    .positive()
    .required(),

  imageUrl: Joi.string()
    .allow("")
    .optional(),

  addedAt: Joi.string()
    .optional()
});

module.exports = {
  validateAdd(data) {
    const { error, value } =
      addWishlistSchema.validate(data);

    if (error) {
      throw new Error(
        error.details[0].message
      );
    }

    return value;
  },

  validateProductId(productId) {
    const schema = Joi.string().required();

    const { error, value } =
      schema.validate(productId);

    if (error) {
      throw new Error(
        error.details[0].message
      );
    }

    return value;
  }
};