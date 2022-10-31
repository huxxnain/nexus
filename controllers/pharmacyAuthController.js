const multer = require('multer');
const sharp = require('sharp');
const crypto = require('crypto');
const Pharmacy = require('../models/pharmcyModel');
const PharmacyVerificationDocument = require('../models/pharmacyVerificationDocumentModel');
const Admin = require('../models/adminModel');
const serverStore = require('../serverStore');
const fs = require('fs');
const catchAsync = require('./../utils/catchAsync');
const Email = require('./../utils/email');
const AppError = require('./../utils/appError');
const { sendSuccessResponse } = require('../utils/sendResponse');
const { signToken } = require('../utils/signInToken');
const UserOTPVerfication = require('../models/userOtpVerification');
const Notifications = require('../models/adminNotificationModel');
const bcrypt = require('bcrypt');
const firebaseStorage = require('../firebase/firebase');
const speakeasy = require('speakeasy');
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

const upload = multer({
  storage: multerStorage,
  fileFilter: multerFilter,
});

exports.uploadPharmcyPhoto = upload.single('pharmacy_photo');

exports.uploadPharmacyPhoto = catchAsync(async (req, res, next) => {
  if (!req.file) return next();
  let filename = `pharmacy-${req.user._id}.jpeg`;
  await sharp(req.file.buffer)
    .resize(500, 500)
    .toFormat('jpeg')
    .jpeg({ quality: 90 })
    .toFile(`public/img/pharmacy/${filename}`);

  try {
    console.log('................................');

    const upload = await storageRef.upload(`public/img/pharmacy/${filename}`, {
      public: true,
      destination: `pharmacy/profile_picture/${filename}`,
      metadata: {
        metadata: {
          firebaseStorageDownloadTokens: uuidv4(),
        },
      },
    });

    req.file.filename = upload[0].metadata.mediaLink;

    fs.unlink(`public/img/pharmacy/${filename}`, function (err) {
      if (err) return console.log(err);
      console.log('file deleted successfully');
    });
    next();
  } catch (err) {
    next(new AppError(err.message, 400));
  }
});

exports.uploadVerificationDocuments = upload.fields([
  {
    name: 'front_picture',
    maxCount: 1,
  },
  {
    name: 'back_picture',
    maxCount: 1,
  },
]);

const uploadPharmacyDocs = async (next, data) => {
  let filename = `pharmacy-${data.fieldname}-${data.pharmacy_id}.jpeg`;
  await sharp(data.buffer)
    .resize(500, 500)
    .toFormat('jpeg')
    .jpeg({ quality: 90 })
    .toFile(`public/img/pharmacyVerificationDocs/${filename}`);

  try {
    console.log('................................');

    const upload = await storageRef.upload(
      `public/img/pharmacyVerificationDocs/${filename}`,
      {
        public: true,
        destination: `pharmacy/verfication_docs/${filename}`,
        metadata: {
          metadata: {
            firebaseStorageDownloadTokens: uuidv4(),
          },
        },
      }
    );

    fs.unlink(
      `public/img/pharmacyVerificationDocs/${filename}`,
      function (err) {
        if (err) return console.log(err);
        console.log('file deleted successfully');
      }
    );

    return { [data.fieldname]: upload[0].metadata.mediaLink };
  } catch (err) {
    next(new AppError(err.message, 400));
  }
};

const sendOtpVerficationEmail = async (req, res, next, pharmacy) => {
  try {
    const otp = `${Math.floor(1000 + Math.random() * 9000)}`;

    const saltRounds = 10;

    let hashedOtp = await bcrypt.hash(otp, saltRounds);

    const newOtpVerification = await UserOTPVerfication.create({
      userId: pharmacy._id,
      otp: hashedOtp,
      createdAt: Date.now(),
      expiresAr: Date.now() + 36000,
    });

    await new Email(pharmacy, '', false, otp).sendAVerifyEmail();
  } catch (err) {
    return next(new AppError(err.message, 400));
  }
};

