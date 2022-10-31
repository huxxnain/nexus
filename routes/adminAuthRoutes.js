const express = require('express');
const adminAuthControllers = require('../controllers/adminAuthController');
const adminAuthValidators = require('../validators/adminValidator');
const { admin_auth } = require('../middlewares/verifyToken');

const {
  signupSchema,
  forgotPasswordSchema,
  updatePasswordSchema,
  resetPasswordSchema,
  resetPasswordTokenSchema,
  validator,
} = adminAuthValidators.validator;

const router = express.Router();

router.post(
  '/signup',
  validator.body(signupSchema),
  adminAuthControllers.signup
);
router.post('/login-qr', adminAuthControllers.register_auth);
router.post('/resend-qr', adminAuthControllers.resend_QR);
router.post('/login', adminAuthControllers.login);
router.post(
  '/forgotPassword',
  validator.body(forgotPasswordSchema),
  adminAuthControllers.forgotPassword
);
router.patch(
  '/resetPassword/:token',
  validator.params(resetPasswordTokenSchema),
  validator.body(resetPasswordSchema),
  adminAuthControllers.resetPassword
);

router.use(admin_auth);
router.patch(
  '/updateMe',
  adminAuthControllers.uploadUserPhoto,
  adminAuthControllers.uploadAdminPhoto,
  adminAuthControllers.updateMe
);

router.patch(
  '/updateMyPassword',

  validator.body(updatePasswordSchema),
  adminAuthControllers.updatePassword
);
router.get('/notifications', adminAuthControllers.getNotifications);
router.patch('/notifications', adminAuthControllers.readNotifications);
module.exports = router;
