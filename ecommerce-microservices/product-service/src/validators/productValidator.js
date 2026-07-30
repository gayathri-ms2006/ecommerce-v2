const Joi = require("joi");
const { BadRequestError } = require("../utils/errors");

const createProductSchema = Joi.object({
  name: Joi.string().min(2).max(100).required(),
  description: Joi.string().max(500).required(),
  category: Joi.string().min(2).max(50).required(),
  price: Joi.number().greater(0).required(),
  imageUrl: Joi.string().uri().required(),
});

const updateProductSchema = Joi.object({
  name: Joi.string().min(2).max(100),
  description: Joi.string().max(500),
  category: Joi.string().min(2).max(50),
  price: Joi.number().greater(0),
  imageUrl: Joi.string().uri(),
}).min(1); // At least one field must be updated

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
  validateCreate: (data) => validate(createProductSchema, data),
  validateUpdate: (data) => validate(updateProductSchema, data),
};
