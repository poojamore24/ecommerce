
// src/routes/cartRoutes.js
const express = require('express');
const router = express.Router();
const {
  getCart,
  addToCart,  
  updateCartItem,
  removeFromCart
} = require('../controllers/cartController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/roleCheck');
const validate = require('../middleware/validate');
const { addToCartValidator, updateCartValidator } = require('../validators/cartValidator');

router.use(protect);
router.use(authorize('USER'));

router.get('/', getCart);
router.post('/items', validate(addToCartValidator), addToCart);
router.delete('/items/:productId', removeFromCart);
router.patch('/items/:productId', validate(updateCartValidator), updateCartItem);

module.exports = router;
