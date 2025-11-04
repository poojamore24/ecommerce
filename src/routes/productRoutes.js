
// src/routes/productRoutes.js
const express = require('express');
const router = express.Router();
const {
  getProducts,
  createProduct,
  updateProduct,
  deleteProduct
} = require('../controllers/productController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/roleCheck');
const validate = require('../middleware/validate');
const { createProductValidator, updateProductValidator } = require('../validators/productValidator');

router.get('/All', getProducts);
router.post('/', protect, authorize('ADMIN'), validate(createProductValidator), createProduct);
router.put('/:id', protect, authorize('ADMIN'), validate(updateProductValidator), updateProduct);
router.delete('/:id', protect, authorize('ADMIN'), deleteProduct);

module.exports = router;
