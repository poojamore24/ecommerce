// src/controllers/productController.js
const Product = require('../models/Product');
const { sendResponse, sendError } = require('../utils/responseHandler');

// @desc    Get all products with pagination, sorting, and filtering
// @route   GET /api/products
// @access  Public
exports.getProducts = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Sorting
    const sortBy = req.query.sortBy || 'createdAt';
    const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;
    const sortOptions = { [sortBy]: sortOrder };

    // Filtering by name
    const filter = {};
    if (req.query.name) {
      filter.name = { $regex: req.query.name, $options: 'i' };
    }

    // Get products
    const products = await Product.find(filter)
      .sort(sortOptions)
      .skip(skip)
      .limit(limit);

    const total = await Product.countDocuments(filter);

    sendResponse(res, 200, {
      products,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create a new product
// @route   POST /api/products
// @access  Admin
exports.createProduct = async (req, res, next) => {
  try {
    const { name, price, description, availableStock } = req.body;

    const product = await Product.create({
      name,
      price,
      description,
      availableStock,
      reservedStock: 0
    });

    sendResponse(res, 201, product, 'Product created successfully');
  } catch (error) {
    next(error);
  }
};

// @desc    Update a product
// @route   PUT /api/products/:id
// @access  Admin
exports.updateProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return sendError(res, 404, 'Product not found');
    }

    const { name, price, description, availableStock } = req.body;

    if (name) product.name = name;
    if (price !== undefined) product.price = price;
    if (description) product.description = description;
    if (availableStock !== undefined) product.availableStock = availableStock;

    await product.save();

    sendResponse(res, 200, product, 'Product updated successfully');
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a product
// @route   DELETE /api/products/:id
// @access  Admin
exports.deleteProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return sendError(res, 404, 'Product not found');
    }

    // Check if product has reserved stock
    if (product.reservedStock > 0) {
      return sendError(res, 400, 'Cannot delete product with reserved stock');
    }

    await Product.findByIdAndDelete(req.params.id);

    sendResponse(res, 200, null, 'Product deleted successfully');
  } catch (error) {
    next(error);
  }
};