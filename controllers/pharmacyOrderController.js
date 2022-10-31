const Pharmacy = require('../models/pharmcyModel');
const Cart = require('../models/cartModel');
const Order = require('../models/orderModel');
const SubOrder = require('../models/subOrderModel');
const ProductInventory = require('../models/pharmacyProductInventoryModel');
const AppError = require('./../utils/appError');
const { sendSuccessResponse } = require('../utils/sendResponse');
const catchAsync = require('./../utils/catchAsync');
const APIFeatures = require('../utils/apiFeatures');

exports.createOrder = catchAsync(async (req, res, next) => {
  const user = await Pharmacy.findOne({ _id: req.user._id }).exec();
  let cart = await Cart.findOne({ orderdBy: user._id }).exec();

  let products = [];
  const copiedObj = JSON.parse(JSON.stringify(cart));
  delete copiedObj['_id'];
  // for (let i = 0; i < 50000; i++) {
  let newOrder = await new Order({
    ...copiedObj,
  }).save();

  for (let i = 0; i < copiedObj.carts.length; i++) {
    let newSubOrder = await new SubOrder({
      products: copiedObj.carts[i].products,
      parentOrder: newOrder._id,
      orderedBy: user._id,
      orderedTo: copiedObj.carts[i].orderedTo,
      cartTotal: copiedObj.carts[i].cartTotal,
    }).save();
    products.push(copiedObj.carts[i].products);
  }

  products = products.flat(Infinity);
  console.log(products);
  let bulkOption = products.map((item) => {
    return {
      updateOne: {
        filter: { _id: item.product }, // IMPORTANT item.product
        update: { $inc: { quantity: -item.count } },
      },
    };
  });

  let updated = await ProductInventory.bulkWrite(bulkOption, {});
  // }
  return sendSuccessResponse(
    res,
    200,
    { ok: newOrder },
    'Order created Successfully'
  );
});

exports.getPurchaseOrders = catchAsync(async (req, res, next) => {
  console.log('------------------------------->');
  const features = new APIFeatures(
    Order.find({ orderedBy: req.user._id })
      .sort({ createdAt: 1 })
      .populate({
        path: 'carts.products.product',
        populate: [
          {
            path: 'product',
            select: 'imageCover brand product_name',
          },
          { path: 'pharmacy', select: 'pharmacy_name ' },
        ],
      }),
    req.query
  )
    .filter()
    .sort()
    .limitFields()
    .paginate();

  const docCount = new APIFeatures(
    Order.find({ orderedBy: req.user._id }),
    req.query
  ).filter();

  const count = await docCount.query;

  const orders = await features.query;
  return sendSuccessResponse(
    res,
    200,
    {
      orders,
      count: count.length,
    },
    'Purchased orders fetched Successfully'
  );
});

exports.getPurchaseOrderDetail = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  let order = await Order.findById({ _id: id }).populate({
    path: 'carts.products.product',
    populate: [
      {
        path: 'product',
        select: 'imageCover product_name brand ',
      },
      { path: 'pharmacy', select: 'pharmacy_name ' },
    ],
  });

  if (!id) {
    return next(new AppError('Order ID is required field', 404));
  }

  if (!order) {
    return next(
      new AppError('Order doest not exist against given order id', 404)
    );
  }

  return sendSuccessResponse(
    res,
    200,
    order,
    'Purchased order detail fetched Successfully'
  );
});

exports.getOrders = catchAsync(async (req, res, next) => {
  const features = new APIFeatures(
    SubOrder.find({ orderedTo: req.user._id })
      .sort({ createdAt: 1 })
      .populate([
        {
          path: 'products.product',
          populate: [
            {
              path: 'product',
              select: 'imageCover brand product_name ',
            },
          ],
        },
        { path: 'orderedTo', select: 'pharmacy_name' },
        { path: 'orderedBy', select: 'pharmacy_name ' },
      ]),

    req.query
  )
    .filter()
    .sort()
    .limitFields()
    .paginate();

  const docCount = new APIFeatures(
    Order.find({ orderedBy: req.user._id }),
    req.query
  ).filter();

  const count = await docCount.query;

  const orders = await features.query;
  return sendSuccessResponse(
    res,
    200,
    {
      orders,
      count: count.length,
    },
    'Orders fetched Successfully'
  );
});

exports.getOrderDetail = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  let order = await SubOrder.findById({ _id: id })
    .populate({
      path: 'products.product',
      populate: [
        {
          path: 'product',
          select:
            'imageCover product_name brand  PRODUCT_CATEGORIZATION  DRUG_IDENTIFICATION_NUMBER',
        },
      ],
    })
    .populate({
      path: 'orderedTo',
      select: 'pharmacy_name ',
    })
    .populate({
      path: 'orderedBy',
      select: 'pharmacy_name ',
    });

  if (!id) {
    return next(new AppError('Order ID is required field', 404));
  }

  if (!order) {
    return next(
      new AppError('Order doest not exist against given order id', 404)
    );
  }

  return sendSuccessResponse(
    res,
    200,
    order,
    'Order detail fetched Successfully'
  );
});
