
const Joi = require('joi');

exports.updateOrderStatusValidator = Joi.object({
  status: Joi.string().valid('SHIPPED', 'DELIVERED').required()
});