exports.signup = catchAsync(async (req, res, next) => {
  try {
    const newPharmacy = await Pharmacy.create({ ...req.body });

    const copiedObj = JSON.parse(JSON.stringify(newPharmacy));
    delete copiedObj.password;
    delete copiedObj.passwordConfirm;

    const superAdmin = await Admin.findOne({ role: 'super_admin' });
    console.log('super', superAdmin);

    await sendOtpVerficationEmail(req, res, next, copiedObj);

    await Notifications.create({
      receiver: [superAdmin._id],
      message: `New pharmacy ${newPharmacy.pharmacy_name} signed up`,
    });

    const recieverList = serverStore.getActiveConnections(superAdmin._id);
    const io = serverStore.getSocketServerInstance();

    recieverList.forEach((receiverSocketId) => {
      io.to(receiverSocketId).emit('pharmacy_signup__notification', {
        notification_for: [superAdmin._id],
        message: 'New Pharnmacy signed up',
      });
    });
    return sendSuccessResponse(
      res,
      200,
      {
        id: copiedObj._id,
        email: copiedObj.email,
      },
      'Verification otp email sent'
    );
  } catch (err) {
    return next(new AppError(err.message, 400));
  }
});

exports.register_auth = async (req, res, next) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return next(new AppError('Please provide email and password', 400));
  }

  try {
    const pharmacy = await Pharmacy.findOne({ email }).select('+password -__v');
    if (
      !pharmacy ||
      !(await pharmacy.correctPassword(password, pharmacy.password))
    ) {
      return next(new AppError('Incorrect email or password', 401));
    }
    if (pharmacy) {
      if (pharmacy.token !== '') {
        return sendSuccessResponse(
          res,
          200,
          { token: 'false' },
          'QR code url fetched successfully'
        );
      }
    }

    let name = 'NxusRx - Pharmacy Portal';

    if (process.env.NODE_ENV == 'development') {
      name = `LIVE - ${pharmacy?.email ? pharmacy?.email : pharmacy?.email} `;
    } else {
      name = `STAGING - ${pharmacy?.email ? pharmacy?.email : pharmacy?.email}`;
    }
    const secret = speakeasy.generateSecret({
      name: name,
    });
    const QRCode = require('qrcode'); // package required
    const base32secret = secret.base32;
    await Pharmacy.findOneAndUpdate(
      { email: pharmacy?.email },
      { $set: { token: base32secret } }
    );

    QRCode.toDataURL(secret.otpauth_url, function (err, data_url) {
      return sendSuccessResponse(
        res,
        200,
        { token: data_url },
        'QR code url fetched successfully'
      );
    });
  } catch (err) {
    return next(new AppError(err.message, 400));
  }
};

exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return next(new AppError('Please provide email and password', 400));
  }
  const pharmacy = await Pharmacy.findOne({ email }).select('+password -__v');
  if (
    !pharmacy ||
    !(await pharmacy.correctPassword(password, pharmacy.password))
  ) {
    return next(new AppError('Incorrect email or password', 401));
  }
  // if (pharmacy.email_verified == false) {
  //   return next(new AppError('Email is not verified', 401));
  // }

  // if (pharmacy.status == 'rejected') {
  //   return next(new AppError('Your account is reject by Admin', 401));
  // }

  // if (pharmacy.status == 'pending') {
  //   return next(new AppError('Your account is under reveiw', 200));
  // }

  if (req?.body?.token !== '') {
    var verified;
    if (pharmacy) {
      verified = speakeasy.totp.verify({
        secret: pharmacy?.token,
        encoding: 'base32',
        token: req?.body?.token.toString(),
      });
    }

    if (!verified) {
      return next(new AppError('Please try again with the correct token', 401));
    }
  } else {
    return next(
      new AppError('Please Get registered with the authenticator app', 401)
    );
  }

  const token = signToken(pharmacy._id);
  const copiedObj = JSON.parse(JSON.stringify(pharmacy));
  delete copiedObj.password;
  delete copiedObj.passwordConfirm;
  copiedObj.token = token;
  return sendSuccessResponse(res, 200, copiedObj, 'Logged in successfully');
});

