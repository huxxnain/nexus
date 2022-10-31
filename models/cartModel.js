const mongoose = require('mongoose');
const { ObjectId } = mongoose.Schema;

const cartSchema = new mongoose.Schema(
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
    total: Number,
    orderedBy: { type: ObjectId, ref: 'Pharmacy' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Cart', cartSchema);
