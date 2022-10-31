const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');
const { sendSuccessResponse } = require('../utils/sendResponse');
const sharp = require('sharp');
const csv = require('@fast-csv/parse');
const imageThumbnail = require('image-thumbnail');
const streamifier = require('streamifier');
const multer = require('multer');
const Product = require('../models/productModel');
const Pharmacy = require('../models/pharmcyModel');
const ProductCategory = require('../models/pharmacyProductCategoryModel');
const ProductImage = require('../models/productImageModel');
const Category = require('../models/categoryModel');
const APIFeatures = require('../utils/apiFeatures');
const ProductInventory = require('../models/pharmacyProductInventoryModel');
const mongoose = require('mongoose');
const fs = require('fs');
const QRYM_DRUG_PRODUCT = require('../models/qrymDrugProductModel');
const firebaseStorage = require('../firebase/firebase');
const { v4: uuidv4 } = require('uuid');
const { object } = require('joi');

const storageRef = firebaseStorage
  .storage()
  .bucket(process.env.FIREBASE_BUCKET);
const multerStorage = multer.memoryStorage();

const multerFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image')) {
    cb(null, true);
  } else {
    cb(new AppError('Not an image! Please upload only images.', 400), false);
  }
};

const uploadCsv = multer({
  storage: multerStorage,
  // fileFilter: multerFilter,
});

const upload = multer({
  storage: multerStorage,
  fileFilter: multerFilter,
});

exports.uploadProductImages = upload.single('image');

// upload.single('image') req.file
// upload.array('images', 5) req.files

exports.resizeProductImages = catchAsync(async (req, res, next) => {
  if (!req.file) next();
  // 1) Cover image
  let uuid = uuidv4();
  let filename = `product-${uuid}-${req.user._id}-${Date.now()}-cover.jpeg`;
  await sharp(req.file.buffer)
    .resize(650, 650)
    .toFormat('jpeg')
    .jpeg({ quality: 90 })
    .toFile(`public/img/products/${filename}`);

  try {
    const upload = await storageRef.upload(`public/img/products/${filename}`, {
      public: true,
      destination: `pharmacy/products/${filename}`,
      metadata: {
        metadata: {
          firebaseStorageDownloadTokens: uuidv4(),
        },
      },
    });
    (req.body.image = {
      full_image: upload[0].metadata.mediaLink,
      public_id: filename,
    }),
      fs.unlink(`public/img/products/${filename}`, function (err) {
        if (err) return console.log(err);
        console.log('file deleted successfully');
      });
  } catch (err) {
    next(new AppError(err.message, 400));
  }

  next();

  // 2) Images
});

exports.uploadProducts = uploadCsv.single('products');

exports.createProduct = catchAsync(async (req, res, next) => {
  // try {
  const { pharmacy_id, category_name, product_category_name } = req.body;
  const pharmacy = await Pharmacy.findOne({ _id: pharmacy_id });
  if (!pharmacy) {
    return next(new AppError('Pharmacy does not exists', 400));
  }
  // const category = await Category.findOne({ title: category_name });
  // if (!category) {
  //   return next(new AppError('Category does not exists', 400));
  // }

  let product_category = await ProductCategory.findOne({
    title: product_category_name,
  });

  if (!product_category) {
    product_category = await ProductCategory.create({
      title: product_category_name,
    });
  }

  let data = { ...req.body };
  // data.category_id = category._id;
  data.pharmacy = pharmacy._id;
  data.product_category = product_category._id;
  let doc = await Product.create(data);
  let inventory = await ProductInventory.create({
    pharmacy: pharmacy_id,
    product: doc._id,
    expiry_date: req.body.expiry_date,
    quantity: req.body.quantity,
    batch_number: req.body.batch_number,
    price: req?.body?.price,
    DIN_NUMBER: req.body.DRUG_IDENTIFICATION_NUMBER,
  });
  return sendSuccessResponse(res, 200, doc, 'Product created successfully');
  // } catch (err) {
  //   return next(new AppError(err.message));
  // }
});