exports.resend_QR = catchAsync(async (req, res, next) => {
  const { email } = req.body;
  if (!email) {
    return next(new AppError('Please provide email ', 400));
  }
  const pharmacy = await Pharmacy.findOne({ email }).select('+password -__v');
  if (!pharmacy) {
    return next(new AppError('Incorrect email', 401));
  }

  let name = 'NxusRx - Pharmacy Portal';

  if (process.env.NODE_ENV == 'development') {
    name = `LIVE - ${pharmacy?.email ? pharmacy?.email : pharmacy?.email} `;
  } else {
    name = `STAGING - ${pharmacy?.email ? pharmacy?.email : pharmacy?.email}`;
  }
  const secret = speakeasy.generateSecret({
    name: name,
  });
  const QRCode = require('qrcode'); // package required
  const base32secret = secret.base32;
  await Pharmacy.findOneAndUpdate(
    { email: pharmacy?.email },
    { $set: { token: base32secret } }
  );

  QRCode.toDataURL(secret.otpauth_url, async function (err, data_url) {
    await new Email(pharmacy, '', false, '', '', data_url).sendQR();
    return sendSuccessResponse(res, 200, null, 'QR sent to an email');
  });
});

exports.verifyOTP = catchAsync(async (req, res, next) => {
  const { pharmacyId, otp } = req.body;
  if (!pharmacyId || !otp) {
    return next(new AppError('Phamacry Id and otp are required fields', 400));
  }

  const pharmacy = await Pharmacy.findOne({ _id: pharmacyId });

  console.log(pharmacy);
  if (!pharmacy) {
    return next(new AppError('Pharmacy does not exists', 401));
  }

  const otpVerification = await UserOTPVerfication.find({ userId: pharmacyId });

  if (otpVerification.length <= 0) {
    return next(
      new AppError(
        'Account record  does not exist or verified already,Please signup or login ',
        400
      )
    );
  } else {
    const { expiresAt } = otpVerification[0];
    const hashedOtp = otpVerification[0].otp;

    if (expiresAt < Date.now()) {
      await UserOTPVerfication.deleteMany({ userId: pharmacyId });
      return next(new AppError('Code has expired please request again ', 400));
    } else {
      const validOTP = await bcrypt.compare(otp, hashedOtp);
      if (!validOTP) {
        return next(new AppError('Invalid code passed, Check your inbox', 400));
      } else {
        await Pharmacy.findByIdAndUpdate(
          pharmacyId,
          { email_verified: true },
          {
            new: true,
            runValidators: true,
          }
        );

        await UserOTPVerfication.deleteMany({ userId: pharmacyId });

        return sendSuccessResponse(res, 200, {}, 'Email verified successfully');
      }
    }
  }
});

exports.resendOTPVerificationCode = catchAsync(async (req, res, next) => {
  const { pharmacyId, email } = req.body;
  try {
    if (!pharmacyId || !email) {
      return next(
        new AppError('Phamacry Id and email are required fields', 400)
      );
    }
    await UserOTPVerfication.deleteMany({ userId: pharmacyId });

    await sendOtpVerficationEmail(req, res, next, { _id: pharmacyId, email });
  } catch (err) {
    return next(new AppError(err.message, 400));
  }
});

exports.forgotPassword = catchAsync(async (req, res, next) => {
  const pharmacy = await Pharmacy.findOne({ email: req.body.email });
  if (!pharmacy) {
    return next(new AppError('There is no user with email address', 404));
  }
  const resetToken = await pharmacy.createPasswordResetToken();

  await pharmacy.save({ validateBeforeSave: false });
  try {
    const resetURL = `${process.env.PHARMACY_FRONTEND_URL}/resetPassword/${resetToken}`;
    await new Email(pharmacy, resetURL, false, '').sendAdminPasswordReset();

    return sendSuccessResponse(res, 200, {}, 'Token sent to an email');
  } catch (error) {
    pharmacy.passwordResetToken = undefined;
    pharmacy.passwordResetExpires = undefined;
    await pharmacy.save({ validateBeforeSave: false });
    return next(new AppError(error.message, 500));
  }
});

exports.resetPassword = catchAsync(async (req, res, next) => {
  const hashedToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');
  const pharmacy = await Pharmacy.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  });
  if (!pharmacy) {
    return next(new AppError('Token is invalid or has expired', 400));
  }
  pharmacy.password = req.body.password;
  pharmacy.passwordConfirm = req.body.passwordConfirm;
  pharmacy.passwordResetToken = undefined;
  pharmacy.passwordResetExpires = undefined;

  await pharmacy.save();
  const copiedObj = JSON.parse(JSON.stringify(pharmacy));
  delete copiedObj.password;
  delete copiedObj.passwordConfirm;
  return sendSuccessResponse(
    res,
    200,
    {
      ...copiedObj,
    },
    'Password changed successfully'
  );
});

