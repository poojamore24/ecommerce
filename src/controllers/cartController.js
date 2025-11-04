// src/controllers/cartController.js
const Cart = require('../models/Cart');
const Product = require('../models/Product');
const { sendResponse, sendError } = require('../utils/responseHandler');

// @desc    Get user's cart
// @route   GET /api/cart
// @access  Private (User)
exports.getCart = async (req, res, next) => {
  try {
    let cart = await Cart.findOne({ userId: req.user._id })
      .populate('items.productId', 'name price description availableStock');

    if (!cart) {
      // Create empty cart if not exists
      cart = await Cart.create({ userId: req.user._id, items: [] });
    }

    // Calculate total
    const total = cart.items.reduce((sum, item) => {
      return sum + (item.productId.price * item.quantity);
    }, 0);

    sendResponse(res, 200, {
      cart,
      total
    });
  } catch (error) {
    next(error);
  }
};




// @desc    Add item to cart or update quantity
// @route   POST /api/cart/items
// @access  Private (User)
exports.addToCart = async (req, res, next) => {
  try {
    const { productId, quantity } = req.body;

    // Validate quantity
    if (quantity <= 0) {
      return sendError(res, 400, 'Quantity must be greater than 0');
    }

    // Check if product exists and has enough stock
    const product = await Product.findById(productId);

    if (!product) {
      return sendError(res, 404, 'Product not found');
    }

    if (product.availableStock < quantity) {
      return sendError(res, 400, `Insufficient stock. Available: ${product.availableStock}`);
    }

    // Get or create cart
    let cart = await Cart.findOne({ userId: req.user._id });

    if (!cart) {
      cart = new Cart({ userId: req.user._id, items: [] });
    }

    // Check if item already exists in cart
    const existingItemIndex = cart.items.findIndex(
      item => item.productId && item.productId.toString() === productId
    );

    if (existingItemIndex > -1) {
      // Update quantity
      const newQuantity = cart.items[existingItemIndex].quantity + quantity;
      
      if (product.availableStock < newQuantity) {
        return sendError(res, 400, `Insufficient stock. Available: ${product.availableStock}`);
      }

      cart.items[existingItemIndex].quantity = newQuantity;
    } else {
      // Add new item
      cart.items.push({ productId, quantity });
    }

    // Save cart first
    await cart.save();

    // Fetch fresh cart with populated items
    cart = await Cart.findOne({ userId: req.user._id })
      .populate('items.productId', 'name price description availableStock');

    // Calculate total
    let total = 0;
    if (cart.items && cart.items.length > 0) {
      total = cart.items.reduce((sum, item) => {
        if (item.productId) {
          return sum + (item.productId.price * item.quantity);
        }
        return sum;
      }, 0);
    }

    sendResponse(res, 200, {
      cart,
      total,
      itemCount: cart.items.length
    }, 'Item added to cart successfully');
  } catch (error) {
    next(error);
  }
};

// @desc    Update cart item quantity
// @route   PATCH /api/cart/items/:productId
// @access  Private (User)
exports.updateCartItem = async (req, res, next) => {
  try {
    const { productId } = req.params;
    const { quantity } = req.body;

    // Validate quantity
    if (quantity <= 0) {
      return sendError(res, 400, 'Quantity must be greater than 0');
    }

    let cart = await Cart.findOne({ userId: req.user._id });

    if (!cart) {
      return sendError(res, 404, 'Cart not found');
    }

    // Find item in cart
    const itemIndex = cart.items.findIndex(
      item => item.productId.toString() === productId
    );

    if (itemIndex === -1) {
      return sendError(res, 404, 'Item not found in cart');
    }

    // Check product stock
    const product = await Product.findById(productId);

    if (!product) {
      return sendError(res, 404, 'Product not found');
    }

    if (product.availableStock < quantity) {
      return sendError(res, 400, `Insufficient stock. Available: ${product.availableStock}`);
    }

    // Update quantity
    cart.items[itemIndex].quantity = quantity;
    await cart.save();

    // Fetch fresh cart with populated items
    cart = await Cart.findOne({ userId: req.user._id })
      .populate('items.productId', 'name price description availableStock');

    // Calculate total
    let total = 0;
    if (cart.items && cart.items.length > 0) {
      total = cart.items.reduce((sum, item) => {
        if (item.productId) {
          return sum + (item.productId.price * item.quantity);
        }
        return sum;
      }, 0);
    }

    sendResponse(res, 200, {
      cart,
      total,
      itemCount: cart.items.length
    }, 'Cart updated successfully');
  } catch (error) {
    next(error);
  }
};

// @desc    Remove item from cart
// @route   DELETE /api/cart/items/:productId
// @access  Private (User)
exports.removeFromCart = async (req, res, next) => {
  try {
    const { productId } = req.params;

    const cart = await Cart.findOne({ userId: req.user._id });

    if (!cart) {
      return sendError(res, 404, 'Cart not found');
    }

    // Remove item from cart
    cart.items = cart.items.filter(
      item => item.productId.toString() !== productId
    );

    await cart.save();
    await cart.populate('items.productId', 'name price description availableStock');

    sendResponse(res, 200, cart, 'Item removed from cart successfully');
  } catch (error) {
    next(error);
  }
};
