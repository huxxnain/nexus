const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');
const { sendSuccessResponse } = require('../utils/sendResponse');
const Product = require('../models/productModel');
const Pharmacy = require('../models/pharmcyModel');
const ProductCategory = require('../models/pharmacyProductCategoryModel');
const ProductImage = require('../models/productImageModel');
const Category = require('../models/categoryModel');
const APIFeatures = require('../utils/apiFeatures');
const ProductInventory = require('../models/pharmacyProductInventoryModel');
const mongoose = require('mongoose');

exports.getAllProducts = catchAsync(async (req, res, next) => {
  const page = req.query.page * 1 || 1;
  const limit = req.query.limit * 1 || 10;
  const skip = (page - 1) * limit;
  const products = await Product.aggregate([
    // {
    //   $match: {
    //     pharmacy_id: 'u2',
    //   },
    // },
    {
      $lookup: {
        from: 'productinventories',
        localField: '_id',
        foreignField: 'product',
        pipeline: [
          {
            $match: {
              $and: [
                {
                  expiry_date: {
                    $gte: new Date(),
                  },
                },
              ],
            },
          },
        ],
        as: 'product',
      },
    },
    {
      $project: {
        total: {
          $sum: '$product.quantity',
        },
        price: {
          $first: '$product.price',
        },

        name: 1,
        pharmacy: 1,
        imageCover: 1,
        product_name: 1,
        DRUG_IDENTIFICATION_NUMBER: 1,
        brand: 1,
        PRODUCT_CATEGORIZATION: 1,
        description: 1,
        createdAt: 1,
        updatedAt: 1,
      },
    },
    {
      $lookup: {
        from: 'pharmacies',
        localField: 'pharmacy',
        foreignField: '_id',
        pipeline: [
          {
            $project: {
              pharmacy_name: 1,
              status: 1,
            },
          },
        ],
        as: 'pharmacy',
      },
    },
    {
      $match: {
        $and: [
          {
            'pharmacy.status': {
              $eq: 'approved',
            },
          },
          {
            'pharmacy.status': {
              $eq: 'approved',
            },
          },
        ],
      },
    },
    { $sort: { createdAt: -1 } },
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
  return sendSuccessResponse(
    res,
    200,
    products,
    'Products fetched Successfully'
  );
});

exports.getOneProduct = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  if (!id) {
    return next(new AppError('Product ID is required field', 404));
  }

  let product = await Product.aggregate([
    {
      $match: {
        $and: [
          {
            _id: mongoose.Types.ObjectId(id),
          },
        ],
      },
    },
    {
      $lookup: {
        from: 'productinventories',
        localField: '_id',
        foreignField: 'product',
        pipeline: [
          {
            $match: {
              $and: [
                {
                  expiry_date: {
                    $gte: new Date(),
                  },
                },
                {
                  quantity: { $ne: 0 },
                },
              ],
            },
          },
          { $sort: { price: 1 } },
          { $limit: 1 },
        ],
        as: 'stock',
      },
    },

    {
      $project: {
        stock: '$stock',
        name: 1,
        pharmacy: 1,
        imageCover: 1,
        product_name: 1,
        description: 1,
        DRUG_IDENTIFICATION_NUMBER: 1,
        brand: 1,
        PRODUCT_CATEGORIZATION: 1,
        createdAt: 1,
        updatedAt: 1,
        images: 1,
        ingredients: 1,
      },
    },
    {
      $lookup: {
        from: 'pharmacies',
        localField: 'pharmacy',
        foreignField: '_id',
        pipeline: [
          {
            $project: {
              pharmacy_name: 1,
              status: 1,
            },
          },
        ],
        as: 'pharmacy',
      },
    },
    {
      $match: {
        $and: [
          {
            'pharmacy.status': {
              $eq: 'approved',
            },
          },
        ],
      },
    },
  ]);

  if (product.length == 0) {
    return next(
      new AppError(
        'Product doest not exist or pharamcy belongs to this product disabled by Admin',
        404
      )
    );
  }

  return sendSuccessResponse(
    res,
    200,
    product,
    'Product Detail fetched Successfully'
  );
});

