const Pharmacy = require('../models/pharmcyModel');
const Cart = require('../models/cartModel');
const ProductInventory = require('../models/pharmacyProductInventoryModel');
const AppError = require('./../utils/appError');
const { sendSuccessResponse } = require('../utils/sendResponse');
const catchAsync = require('./../utils/catchAsync');
const { find, off } = require('../models/pharmcyModel');

exports.userCart = catchAsync(async (req, res, next) => {
  // console.log(req.body); // {cart: []}
  const { products } = req.body;

  // let carts = [];

  const user = await Pharmacy.findOne({ _id: req.user._id }).exec();

  // check if cart with logged in user id already exist
  let cartExistByThisUser = await Cart.findOne({ orderdBy: user._id }).exec();

  if (cartExistByThisUser) {
    cartExistByThisUser.remove();
    console.log('removed old cart');
  }

  let ids = products?.map((el) => el._id);

  let productForCart = await ProductInventory.find({
    _id: { $in: [...ids] },
  });

  if (productForCart && productForCart?.length > 0) {
    productForCart = JSON.parse(JSON.stringify(productForCart));
    productForCart = productForCart?.map((item) => ({
      ...products?.find((el) => el._id == item._id && el),
      productId: item.product,
      ...item,
    }));
  }
  let groupByData = productForCart?.reduce((result, currentValue) => {
    if (!result[currentValue['pharmacy']]) {
      result[currentValue['pharmacy']] = [];
    }
    currentValue.product = currentValue._id;
    result[currentValue['pharmacy']].push(currentValue);

    return result;
  }, {});

  let values = Object?.values(groupByData);
  let carts = [];
  if (values && values?.length > 0) {
    for (let i = 0; i < values?.length; i++) {
      let object = {};

      object.products = values[i];
      object.orderedTo = values[i][0].pharmacy;
      object.cartTotal = values[i]?.reduce((accum, curr) => {
        return accum + curr.price * curr.count;
      }, 0);

      carts.push(object);
    }
  }
  let total = productForCart?.reduce((acc, curr) => {
    return acc + curr.price * curr.count;
  }, 0);

  let newCart = await new Cart({
    carts,
    total,
    orderedBy: user._id,
  }).save();

  // console.log('new cart', newCart);
  return sendSuccessResponse(res, 200, { ok: true }, 'Cart saved Successfully');
});

exports.getUserCart = catchAsync(async (req, res, next) => {
  const user = await Pharmacy.findOne({ _id: req.user._id }).exec();

  let cart = await Cart.findOne({ orderdBy: user._id })
    .populate({
      path: 'carts.products.product',
      populate: [
        {
          path: 'product',
          select: 'imageCover brand product_name ',
        },
        { path: 'pharmacy', select: 'pharmacy_name ' },
      ],
    })
    .exec();

  return sendSuccessResponse(
    res,
    200,
    cart,
    'Cart information fetched Successfully'
  );
});

exports.emptyCart = catchAsync(async (req, res, next) => {
  const user = await Pharmacy.findOne({ _id: req.user._id }).exec();

  let cart = await Cart.findOneAndRemove({ orderdBy: user._id });

  return sendSuccessResponse(
    res,
    200,
    { ok: true },
    'Cart deleted Successfully'
  );
});
