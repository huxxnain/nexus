const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const adminNotiSchema = new Schema(
  {
    message: {
      type: String,
      required: [true, 'Message is required filed!'],
      index: true,
    },
    is_read: {
      type: Boolean,
      default: false,
    },
    receiver: [
      {
        type: String,
        ref: 'Admins',
      },
    ],
  },

  {
    timestamps: true,
  }
);

adminNotiSchema.index({ createdAt: 1 });
adminNotiSchema.index({ message: 'text' });

const AdminNotification = mongoose.model('AdminNotification', adminNotiSchema);
module.exports = AdminNotification;
