const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const validator = require('validator');
const bcrypt = require('bcryptjs');

const categorySchema = new Schema(
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

const Category = mongoose.model('Category', categorySchema);
module.exports = Category;