exports.updatePassword = catchAsync(async (req, res, next) => {
  // 1) Get user from collection

  const pharmacy = await Pharmacy.findById(req.user.id).select('+password');

  // 2) Check if POSTed current password is correct
  if (
    !(await pharmacy.correctPassword(
      req.body.passwordCurrent,
      pharmacy.password
    ))
  ) {
    return next(new AppError('Your current password is wrong.', 401));
  }

  // 3) If so, update password
  pharmacy.password = req.body.password;
  pharmacy.passwordConfirm = req.body.passwordConfirm;
  await pharmacy.save();
  // User.findByIdAndUpdate will NOT work as intended!

  // 4) Log user in, send JWT
  const copiedObj = JSON.parse(JSON.stringify(pharmacy));
  delete copiedObj.password;
  delete copiedObj.passwordConfirm;
  return sendSuccessResponse(
    res,
    200,
    copiedObj,
    'Password changed successfully'
  );
});

const filterObj = (obj, ...allowed) => {
  let newObj = {};
  Object.keys(obj).forEach((el) => {
    if (allowed.includes(el)) {
      newObj[el] = obj[el];
    }
  });
  return newObj;
};

exports.updateMe = catchAsync(async (req, res, next) => {
  if (req.body.password || req.body.passwordConfirm) {
    return next(
      new AppError(
        'This route is not for password updates.Please use /updateMyPassword'
      )
    );
  }
  const filteredObj = filterObj(
    req.body,
    'mobile_no',
    'pharmacy_name',
    'address',
    'location',
    'lat_long',
    'country',
    'postcode',
    'pharmacy_landline_num',
    'state',
    'city',
    'country_code',
    'timeZone'
  );
  if (req.file) filteredObj.pharmacy_photo = req.file.filename;
  const updateUser = await Pharmacy.findByIdAndUpdate(
    req.user.id,
    filteredObj,
    {
      new: true,
      runValidators: true,
    }
  );
  const copiedObj = JSON.parse(JSON.stringify(updateUser));
  delete copiedObj.password;
  delete copiedObj.passwordConfirm;
  return sendSuccessResponse(
    res,
    200,
    copiedObj,
    'Pharmacy Updated Successfully'
  );
});

exports.uploadAuthDocs = catchAsync(async (req, res, next) => {
  console.log(req.body);
  let { front_picture, back_picture, pharmacy_id, id_type } = req.body;

  if (!pharmacy_id || !id_type) {
    return next(
      new AppError('Pharmacy Id and Id type are require fields', 400)
    );
  }
  const pharmacy = await Pharmacy.findOne({ _id: pharmacy_id }).select(
    '-password -__v'
  );

  if (!pharmacy) {
    return next(
      new AppError('Pharmacy doest not exist against give pharmacy id', 400)
    );
  }

  try {
    let arrayOfFiles = [];
    const frontFile =
      req.files &&
      req.files.front_picture &&
      req.files.front_picture[0] &&
      req.files.front_picture[0]
        ? req.files.front_picture[0]
        : null;
    const backFile =
      req.files &&
      req.files.back_picture &&
      req.files.back_picture[0] &&
      req.files.back_picture[0]
        ? req.files.back_picture[0]
        : null;

    if (frontFile) {
      frontFile.pharmacy_id = pharmacy_id;
      arrayOfFiles.push(frontFile);
    }

    if (backFile) {
      backFile.pharmacy_id = pharmacy_id;
      arrayOfFiles.push(backFile);
    }

    let arrayofPromises = arrayOfFiles.map((file) => {
      return uploadPharmacyDocs(next, file);
    });

    let urls = await Promise.all(arrayofPromises);

    let obj = {};
    obj.pharmacy_id = pharmacy_id;
    obj.id_type = id_type;
    for (let i = 0; i < urls.length; i++) {
      if (urls[i].front_picture) {
        obj.front_picture = urls[i].front_picture;
      } else if (urls[i].back_picture) {
        obj.back_picture = urls[i].back_picture;
      }
    }

    await PharmacyVerificationDocument.deleteMany({
      pharmacy_id: pharmacy._id,
    });
    const pharmacyVerificationDocument =
      await PharmacyVerificationDocument.create({ ...obj });

    return sendSuccessResponse(
      res,
      200,
      {},
      'Pharmacy Verification Documents uploaded Successfully'
    );
  } catch (err) {
    return next(new AppError(err.message, 400));
  }
});