exports.getSameProductInventories = catchAsync(async (req, res, next) => {
  const { din } = req.params;
  const { sort } = req.query;
  const page = req.query.page * 1 || 1;
  const limit = req.query.limit * 1 || 10;
  const skip = (page - 1) * limit;
  let sorting = {};

  if (!din) {
    return next(new AppError('DIN number is required field', 404));
  }
  let filter = {
    DIN_NUMBER: din,
    quantity: { $gt: 0 },
    expiry_date: {
      $gte: new Date(),
    },
  };

  if (sort) {
    if (sort == 'priceasc') {
      sorting.price = 1;
    } else if (sort == 'pricedesc') {
      sorting.price = -1;
    } else if (sort == 'expiryasc') {
      sorting.expiry_date = 1;
    } else if (sort == 'expirydesc') {
      sorting.expiry_date = -1;
    } else {
      sorting.createdAt = -1;
    }
  } else {
    sorting.createdAt = -1;
  }
  console.log(sorting);
  const inventories = await ProductInventory.aggregate([
    {
      $match: {
        ...filter,
      },
    },

    {
      $lookup: {
        from: 'products',
        localField: 'product',
        foreignField: '_id',
        pipeline: [
          {
            $project: {
              imageCover: 1,
              product_name: 1,
              brand: 1,
              DRUG_IDENTIFICATION_NUMBER: 1,
              PRODUCT_CATEGORIZATION: 1,
              description: 1,
              _id: 1,
              brand: 1,
            },
          },
        ],
        as: 'product',
      },
    },
    {
      $lookup: {
        from: 'pharmacies',
        localField: 'pharmacy',
        foreignField: '_id',
        pipeline: [
          {
            $project: {
              pharmacy_name: 1,
              status: 1,
            },
          },
        ],
        as: 'pharmacy',
      },
    },

    {
      $project: {
        pharmacy: 1,
        batch_number: 1,
        expiry_date: 1,
        _id: 1,
        quantity: 1,
        price: 1,
        createdAt: 1,
        updatedAt: 1,
        product: 1,
      },
    },
    {
      $match: {
        $and: [
          {
            'pharmacy.status': {
              $eq: 'approved',
            },
          },
          {
            'pharmacy.status': {
              $eq: 'approved',
            },
          },
        ],
      },
    },
    { $sort: { ...sorting } },
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
  return sendSuccessResponse(
    res,
    200,
    {
      inventories,
    },

    'Product inventories fetched Successfully'
  );
});

exports.getProductCategories = catchAsync(async (req, res, next) => {
  const features = new APIFeatures(ProductCategory.find(), req.query)
    .filter()
    .sort()
    .limitFields()
    .paginate();

  // const docs = await features.query.explain()
  const docCount = new APIFeatures(ProductCategory.find(), req.query).filter();
  const count = await docCount.query;
  const categories = await features.query;

  return sendSuccessResponse(
    res,
    200,
    {
      categories,
      count: count.length,
    },

    'Product categories fetched Successfully'
  );
});

exports.getSimilarProducts = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  if (!id) {
    return next(new AppError('ID is required field', 404));
  }

  const single = await Product.findOne({ _id: id });
  const page = req.query.page * 1 || 1;
  const limit = req.query.limit * 1 || 10;
  const skip = (page - 1) * limit;

  const products = await Product.aggregate([
    {
      $match: {
        $and: [
          {
            product_category: {
              $eq: single.product_category,
            },
          },
          {
            _id: {
              $ne: mongoose.Types.ObjectId(single._id),
            },
          },
        ],
      },
    },
    {
      $lookup: {
        from: 'productinventories',
        localField: '_id',
        foreignField: 'product',
        pipeline: [
          {
            $match: {
              $and: [
                {
                  expiry_date: {
                    $gte: new Date(),
                  },
                },
              ],
            },
          },
        ],
        as: 'product',
      },
    },
    {
      $project: {
        total: {
          $sum: '$product.quantity',
        },
        price: {
          $first: '$product.price',
        },

        name: 1,
        pharmacy: 1,
        imageCover: 1,
        product_name: 1,
        DRUG_IDENTIFICATION_NUMBER: 1,
        brand: 1,
        PRODUCT_CATEGORIZATION: 1,
        description: 1,
        createdAt: 1,
        updatedAt: 1,
      },
    },
    {
      $lookup: {
        from: 'pharmacies',
        localField: 'pharmacy',
        foreignField: '_id',
        pipeline: [
          {
            $project: {
              pharmacy_name: 1,
              status: 1,
            },
          },
        ],
        as: 'pharmacy',
      },
    },
    {
      $match: {
        $and: [
          {
            'pharmacy.status': {
              $eq: 'approved',
            },
          },
          {
            'pharmacy.status': {
              $eq: 'approved',
            },
          },
        ],
      },
    },
    { $sort: { createdAt: -1 } },
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
            $limit: 4,
          },
        ], // add projection here wish you re-shape the docs
      },
    },
  ]);
  return sendSuccessResponse(
    res,
    200,
    products,
    'Products fetched Successfully'
  );
});
