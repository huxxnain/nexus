const express = require('express');
const pharmacyAuthController = require('../controllers/pharmacyAuthController');
const pharmacyAuthValidators = require('../validators/pharmacyValidators');
const { admin_auth } = require('../middlewares/verifyToken');
const adminPharmacyController = require('../controllers/adminPharmacyController');
const router = express.Router();

router.use(admin_auth);
router.get('/', adminPharmacyController.getAllPharmacies);

router.get('/:id', adminPharmacyController.getOne);

router.patch('/:id', adminPharmacyController.updateOne);
router.post('/:id', adminPharmacyController.updateOne);
router.post(
  '/generate-reupload-pharmacy/:id',
  adminPharmacyController.generateDocumentReUploadLink
);
module.exports = router;
