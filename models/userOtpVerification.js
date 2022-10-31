const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const userOTPVerficationSchema = new Schema({
  userId: {
    type: String,
  },
  otp: {
    type: String,
  },
  createdAt: {
    type: Date,
  },
  expiresAt: {
    type: Date,
  },
});

const UserOTPVerfication = mongoose.model(
  'UserOTPVerfication',
  userOTPVerficationSchema
);
module.exports = UserOTPVerfication;
