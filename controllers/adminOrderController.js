const Pharmacy = require('../models/pharmcyModel');
const Order = require('../models/orderModel');
const SubOrder = require('../models/subOrderModel');
const AppError = require('./../utils/appError');
const { sendSuccessResponse } = require('../utils/sendResponse');
const catchAsync = require('./../utils/catchAsync');
const APIFeatures = require('../utils/apiFeatures');
const Product = require('../models/productModel');

exports.getOrders = catchAsync(async (req, res, next) => {
  const page = req.query.page * 1 || 1;
  const limit = req.query.limit * 1 || 20;
  const skip = (page - 1) * limit;
  let orders = await Order.aggregate([
    {
      $lookup: {
        from: 'suborders',
        localField: '_id',
        foreignField: 'parentOrder',
        pipeline: [
          {
            $unwind: '$products',
          },

          {
            $lookup: {
              from: 'products',
              localField: 'products.productId',
              foreignField: '_id',
              pipeline: [
                {
                  $project: {
                    product_name: 1,
                    brand: 1,
                    imageCover: 1,
                  },
                },
              ],
              as: 'products.product',
            },
          },

          {
            $unwind: '$products.product',
          },
          // Group back to arrays

          {
            $lookup: {
              from: 'pharmacies',
              localField: 'orderedTo',
              foreignField: '_id',
              pipeline: [
                {
                  $project: {
                    pharmacy_name: 1,
                  },
                },
              ],
              as: 'orderedTo',
            },
          },

          {
            $unwind: '$orderedTo',
          },

          {
            $group: {
              _id: '$_id',
              products: {
                $push: '$products',
              },
              orderedTo: {
                $first: '$orderedTo',
              },
              cartTotal: {
                $first: '$cartTotal',
              },
            },
          },
          // {
          //   $lookup: {
          //     from: 'pharmacies',
          //     localField: 'orderedTo',
          //     foreignField: '_id',
          //     pipeline: [
          //       {
          //         $project: {
          //           pharmacy_name: 1,
          //         },
          //       },
          //     ],
          //     as: 'orderedTo',
          //   },
          // },
        ],
        as: 'suborders',
      },
    },

    {
      $lookup: {
        from: 'pharmacies',
        localField: 'orderedBy',
        foreignField: '_id',
        pipeline: [
          {
            $project: {
              pharmacy_name: 1,
            },
          },
        ],
        as: 'orderedBy',
      },
    },
    // {
    //   $lookup: {
    //     from: 'pharmacies',
    //     localField: 'suborders.orderedTo',
    //     foreignField: '_id',
    //     pipeline: [
    //       {
    //         $project: {
    //           pharmacy_name: 1,
    //         },
    //       },
    //     ],
    //     as: 'orderedTo',
    //   },
    // },
    // {
    //   $set: {
    //     'suborders.orderedTo': '$orderedTo',
    //   },
    // },

    {
      $project: {
        orderStatus: 1,
        subOrders: '$suborders',
        orderedBy: '$orderedBy',
        total: 1,
      },
    },
    {
      $facet: {
        metadata: [
          {
            $count: 'total',
          },
          {
            $addFields: {
              page: Number(page),
            },
          },
        ],
        data: [
          {
            $skip: skip,
          },
          {
            $limit: limit,
          },
        ], // add projection here wish you re-shape the docs
      },
    },
  ]);

  // const features = new APIFeatures(
  //   Order.find().sort({ createdAt: 1 }),
  //   req.query
  // )
  //   .filter()
  //   .sort()
  //   .limitFields()
  //   .paginate();

  // const docCount = new APIFeatures(Order.find(), req.query).filter();

  // const count = await docCount.query;

  // const orders = await features.query;

  // const copiedObj = JSON.parse(JSON.stringify(orders));
  // for (let i = 0; i < copiedObj.length; i++) {
  //   let id = copiedObj[i]._id;
  //   copiedObj[i].suborders = await SubOrder.find({
  //     parentOrder: id,
  //   }).populate([
  //     {
  //       path: 'products.product',
  //       populate: [
  //         {
  //           path: 'product',
  //           select: 'imageCover product_name brand',
  //         },
  //       ],
  //     },
  //     { path: 'orderedTo', select: 'pharmacy_name ' },
  //     { path: 'orderedBy', select: 'pharmacy_name ' },
  //   ]);
  // }

  return sendSuccessResponse(
    res,
    200,
    { orders },
    'Orders fetched Successfully'
  );
});
