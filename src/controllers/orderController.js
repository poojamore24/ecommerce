// src/controllers/orderController.js
const Order = require('../models/Order');
const Payment = require('../models/Payment');
const OrderService = require('../services/orderService');
const StockService = require('../services/stockService');
const EmailService = require('../services/emailService');
const { sendResponse, sendError } = require('../utils/responseHandler');
const { ORDER_STATUS, PAYMENT_STATUS } = require('../config/constants');
const mongoose = require('mongoose');

// @desc    Create order from cart (checkout)
// @route   POST /api/orders/checkout
// @access  Private (User)
exports.checkout = async (req, res, next) => {
  try {
    const order = await OrderService.createOrderFromCart(req.user._id);
    
    await order.populate('items.productId', 'name price');

    sendResponse(res, 201, order, 'Order created successfully. Please complete payment within 15 minutes.');
  } catch (error) {
    next(error);
  }
};

// @desc    Process payment for order
// @route   POST /api/orders/:id/pay
// @access  Private (User)
exports.payOrder = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const orderId = req.params.id;
    const userId = req.user._id;

    const order = await Order.findById(orderId)
      .populate('userId', 'name email')
      .session(session);

    if (!order) {
      throw { status: 404, message: 'Order not found' };
    }

    if (order.userId._id.toString() !== userId.toString()) {
      throw { status: 403, message: 'Not authorized to pay this order' };
    }

    if (order.status !== ORDER_STATUS.PENDING_PAYMENT) {
      throw { status: 400, message: `Cannot pay order with status: ${order.status}` };
    }

    if (new Date() > order.expiresAt) {
      order.status = ORDER_STATUS.CANCELLED;
      await order.save({ session });
      await StockService.releaseReservedStock(order.items, session);
      await session.commitTransaction();
      return sendError(res, 400, 'Order has expired.');
    }

    // Simulate payment
    const transactionId = `TXN_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const paymentSuccess = Math.random() > 0.1;

    if (!paymentSuccess) {
      await StockService.releaseReservedStock(order.items, session);
      order.status = ORDER_STATUS.CANCELLED;
      await order.save({ session });

      await Payment.create([{
        orderId: order._id,
        transactionId,
        amount: order.totalAmount,
        status: PAYMENT_STATUS.FAILED
      }], { session });

      await session.commitTransaction();
      return sendError(res, 400, 'Payment failed. Please try again.');
    }

    // Payment success
    await StockService.confirmStock(order.items, session);
    order.status = ORDER_STATUS.PAID;
    await order.save({ session });

    const payment = await Payment.create([{
      orderId: order._id,
      transactionId,
      amount: order.totalAmount,
      status: PAYMENT_STATUS.SUCCESS
    }], { session });

    await session.commitTransaction();
    session.endSession(); // ✅ Explicitly close before sending emails

    // 🟩 Now run email logic safely outside of session
    setImmediate(async () => {
      try {
        await EmailService.sendOrderConfirmation(order, order.userId);
      } catch (emailErr) {
        console.error('❌ Email sending failed:', emailErr.message);
      }
    });

    await order.populate('items.productId', 'name price');
    sendResponse(res, 200, { order, payment: payment[0] }, 'Payment successful. Confirmation email sent.');
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    const status = error.status || 500;
    sendError(res, status, error.message || 'Payment processing failed');
  }
};


// @desc    Get user's orders
// @route   GET /api/orders
// @access  Private (User)
exports.getUserOrders = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Build filter - show all orders (complete history)
    const filter = { userId: req.user._id };
    
    // Optional: filter by status if provided in query
    if (req.query.status) {
      filter.status = req.query.status;
    }

    const orders = await Order.find(filter)
      .populate('items.productId', 'name price')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Order.countDocuments(filter);

    // Get order statistics for the user
    const statistics = await Order.aggregate([
      { $match: { userId: req.user._id } },
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
      statistics
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single order details
// @route   GET /api/orders/:id
// @access  Private (User)
exports.getOrderById = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('items.productId', 'name price description')
      .populate('userId', 'name email');

    if (!order) {
      return sendError(res, 404, 'Order not found');
    }

    // Check if order belongs to user
    if (order.userId._id.toString() !== req.user._id.toString()) {
      return sendError(res, 403, 'Not authorized to view this order');
    }

    // Get payment info if exists
    const payment = await Payment.findOne({ orderId: order._id });

    sendResponse(res, 200, {
      order,
      payment
    });
  } catch (error) {
    next(error);
  }
};