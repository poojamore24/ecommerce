
// src/services/stockService.js
const Product = require('../models/Product');
const mongoose = require('mongoose');

class StockService {
  static async reserveStock(items, session) {
    const reservations = [];

    for (const item of items) {
      const product = await Product.findById(item.productId).session(session);

      if (!product) {
        throw new Error(`Product ${item.productId} not found`);
      }

      if (product.availableStock < item.quantity) {
        throw new Error(
          `Insufficient stock for ${product.name}. Available: ${product.availableStock}, Requested: ${item.quantity}`
        );
      }

      // Reserve stock atomically
      product.availableStock -= item.quantity;
      product.reservedStock += item.quantity;
      await product.save({ session });

      reservations.push({
        productId: product._id,
        quantity: item.quantity,
        priceAtPurchase: product.price
      });
    }

    return reservations;
  }

  static async releaseReservedStock(items, session) {
    for (const item of items) {
      const product = await Product.findById(item.productId).session(session);
      
      if (product) {
        product.availableStock += item.quantity;
        product.reservedStock -= item.quantity;
        await product.save({ session });
      }
    }
  }

  static async confirmStock(items, session) {
    for (const item of items) {
      const product = await Product.findById(item.productId).session(session);
      
      if (product) {
        // Simply reduce reserved stock (available stock already reduced during reservation)
        product.reservedStock -= item.quantity;
        await product.save({ session });
      }
    }
  }
}

module.exports = StockService;