const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const productCategorySchema = new Schema(
  {
    title: {
      type: String,
      maxLength: 200,
      required: [true, 'Title is required filed!'],
      unique: true,
    },
  },
  {
    timestamps: true,
  }
);

const ProductCategory = mongoose.model(
  'ProductCategory',
  productCategorySchema
);
module.exports = ProductCategory;
