const Joi = require('joi');

exports.addToCartValidator = Joi.object({
  productId: Joi.string().regex(/^[0-9a-fA-F]{24}$/).required()
    .messages({
      'string.pattern.base': 'Invalid product ID format'
    }),
  quantity: Joi.number().integer().min(1).required()
});

exports.updateCartValidator = Joi.object({
  quantity: Joi.number().integer().min(1).required()
});