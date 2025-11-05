
// src/routes/orderRoutes.js
const express = require('express');
const router = express.Router();
const {
  checkout,
  payOrder,
  getUserOrders,
  getOrderById
} = require('../controllers/orderController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/roleCheck');

router.use(protect);
router.use(authorize('USER'));

router.post('/checkout', checkout);
router.get('/', getUserOrders);


router.get('/:id', getOrderById);
router.post('/:id/pay', payOrder);


module.exports = router;
