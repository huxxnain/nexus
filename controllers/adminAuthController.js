const crypto = require('crypto');
const { promisify } = require('util');
const fs = require('fs');
const multer = require('multer');
const sharp = require('sharp');
const Admin = require('../models/adminModel');
const Notifications = require('../models/adminNotificationModel');
const catchAsync = require('./../utils/catchAsync');
const Email = require('./../utils/email');
const AppError = require('./../utils/appError');
const { sendSuccessResponse } = require('../utils/sendResponse');
const { signToken } = require('../utils/signInToken');
const firebaseStorage = require('../firebase/firebase');
const { v4: uuidv4 } = require('uuid');
const speakeasy = require('speakeasy');
const APIFeatures = require('../utils/apiFeatures');
const dotenv = require('dotenv');

dotenv.config({ path: './config.env' });
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

exports.uploadUserPhoto = upload.single('photo');

exports.uploadAdminPhoto = catchAsync(async (req, res, next) => {
  if (!req.file) return next();
  let filename = `user-${req.user._id}.jpeg`;
  await sharp(req.file.buffer)
    .resize(500, 500)
    .toFormat('jpeg')
    .jpeg({ quality: 90 })
    .toFile(`public/img/users/${filename}`);

  try {
    console.log('................................');

    const upload = await storageRef.upload(`public/img/users/${filename}`, {
      public: true,
      destination: `admin/profile_picture/${filename}`,
      metadata: {
        metadata: {
          firebaseStorageDownloadTokens: uuidv4(),
        },
      },
    });

    req.file.filename = upload[0].metadata.mediaLink;

    fs.unlink(`public/img/users/${filename}`, function (err) {
      if (err) return console.log(err);
      console.log('file deleted successfully');
    });
    next();
  } catch (err) {
    next(new AppError(err.message, 400));
  }
});

exports.signup = catchAsync(async (req, res, next) => {
  const newUser = await Admin.create({
    first_name: req.body.first_name,
    last_name: req.body.last_name,
    email: req.body.email,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm,
    address: req.body.address,
    phone_number: req.body.phone_number,
  });
  const copiedObj = JSON.parse(JSON.stringify(newUser));
  delete copiedObj.password;
  delete copiedObj.passwordConfirm;
  return sendSuccessResponse(
    res,
    201,
    copiedObj,
    'Admin registered successfully'
  );
});