exports.getOne = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  let product = await Product.findById({ _id: id });

  if (!id) {
    return next(new AppError('Product ID is required field', 404));
  }

  if (!product) {
    return next(
      new AppError('Product doest not exist against given product id', 404)
    );
  }

  let stock = await ProductInventory.aggregate([
    {
      $match: {
        product_id: mongoose.Types.ObjectId(id),
      },
    },
    {
      $group: {
        _id: {
          product_id: '$product_id',
        },
        stock: {
          $sum: '$quantity',
        },
      },
    },
  ]);

  if (product) {
    const copiedObj = JSON.parse(JSON.stringify(product));

    if (stock && stock.length > 0) {
      stock = stock[0].stock;
    } else {
      stock = 0;
    }
    product.stock = stock;
  }
  return sendSuccessResponse(
    res,
    200,
    product,
    'Product Detail fetched Successfully'
  );
});

exports.getAllProducts = catchAsync(async (req, res, next) => {
  const { pharmacyId } = req.params;
  const pharmacy = await Pharmacy.findOne({ _id: pharmacyId });
  if (!pharmacy) {
    return next(new AppError('Pharmacy does not exists', 400));
  }

  const features = new APIFeatures(
    Product.find({ pharmacy: pharmacyId }).sort({ createdAt: 1 }),
    req.query
  )
    .filter()
    .sort()
    .limitFields()
    .paginate();
  const products = await features.query;
  return sendSuccessResponse(
    res,
    200,
    {
      products,
      count: products.length,
    },
    'Products fetched Successfully'
  );
});

exports.deleteOne = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  if (!id) {
    return next(new AppError('Product ID  is required field', 404));
  }

  const product = await Product.findByIdAndDelete(id);

  await ProductInventory.deleteMany({ product_id: id });

  if (!product) {
    return next(new AppError('No document found with that ID', 404));
  }

  return sendSuccessResponse(res, 200, null, 'Product deleted Successfully');
});

exports.updateOne = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const product = await Product.findOne({ _id: id });
  if (!product) {
    return next(new AppError('Product does not exists', 400));
  }

  try {
    const { pharmacy_id, category_name, product_category_name } = req.body;
    const pharmacy = await Pharmacy.findOne({ _id: pharmacy_id });
    if (!pharmacy) {
      return next(new AppError('Pharmacy does not exists', 400));
    }
    const category = await Category.findOne({ title: category_name });
    if (!category) {
      return next(new AppError('Category does not exists', 400));
    }

    let product_category = await ProductCategory.findOne({
      title: product_category_name,
    });

    if (!product_category) {
      product_category = await ProductCategory.create({
        title: product_category_name,
      });
    }

    let data = { ...req.body };
    data.category_id = category._id;
    data.pharmacy_name = pharmacy.pharmacy_name;
    data.product_category_id = product_category._id;

    let doc = await Product.findByIdAndUpdate(id, data, {
      new: true,
      runValidators: true,
    });
    return sendSuccessResponse(res, 200, doc, 'Product updated successfully');
  } catch (err) {
    return next(new AppError(err.message));
  }
});

exports.createImage = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  let product = await Product.findById({ _id: id });

  if (!id) {
    return next(new AppError('Product ID is required field', 404));
  }

  if (!product) {
    return next(
      new AppError('Product doest not exist against given product id', 404)
    );
  }

  const images = await ProductImage.find({
    product_id: id,
  });

  if (images && images.length >= 4) {
    return next(new AppError('Only 4 Images can be uploaded', 404));
  }

  req.body.product_id = id;
  let doc = await ProductImage.create(req.body);

  return sendSuccessResponse(
    res,
    200,
    doc,
    'Image added successfully fetched Successfully'
  );
});

