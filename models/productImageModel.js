const { string } = require('joi');
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const productImageSchema = new Schema(
  {
    product_id: {
      type: mongoose.Schema.ObjectId,
      ref: 'Product',
      required: [true, 'Image Category must belong to a pharmacy'],
      index: true,
    },

    image: {
      thumbnail: {
        type: String,
      },
      full_image: {
        type: String,
        required: true,
      },
    },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
  {
    timestamps: true,
  }
);

const ProductImage = mongoose.model('ProductImage', productImageSchema);
module.exports = ProductImage;
