const express = require('express');
const pharmacyAuthController = require('../controllers/pharmacyAuthController');
const pharmacyAuthValidators = require('../validators/pharmacyValidators');
const { pharmacy_auth } = require('../middlewares/verifyToken');

const router = express.Router();

const {
  signupSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  resetPasswordTokenSchema,
  updatePasswordSchema,
  updateEmailSchema,
  validator,
} = pharmacyAuthValidators.validator;

router.post(
  '/signup',
  validator.body(signupSchema),
  pharmacyAuthController.signup
);
router.post('/login-qr', pharmacyAuthController.register_auth);
router.post('/login', pharmacyAuthController.login);
router.post('/resend-qr', pharmacyAuthController.resend_QR);
router.post('/verifyOTP', pharmacyAuthController.verifyOTP);
router.post(
  '/resendOTPVerificationCode',
  pharmacyAuthController.resendOTPVerificationCode
);

router.post(
  '/forgotPassword',
  validator.body(forgotPasswordSchema),
  pharmacyAuthController.forgotPassword
);

router.patch(
  '/resetPassword/:token',
  validator.params(resetPasswordTokenSchema),
  validator.body(resetPasswordSchema),
  pharmacyAuthController.resetPassword
);

router.post(
  '/uploadVerificationDocs',
  pharmacyAuthController.uploadVerificationDocuments,
  pharmacyAuthController.uploadAuthDocs
);

router.post(
  '/re-uploadVerificationDocs',
  pharmacyAuthController.uploadVerificationDocuments,
  pharmacyAuthController.reuploadAuthDocs
);

router.patch(
  '/updateEmail',
  validator.body(updateEmailSchema),
  pharmacyAuthController.updateEmail
);

router.use(pharmacy_auth);
router.patch(
  '/updateMe',
  pharmacyAuthController.uploadPharmcyPhoto,
  pharmacyAuthController.uploadPharmacyPhoto,
  pharmacyAuthController.updateMe
);

router.patch(
  '/updateMyPassword',

  validator.body(updatePasswordSchema),
  pharmacyAuthController.updatePassword
);

module.exports = router;