exports.deleteImage = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  if (!id) {
    return next(new AppError('Image ID  is required field', 404));
  }

  const productImage = await ProductImage.findByIdAndDelete(id);

  if (!productImage) {
    return next(new AppError('No document found with that ID', 404));
  }

  return sendSuccessResponse(res, 200, null, 'Image deleted Successfully');
});

exports.uploadWithCSV = catchAsync(async (req, res, next) => {
  // fs.readFile('dev-data/DPD_DATABASE/.txt', function (err, f) {
  //   // var array = f.toString().split(',').trim();
  //   const buffer = f;
  //   const dataFromRows = [];
  //   streamifier
  //     .createReadStream(buffer)
  //     .pipe(csv.parse({ headers: false, ignoreEmpty: false })) // <== this is @fast-csv/parse!!
  //     .on('data', (row) => {
  //       dataFromRows.push(row);
  //       console.log(dataFromRows.length);
  //     })
  //     .on('end', async (rowCount) => {
  //       try {
  //         for (let i = 0; i < dataFromRows.length; i++) {
  //           for (
  //             let j = dataFromRows[i].length - 1;
  //             j < dataFromRows[i].length;
  //             j++
  //           ) {
  //             // console.log(dataFromRows[i]);
  //             // (async () => {
  //             //   await QRYM_DRUG_FORM.create({
  //             //     DRUG_CODE: dataFromRows[i][0],
  //             //     PHARM_FORM_CODE: Number(dataFromRows[i][1]),
  //             //     PHARMACEUTICAL_FORM: dataFromRows[i][2],
  //             //     PHARMACEUTICAL_FORM_F: dataFromRows[i][3],
  //             //   });
  //             // })();
  //           }
  //         }
  //         res.status(400).json({ success: true });
  //       } catch (error) {
  //         res.status(400).json({ error });
  //       }
  //     });
  // });
  // const { buffer } = req.file;
  // const dataFromRows = [];
  // streamifier
  //   .createReadStream(buffer)
  //   .pipe(csv.parse({ headers: true, ignoreEmpty: true })) // <== this is @fast-csv/parse!!
  //   .on('data', (row) => {
  //     dataFromRows.push(row);
  //   })
  //   .on('end', async (rowCount) => {
  //     try {
  //       res.status(200).json({ rowCount, data });
  //     } catch (error) {
  //       res.status(400).json({ error });
  //     }
  //   });
  let findForm = await QRYM_DRUG_FORM.find({ DRUG_CODE: '99856' }).populate({
    path: 'DRUG_CODE',
  });
  res.status(200).json({ rowCount: 1, data: { findForm } });
});

exports.uploadProductImage = catchAsync(async (req, res, next) => {
  try {
    return sendSuccessResponse(
      res,
      200,
      { ...req.body.image },
      'Image uploaded Successfully'
    );
  } catch (err) {
    return next(new AppError(err.message));
  }
});

exports.removeProductImage = catchAsync(async (req, res, next) => {
  const { imageName } = req.body;
  if (!imageName) {
    return next(new AppError('Image name is manadatory field'));
  }
  try {
    await storageRef.file(`pharmacy/products/${imageName}`).delete();

    return sendSuccessResponse(res, 200, null, 'Image deleted Successfully');
  } catch (err) {
    return next(new AppError(err.message));
  }
});

exports.getProductDetailsByDIN = catchAsync(async (req, res, next) => {
  const { DIN } = req.params;

  if (!DIN) {
    return next(
      new AppError('Drug Identification number is required field', 400)
    );
  }
  try {
    let product = await QRYM_DRUG_PRODUCT.findOne({
      DRUG_IDENTIFICATION_NUMBER: DIN,
    });

    return sendSuccessResponse(
      res,
      200,
      product,
      'QRMY Product Detail fetched Successfully'
    );
  } catch (err) {
    return next(new AppError(err.message));
  }
});
