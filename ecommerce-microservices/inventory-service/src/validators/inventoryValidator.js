const Joi = require("joi");
const { BadRequestError } = require("../utils/errors");

const addInventorySchema = Joi.object({
  productId: Joi.string().uuid().required(),
  availableStock: Joi.number().integer().min(0).required(),
  lowStockThreshold: Joi.number().integer().min(0).required(),
  warehouseLocation: Joi.string().min(2).max(100).required(),
});

const updateInventorySchema = Joi.object({
  availableStock: Joi.number().integer().min(0),
  lowStockThreshold: Joi.number().integer().min(0),
  warehouseLocation: Joi.string().min(2).max(100),
}).min(1);

const reduceStockSchema = Joi.object({
  quantity: Joi.number().integer().positive().required(),
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
  validateAdd: (data) => validate(addInventorySchema, data),
  validateUpdate: (data) => validate(updateInventorySchema, data),
  validateReduce: (data) => validate(reduceStockSchema, data),
};
