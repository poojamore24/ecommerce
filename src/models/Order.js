const mongoose = require('mongoose');
const { ORDER_STATUS } = require('../config/constants');

const orderItemSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 1
  },
  priceAtPurchase: {
    type: Number,
    required: true,
    min: 0
  }
});

const orderSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  items: [orderItemSchema],
  totalAmount: {
    type: Number,
    required: true,
    min: 0
  },
  status: {
    type: String,
    enum: Object.values(ORDER_STATUS),
    default: ORDER_STATUS.PENDING_PAYMENT
  },
  expiresAt: {
    type: Date,
    required: true
  }
}, {
  timestamps: true
});

// ❌ REMOVE this line if you want to keep all orders
// orderSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// ✅ Instead, handle expired orders manually in your app logic:
orderSchema.statics.cancelExpiredOrders = async function () {
  const now = new Date();
  const expiredOrders = await this.find({
    expiresAt: { $lte: now },
    status: ORDER_STATUS.PENDING_PAYMENT
  });

  for (const order of expiredOrders) {
    order.status = ORDER_STATUS.CANCELLED;
    await order.save();
  }

  return expiredOrders.length;
};

module.exports = mongoose.model('Order', orderSchema);
