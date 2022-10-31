const express = require('express');
const { pharmacy_auth } = require('../middlewares/verifyToken');
const pharmacyProductController = require('../controllers/pharmcyProductController');
const pharmacyProductInventoryController = require('../controllers/pharmacyProductInventoryController');
const productValidators = require('../validators/productValidator');

const { productSchema, productInventorySchema, validator } =
  productValidators.validator;

const router = express.Router();

router.use(pharmacy_auth);

router.post(
  '/',
  validator.body(productSchema),
  pharmacyProductController.createProduct
);

router.get('/:id', pharmacyProductController.getOne);

router.get('/pharmacy/:pharmacyId/', pharmacyProductController.getAllProducts);
router.delete('/:id', pharmacyProductController.deleteOne);
router.patch('/:id', pharmacyProductController.updateOne);

router.patch('/:id/image', pharmacyProductController.createImage);
router.delete('/image/:id', pharmacyProductController.deleteImage);

router.post(
  '/upload-with-csv',
  pharmacyProductController.uploadProducts,
  pharmacyProductController.uploadWithCSV
);

// Product Inventory Routes

router.post(
  '/createInventory',
  validator.body(productInventorySchema),
  pharmacyProductInventoryController.createProductInventory
);

router.get('/inventory/:id', pharmacyProductInventoryController.getOne);

router.patch(
  '/inventory/:id',
  validator.body(productInventorySchema),
  pharmacyProductInventoryController.updateOne
);

router.delete('/inventory/:id', pharmacyProductInventoryController.deleteOne);

router.get(
  '/:productId/inventory',
  pharmacyProductInventoryController.getAllInventoriesByProduct
);
router.post(
  '/upload-product-image',
  pharmacyProductController.uploadProductImages,
  pharmacyProductController.resizeProductImages,
  pharmacyProductController.uploadProductImage
);
router.post(
  '/remove-product-image',
  pharmacyProductController.removeProductImage
);
router.get(
  '/qrmy-product/:DIN',
  pharmacyProductController.getProductDetailsByDIN
);

// router.patch('/:id', pharmacyProductController.updateOne);
// router.delete('/:id', pharmacyProductController.deleteOne);

module.exports = router;
