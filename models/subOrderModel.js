const mongoose = require('mongoose');
const { ObjectId } = mongoose.Schema;

const subOrderSchema = new mongoose.Schema(
  {
    products: [
      {
        product: {
          type: ObjectId,
          ref: 'ProductInventory',
        },
        productId: {
          type: ObjectId,
          ref: 'Product',
        },
        count: Number,
        price: Number,
      },
    ],
    paymentIntent: {},
    orderStatus: {
      type: String,
      default: 'Not Processed',
      enum: [
        'Not Processed',
        'processing',
        'Dispatched',
        'Cancelled',
        'Completed',
      ],
    },
    cartTotal: Number,
    orderedBy: { type: ObjectId, ref: 'Pharmacy' },
    orderedTo: { type: ObjectId, ref: 'Pharmacy' },
    parentOrder: { type: ObjectId, ref: 'Order' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('SubOrder', subOrderSchema);
