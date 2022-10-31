const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const { v4: uuidv4 } = require('uuid');

const productInventorySchema = new Schema(
  {
    product: {
      type: mongoose.Schema.ObjectId,
      ref: 'Product',
      index: true,
      required: true,
    },
    batch_number: {
      type: String,
      default: () => uuidv4(),
      index: true,
    },
    pharmacy: {
      type: mongoose.Schema.ObjectId,
      ref: 'Pharmacy',
      index: true,
      required: true,
    },
    quantity: {
      type: Number,
      index: true,
      required: true,
    },
    expiry_date: {
      type: Date,
      required: true,
    },
    type: {
      type: String,
      default: 'self',
    },
    order_id: {
      type: String,
    },
    price: {
      type: Number,
    },
    DIN_NUMBER: {
      type: String,
      required: [true, 'DIN number is required field'],
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

productInventorySchema.index({ DIN_NUMBER: 1 });
productInventorySchema.index({ createdAt: 1 });
productInventorySchema.index({ expiry_date: 1 }, { expireAfterseconds: 0 });
const ProductInventory = mongoose.model(
  'ProductInventory',
  productInventorySchema
);
module.exports = ProductInventory;
