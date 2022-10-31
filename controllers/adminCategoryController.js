const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');
const { sendSuccessResponse } = require('../utils/sendResponse');
const Category = require('../models/categoryModel');
const APIFeatures = require('../utils/apiFeatures');

exports.createCategory = catchAsync(async (req, res, next) => {
  let { title } = req.body;

  if (!title) {
    return next(new AppError('Title is mandatory field', 400));
  }

  let doc = await Category.create(req.body);
  return sendSuccessResponse(res, 200, doc, 'Category created successfully');
});

exports.getAllCategories = catchAsync(async (req, res, next) => {
  const features = new APIFeatures(Category.find(), req.query)
    .filter()
    .sort()
    .limitFields()
    .paginate();
  const categories = await features.query;
  return sendSuccessResponse(
    res,
    200,
    categories,
    'Categories fetched successfully'
  );
});

exports.getOne = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  let category = await Category.findById({ _id: id });

  if (!id) {
    return next(new AppError('Category ID is required field', 404));
  }

  if (!category) {
    return next(
      new AppError('Category doest not exist against given pharmacy id', 404)
    );
  }

  return sendSuccessResponse(
    res,
    200,
    category,
    'Category fetched Successfully'
  );
});

exports.updateOne = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const { title } = req.body;

  if (!id || !title) {
    return next(new AppError('Category ID and title are required field', 404));
  }

  let category = await Category.findByIdAndUpdate(id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!category) {
    return next(
      new AppError('Category doest not exist against given pharmacy id', 404)
    );
  }
  return sendSuccessResponse(
    res,
    200,
    category,
    'Category updated Successfully'
  );
});

exports.deleteOne = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  if (!id) {
    return next(new AppError('Category ID  is required field', 404));
  }

  const category = await Category.findByIdAndDelete(id);

  if (!category) {
    return next(new AppError('No document found with that ID', 404));
  }

  return sendSuccessResponse(res, 200, null, 'Category deleted Successfully');
});
