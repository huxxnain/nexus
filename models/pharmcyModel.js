const crypto = require('crypto');
const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');

const pharmacySchema = mongoose.Schema(
  {
    pharmacy_name: {
      type: String,
      maxLength: 200,
      required: [true, 'Please tell us your pharmacy name!'],
      unique: true,
      trim: true,
    },
    pharmacy_owner: {
      type: String,
      required: [true, 'Please provide your Pharmacy Owner'],
    },
    pharmacy_license_number: {
      type: String,
      required: [true, 'Please provide your Pharmacy License Number'],
    },
    email: {
      type: String,
      required: [true, 'Please provide your email'],
      lowercase: true,
      maxLength: 400,
      unique: true,
      validate: [validator.isEmail, 'Please provide a valid email'],
      index: true,
    },

    mobile_no: {
      type: String,
      maxLength: 100,
      required: [true, 'Mobile number is required field'],
    },
    password: {
      type: String,
      required: [true, 'Please provide a password'],
      minlength: 4,
    },
    pharmacy_photo: {
      type: String,
    },
    email_verified: {
      type: Boolean,
      default: false,
    },

    location: {
      type: String,
      required: [true, 'Location is required field'],
    },
    passwordConfirm: {
      type: String,
      required: [true, 'Please confirm your password'],
    },
    role: {
      type: String,
      enum: ['admin'],
      default: 'admin',
    },
    lat_long: {
      type: [Number],
      required: [true, 'Cordinates are required field'],
    },
    country: {
      type: String,
      required: [true, 'Country is required field'],
      index: true,
    },
    token: {
      type: String,
      default: '',
    },
    state: {
      type: String,
      required: [true, 'State is required field'],
      index: true,
    },
    city: {
      type: String,
      required: [true, 'City is required field'],
      index: true,
    },
    postcode: {
      type: String,
    },
    country_code: {
      type: String,
    },
    timeZone: {
      type: String,
    },
    pharmacy_landline_num: {
      type: String,
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
    can_re_upload: {
      type: Boolean,
      default: false,
    },
    passwordChangedAt: Date,
    passwordResetToken: String,
    passwordResetExpires: Date,
  },

  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
  {
    timestamps: true,
  }
);
pharmacySchema.index({ city: 1, pharmacy_name: 1 });
pharmacySchema.index({ pharmacy_name: 'text' });
pharmacySchema.index({ city: 1 });
pharmacySchema.index({ createdAt: 1 });

pharmacySchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  this.passwordConfirm = undefined;
  next();
});

pharmacySchema.pre('save', function (next) {
  if (!this.isModified('password') || this.isNew) return next();
  this.passwordChangedAt = Date.now() - 1000;
  next();
});

pharmacySchema.methods.correctPassword = async function (
  candidatePassword,
  userPassword
) {
  return await bcrypt.compare(candidatePassword, userPassword);
};

pharmacySchema.methods.changedPasswordAfter = function (JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10
    );
    return JWTTimestamp < changedTimestamp;
  }
  return false;
};

pharmacySchema.methods.createPasswordResetToken = function () {
  const resetToken = crypto.randomBytes(32).toString('hex');
  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');
  this.passwordResetExpires = Date.now() + 3600000;
  return resetToken;
};
const Pharmacy = mongoose.model('Pharmacy', pharmacySchema);
module.exports = Pharmacy;
