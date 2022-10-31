const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const { ObjectId } = mongoose.Schema;

const orderSchema = new mongoose.Schema(
  {
    carts: [
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
        shipping: { type: Object },
        cartTotal: Number,
        orderedTo: { type: ObjectId, ref: 'Pharmacy' },
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
    total: Number,
    orderedBy: { type: ObjectId, ref: 'Pharmacy' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Order', orderSchema);
