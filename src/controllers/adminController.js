// src/controllers/adminController.js
const Order = require('../models/Order');
const { sendResponse, sendError } = require('../utils/responseHandler');
const { ORDER_STATUS } = require('../config/constants');

// @desc    Get all orders (Admin)
// @route   GET /api/admin/orders
// @access  Private (Admin)
exports.getAllOrders = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Filter by status if provided
    const filter = {};
    if (req.query.status) {
      filter.status = req.query.status;
    }

    const orders = await Order.find(filter)
      .populate('userId', 'name email')
      .populate('items.productId', 'name price')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Order.countDocuments(filter);

    // Get status statistics
    const stats = await Order.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalAmount: { $sum: '$totalAmount' }
        }
      }
    ]);

    sendResponse(res, 200, {
      orders,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      },
      statistics: stats
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update order status (Admin)
// @route   PATCH /api/admin/orders/:id/status
// @access  Private (Admin)
exports.updateOrderStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const orderId = req.params.id;

    const order = await Order.findById(orderId)
      .populate('userId', 'name email')
      .populate('items.productId', 'name price');

    if (!order) {
      return sendError(res, 404, 'Order not found');
    }

    // Validate status transition
    const allowedTransitions = {
      [ORDER_STATUS.PENDING_PAYMENT]: [],
      [ORDER_STATUS.PAID]: [ORDER_STATUS.SHIPPED],
      [ORDER_STATUS.SHIPPED]: [ORDER_STATUS.DELIVERED],
      [ORDER_STATUS.DELIVERED]: [],
      [ORDER_STATUS.CANCELLED]: []
    };

    if (!allowedTransitions[order.status].includes(status)) {
      return sendError(
        res, 
        400, 
        `Cannot transition from ${order.status} to ${status}`
      );
    }

    // Update status
    order.status = status;
    await order.save();

    sendResponse(res, 200, order, `Order status updated to ${status}`);
  } catch (error) {
    next(error);
  }
};