const express = require('express');

const productController = require('../controllers/productsController');

const router = express.Router();

router.get('/', productController.getAllProducts);
router.get('/categories', productController.getProductCategories);
router.get('/:id', productController.getOneProduct);

router.get('/product/:din', productController.getSameProductInventories);
router.get('/similar/:id', productController.getSimilarProducts);

module.exports = router;
