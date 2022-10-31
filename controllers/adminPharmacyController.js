const catchAsync = require('./../utils/catchAsync');
const Email = require('./../utils/email');
const AppError = require('./../utils/appError');
const { sendSuccessResponse } = require('../utils/sendResponse');
const Pharmacy = require('../models/pharmcyModel');
const PharmacyVerificationDocument = require('../models/pharmacyVerificationDocumentModel');
const APIFeatures = require('../utils/apiFeatures');

exports.getAllPharmacies = catchAsync(async (req, res, next) => {
  const features = new APIFeatures(
    Pharmacy.find().sort({ createdAt: 1 }).select('-password '),
    req.query
  )
    .filter()
    .sort()
    .limitFields()
    .paginate();

  const docCount = new APIFeatures(
    Pharmacy.find().sort({ createdAt: 1 }).select('-password '),
    req.query
  ).filter();

  const count = await docCount.query;

  const pharmacies = await features.query;
  return sendSuccessResponse(
    res,
    200,
    {
      pharmacies,
      count: count.length,
    },
    'Pharmacies fetched Successfully'
  );
});

exports.getOne = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  let pharmacy = await Pharmacy.findById({ _id: id }).select('-password');

  if (!id) {
    return next(new AppError('Pharmacy ID is required field', 404));
  }

  if (!pharmacy) {
    return next(
      new AppError('Pharmacy doest not exist against given pharmacy id', 404)
    );
  }
  if (pharmacy) {
    const documents = await PharmacyVerificationDocument.findOne({
      pharmacy_id: id,
    });
    const copiedObj = JSON.parse(JSON.stringify(pharmacy));

    if (documents) {
      copiedObj.documents = documents;
      pharmacy = copiedObj;
    }
  }
  return sendSuccessResponse(
    res,
    200,
    pharmacy,
    'Pharmacy fetched Successfully'
  );
});

exports.updateOne = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!id || !status) {
    return next(new AppError('Pharmacy ID and Status are required field', 404));
  }

  let pharmacy = await Pharmacy.findByIdAndUpdate(id, req.body, {
    new: true,
    runValidators: true,
  }).select('-password');

  if (!pharmacy) {
    return next(
      new AppError('Pharmacy doest not exist against given pharmacy id', 404)
    );
  }

  const resetURL = `${process.env.PHARMACY_FRONTEND_URL}/login`;
  if (status == 'rejected') {
    await new Email(pharmacy, resetURL, false, '', status).sendRejection();
  }

  if (status == 'approved') {
    await new Email(pharmacy, resetURL, false, '', status).sendApproval();
  }

  return sendSuccessResponse(
    res,
    200,
    pharmacy,
    'Pharmacy updated Successfully'
  );
});

exports.generateDocumentReUploadLink = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  try {
    let pharmacy = await Pharmacy.findOneAndUpdate(
      { _id: id },
      { $set: { can_re_upload: true } }
    );

    if (!id) {
      return next(new AppError('Pharmacy ID is required field', 404));
    }

    if (!pharmacy) {
      return next(
        new AppError('Pharmacy doest not exist against given pharmacy id', 404)
      );
    }

    const resetURL = `${process.env.PHARMACY_FRONTEND_URL}/verifyDocument/${pharmacy._id}`;
    await new Email(pharmacy, resetURL, false, '', '', '').sendReuploadLink();
    return sendSuccessResponse(res, 200, null, 'Link sent on pharmacy email');
  } catch (err) {
    return next(new AppError(err.message, 400));
  }
});
