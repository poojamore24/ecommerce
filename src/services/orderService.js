

const Order = require('../models/Order');
const Cart = require('../models/Cart');
const StockService = require('./stockService');
const { ORDER_STATUS, ORDER_TIMEOUT } = require('../config/constants');
const mongoose = require('mongoose');

class OrderService {
  static async createOrderFromCart(userId) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // Get user's cart
      const cart = await Cart.findOne({ userId }).populate('items.productId').session(session);

      if (!cart || cart.items.length === 0) {
        throw new Error('Cart is empty');
      }

      // Reserve stock for all items
      const orderItems = await StockService.reserveStock(cart.items, session);

      // Calculate total amount
      const totalAmount = orderItems.reduce(
        (sum, item) => sum + item.priceAtPurchase * item.quantity,
        0
      );

      // Create order with expiration time
      const expiresAt = new Date(Date.now() + ORDER_TIMEOUT);
      
      const order = await Order.create(
        [{
          userId,
          items: orderItems,
          totalAmount,
          status: ORDER_STATUS.PENDING_PAYMENT,
          expiresAt
        }],
        { session }
      );

      // Clear the cart
      cart.items = [];
      await cart.save({ session });

      // Commit transaction
      await session.commitTransaction();

      // Schedule order expiration check
      this.scheduleOrderExpiration(order[0]._id, ORDER_TIMEOUT);

      return order[0];
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  static scheduleOrderExpiration(orderId, timeout) {
    setTimeout(async () => {
      const session = await mongoose.startSession();
      session.startTransaction();

      try {
        const order = await Order.findById(orderId).session(session);

        if (order && order.status === ORDER_STATUS.PENDING_PAYMENT) {
          // Release reserved stock
          await StockService.releaseReservedStock(order.items, session);

          // Update order status
          order.status = ORDER_STATUS.CANCELLED;
          await order.save({ session });

          await session.commitTransaction();
          console.log(`⏰ Order ${orderId} expired and cancelled`);
        } else {
          await session.abortTransaction();
        }
      } catch (error) {
        await session.abortTransaction();
        console.error('Error expiring order:', error);
      } finally {
        session.endSession();
      }
    }, timeout);
  }
}

module.exports = OrderService;