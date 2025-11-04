


const Joi = require('joi');

exports.createProductValidator = Joi.object({
  name: Joi.string().min(2).max(100).required(),
  price: Joi.number().min(0).required(),
  description: Joi.string().min(10).max(1000).required(),
  availableStock: Joi.number().integer().min(0).required()
});

exports.updateProductValidator = Joi.object({
  name: Joi.string().min(2).max(100).optional(),
  price: Joi.number().min(0).optional(),
  description: Joi.string().min(10).max(1000).optional(),
  availableStock: Joi.number().integer().min(0).optional()
}).min(1);

