const crypto = require('crypto');
const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');

const adminSchema = mongoose.Schema({
  first_name: {
    type: String,
    maxLength: 200,
    required: [true, 'Please tell us your first name!'],
  },
  email: {
    type: String,
    required: [true, 'Please provide your email'],
    lowercase: true,
    maxLength: 400,
    unique: true,
    validate: [validator.isEmail, 'Please provide a valid email'],
  },
  last_name: {
    type: String,
    maxLength: 60,
  },
  phone_number: {
    type: String,
    maxLength: 100,
  },
  password: {
    type: String,
    required: [true, 'Please provide a password'],
    minlength: 4,
  },
  photo: {
    type: String,
  },
  address: {
    type: String,
  },
  token: {
    type: String,
    default: '',
  },
  passwordConfirm: {
    type: String,
    required: [true, 'Please confirm your password'],
  },
  role: {
    type: String,
    enum: ['super_admin'],
    default: 'super_admin',
  },
  passwordChangedAt: Date,
  passwordResetToken: String,
  passwordResetExpires: Date,
});

adminSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  this.passwordConfirm = undefined;
  next();
});

adminSchema.pre('save', function (next) {
  if (!this.isModified('password') || this.isNew) return next();
  this.passwordChangedAt = Date.now() - 1000;
  next();
});

adminSchema.methods.correctPassword = async function (
  candidatePassword,
  userPassword
) {
  return await bcrypt.compare(candidatePassword, userPassword);
};

adminSchema.methods.changedPasswordAfter = function (JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10
    );
    return JWTTimestamp < changedTimestamp;
  }
  return false;
};

adminSchema.methods.createPasswordResetToken = function () {
  const resetToken = crypto.randomBytes(32).toString('hex');
  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');
  this.passwordResetExpires = Date.now() + 3600000;
  return resetToken;
};
const Admin = mongoose.model('Admin', adminSchema);
module.exports = Admin;