exports.reuploadAuthDocs = catchAsync(async (req, res, next) => {
  console.log(req.body);
  let { front_picture, back_picture, pharmacy_id, id_type } = req.body;

  if (!pharmacy_id || !id_type) {
    return next(
      new AppError('Pharmacy Id and Id type are require fields', 400)
    );
  }
  const pharmacy = await Pharmacy.findOne({ _id: pharmacy_id }).select(
    '-password -__v'
  );

  if (!pharmacy) {
    return next(
      new AppError('Pharmacy doest not exist against give pharmacy id', 400)
    );
  }

  if (pharmacy.can_re_upload == false) {
    return next(
      new AppError(
        'You can not reupload the documents ask admin to generate new link',
        400
      )
    );
  }
  try {
    let arrayOfFiles = [];
    const frontFile =
      req.files &&
      req.files.front_picture &&
      req.files.front_picture[0] &&
      req.files.front_picture[0]
        ? req.files.front_picture[0]
        : null;
    const backFile =
      req.files &&
      req.files.back_picture &&
      req.files.back_picture[0] &&
      req.files.back_picture[0]
        ? req.files.back_picture[0]
        : null;

    if (frontFile) {
      frontFile.pharmacy_id = pharmacy_id;
      arrayOfFiles.push(frontFile);
    }

    if (backFile) {
      backFile.pharmacy_id = pharmacy_id;
      arrayOfFiles.push(backFile);
    }

    let arrayofPromises = arrayOfFiles.map((file) => {
      return uploadPharmacyDocs(next, file);
    });

    let urls = await Promise.all(arrayofPromises);

    let obj = {};
    obj.pharmacy_id = pharmacy_id;
    obj.id_type = id_type;
    for (let i = 0; i < urls.length; i++) {
      if (urls[i].front_picture) {
        obj.front_picture = urls[i].front_picture;
      } else if (urls[i].back_picture) {
        obj.back_picture = urls[i].back_picture;
      }
    }

    await PharmacyVerificationDocument.deleteMany({
      pharmacy_id: pharmacy._id,
    });
    const pharmacyVerificationDocument =
      await PharmacyVerificationDocument.create({ ...obj });

    const superAdmin = await Admin.findOne({ role: 'super_admin' });

    await Notifications.create({
      receiver: [superAdmin._id],
      message: `Pharmacy ${pharmacy.pharmacy_name} re-uploaded documents`,
    });

    const recieverList = serverStore.getActiveConnections(superAdmin._id);
    const io = serverStore.getSocketServerInstance();

    recieverList.forEach((receiverSocketId) => {
      io.to(receiverSocketId).emit('document_reupload_notification', {
        notification_for: [superAdmin._id],
        pharmacyId: pharmacy._id,
        message: `${pharmacy.pharmacy_name} re-uploaded documents`,
      });
    });
    await Pharmacy.findOneAndUpdate(
      { _id: pharmacy_id },
      { $set: { can_re_upload: false } }
    );

    return sendSuccessResponse(
      res,
      200,
      {},
      'Pharmacy Verification Documents uploaded Successfully'
    );
  } catch (err) {
    return next(new AppError(err.message, 400));
  }
});
exports.updateEmail = catchAsync(async (req, res, next) => {
  try {
    const pharmacy = await Pharmacy.findByIdAndUpdate(
      { _id: req.body.pharmacyId },
      req.body,
      {
        new: true,
        runValidators: true,
      }
    ).select('-password');
    if (!pharmacy) {
      return next(new AppError('There is no user with email address', 404));
    }
    return sendSuccessResponse(
      res,
      200,
      pharmacy,
      'Email updated successfully'
    );
  } catch (error) {
    return next(new AppError(error.message, 500));
  }
});
