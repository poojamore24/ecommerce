


const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Product name is required'],
    trim: true
  },
  price: {
    type: Number,
    required: [true, 'Price is required'],
    min: 0
  },
  description: {
    type: String,
    required: [true, 'Description is required']
  },
  availableStock: {
    type: Number,
    required: true,
    default: 0,
    min: 0
  },
  reservedStock: {
    type: Number,
    default: 0,
    min: 0
  }
}, {
  timestamps: true
});

// Virtual for total stock
productSchema.virtual('totalStock').get(function() {
  return this.availableStock + this.reservedStock;
});

module.exports = mongoose.model('Product', productSchema);
