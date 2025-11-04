
// src/routes/adminRoutes.js
const express = require('express');
const router = express.Router();
const {
  getAllOrders,
  updateOrderStatus
} = require('../controllers/adminController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/roleCheck');
const validate = require('../middleware/validate');
const { updateOrderStatusValidator } = require('../validators/orderValidator');

router.use(protect);
router.use(authorize('ADMIN'));

router.get('/orders', getAllOrders);
router.patch('/orders/:id/status', validate(updateOrderStatusValidator), updateOrderStatus);

module.exports = router;