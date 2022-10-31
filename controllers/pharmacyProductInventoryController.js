const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');
const { sendSuccessResponse } = require('../utils/sendResponse');
const Product = require('../models/productModel');
const Pharmacy = require('../models/pharmcyModel');
const ProductInventory = require('../models/pharmacyProductInventoryModel');
const APIFeatures = require('../utils/apiFeatures');

exports.createProductInventory = catchAsync(async (req, res, next) => {
  try {
    const { pharmacy, product } = req.body;
    const pharmacys = await Pharmacy.findOne({ _id: pharmacy });
    if (!pharmacys) {
      return next(new AppError('Pharmacy does not exists', 400));
    }
    const products = await Product.findOne({ _id: product });
    if (!products) {
      return next(new AppError('Product does not exists', 400));
    }

    let doc = await ProductInventory.create(req.body);
    return sendSuccessResponse(res, 200, doc, 'Inventory added successfully');
  } catch (err) {
    return next(new AppError(err.message));
  }
});

exports.getOne = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  let inventory = await ProductInventory.findById({ _id: id }).populate([
    { path: 'pharmacy', select: '-password' },
    { path: 'product' },
  ]);

  if (!id) {
    return next(new AppError('inventory ID is required field', 404));
  }

  if (!inventory) {
    return next(
      new AppError('Inventory doest not exist against given inventory id', 404)
    );
  }

  return sendSuccessResponse(
    res,
    200,
    inventory,
    'Inventory Detail fetched Successfully'
  );
});

exports.updateOne = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  let inventory = await ProductInventory.findByIdAndUpdate(id, req.body, {
    new: true,
    runValidators: true,
  });

  if (!id) {
    return next(new AppError('inventory ID is required field', 404));
  }

  if (!inventory) {
    return next(
      new AppError('Inventory doest not exist against given inventory id', 404)
    );
  }

  return sendSuccessResponse(
    res,
    200,
    inventory,
    'Inventory Detail updated Successfully'
  );
});

exports.deleteOne = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  if (!id) {
    return next(new AppError('Inventory ID  is required field', 404));
  }

  const productInventory = await ProductInventory.findByIdAndDelete(id);

  if (!productInventory) {
    return next(new AppError('No document found with that ID', 404));
  }

  return sendSuccessResponse(res, 200, null, 'Inventory deleted Successfully');
});

exports.getAllInventoriesByProduct = catchAsync(async (req, res, next) => {
  const { productId } = req.params;
  const product = await Product.findOne({ _id: productId });
  if (!product) {
    return next(new AppError('Product does not exists', 400));
  }

  const features = new APIFeatures(
    ProductInventory.find({ product_id: productId }).sort({ createdAt: 1 }),
    req.query
  )
    .filter()
    .sort()
    .limitFields()
    .paginate();
  const inventories = await features.query;
  return sendSuccessResponse(
    res,
    200,
    {
      inventories,
      count: inventories.length,
    },
    'Inventories fetched Successfully'
  );
});