exports.register_auth = async (req, res, next) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return next(new AppError('Please provide email and password', 400));
  }

  try {
    const admin = await Admin.findOne({ email }).select('+password -__v');
    if (!admin || !(await admin.correctPassword(password, admin.password))) {
      return next(new AppError('Incorrect email or password', 401));
    }
    if (admin) {
      console.log(admin.token);
      if (admin.token !== '') {
        return sendSuccessResponse(
          res,
          200,
          { token: 'false' },
          'QR code url fetched successfully'
        );
      }
    }

    let name = 'NxusRx - Admin Portal';

    if (process.env.NODE_ENV == 'development') {
      name = `LIVE - ${admin?.email ? admin?.email : admin?.email} `;
    } else {
      name = `STAGING - ${admin?.email ? admin?.email : admin?.email}`;
    }
    const secret = speakeasy.generateSecret({
      name: name,
    });
    const QRCode = require('qrcode'); // package required
    const base32secret = secret.base32;
    await Admin.findOneAndUpdate(
      { email: admin?.email },
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
  const admin = await Admin.findOne({ email }).select('+password -__v');
  if (!admin || !(await admin.correctPassword(password, admin.password))) {
    return next(new AppError('Incorrect email or password', 401));
  }

  if (req?.body?.token !== '') {
    var verified;
    if (admin) {
      verified = speakeasy.totp.verify({
        secret: admin?.token,
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

  const token = signToken(admin._id);
  const copiedObj = JSON.parse(JSON.stringify(admin));
  delete copiedObj.password;
  delete copiedObj.passwordConfirm;
  copiedObj.token = token;
  return sendSuccessResponse(res, 200, copiedObj, 'Logged in successfully');
});

exports.forgotPassword = catchAsync(async (req, res, next) => {
  const admin = await Admin.findOne({ email: req.body.email });
  if (!admin) {
    return next(new AppError('There is no user with email address', 404));
  }
  const resetToken = await admin.createPasswordResetToken();

  await admin.save({ validateBeforeSave: false });
  try {
    const resetURL = `${process.env.PHARMACY_FRONTEND_URL}/resetPassword/${resetToken}`;
    await new Email(admin, resetURL, true, '').sendAdminPasswordReset();

    return sendSuccessResponse(
      res,
      200,
      { resetURL },
      'Token sent to an email'
    );
  } catch (error) {
    admin.passwordResetToken = undefined;
    admin.passwordResetExpires = undefined;
    await admin.save({ validateBeforeSave: false });
    return next(new AppError(error.message, 500));
  }
});

exports.resetPassword = catchAsync(async (req, res, next) => {
  const hashedToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');
  const user = await Admin.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  });
  if (!user) {
    return next(new AppError('Token is invalid or has expired', 400));
  }
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;

  await user.save();
  const copiedObj = JSON.parse(JSON.stringify(user));
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

  const user = await Admin.findById(req.user.id).select('+password');

  // 2) Check if POSTed current password is correct
  if (!(await user.correctPassword(req.body.passwordCurrent, user.password))) {
    return next(new AppError('Your current password is wrong.', 401));
  }

  // 3) If so, update password
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  await user.save();
  // User.findByIdAndUpdate will NOT work as intended!

  // 4) Log user in, send JWT
  const copiedObj = JSON.parse(JSON.stringify(user));
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

exports.resend_QR = catchAsync(async (req, res, next) => {
  const { email } = req.body;
  if (!email) {
    return next(new AppError('Please provide email ', 400));
  }
  const admin = await Admin.findOne({ email }).select('+password -__v');
  if (!admin) {
    return next(new AppError('Incorrect email', 401));
  }

  let name = 'NxusRx - Admin Portal';

  if (process.env.NODE_ENV == 'development') {
    name = `LIVE - ${admin?.email ? admin?.email : admin?.email} `;
  } else {
    name = `STAGING - ${admin?.email ? admin?.email : admin?.email}`;
  }
  const secret = speakeasy.generateSecret({
    name: name,
  });
  const QRCode = require('qrcode'); // package required
  const base32secret = secret.base32;
  await Admin.findOneAndUpdate(
    { email: admin?.email },
    { $set: { token: base32secret } }
  );

  QRCode.toDataURL(secret.otpauth_url, async function (err, data_url) {
    await new Email(admin, '', false, '', '', data_url).sendQR();
    return sendSuccessResponse(res, 200, null, 'QR sent to an email');
  });
});

exports.updateMe = catchAsync(async (req, res, next) => {
  console.log(req.body);
  if (req.body.password || req.body.passwordConfirm) {
    return next(
      new AppError(
        'This route is not for password updates.Please use /updateMyPassword'
      )
    );
  }
  const filteredObj = filterObj(
    req.body,
    'first_name',
    'last_name',
    'address',
    'phone_number'
  );
  if (req.file) filteredObj.photo = req.file.filename;
  const updateUser = await Admin.findByIdAndUpdate(req.user.id, filteredObj, {
    new: true,
    runValidators: true,
  });
  const copiedObj = JSON.parse(JSON.stringify(updateUser));
  delete copiedObj.password;
  delete copiedObj.passwordConfirm;
  return sendSuccessResponse(res, 200, copiedObj, 'User Updated Successfully');
});

exports.getNotifications = catchAsync(async (req, res, next) => {
  const id = req?.user?._id;

  try {
    const features = new APIFeatures(Notifications.find(), req.query)
      .filter()
      .sort()
      .limitFields()
      .paginate();

    const docCount = await Notifications.count({ reciever: { $in: [id] } });

    const unReadCount = await Notifications.count({
      is_read: false,
      reciever: { $in: [id] },
    });

    const notifications = await features.query;
    return sendSuccessResponse(
      res,
      200,
      {
        notifications,
        count: docCount,
        unReadCount,
      },
      'Notifications fetched Successfully'
    );
  } catch (err) {
    return next(new AppError(err.message, 400));
  }
});

exports.readNotifications = catchAsync(async (req, res, next) => {
  const id = req?.user?._id;

  try {
    const updateNotifications = await Notifications.updateMany({
      reciever: { $in: [id] },
      $set: { is_read: true },
    });

    return sendSuccessResponse(
      res,
      200,
      {
        updateNotifications,
      },
      'Notifications read Successfully'
    );
  } catch (err) {
    return next(new AppError(err.message, 400));
  }
});
