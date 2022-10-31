const express = require('express');
const { pharmacy_auth } = require('../middlewares/verifyToken');
const pharmacyCategoryController = require('../controllers/pharmacyProductCategoryConttroller');
const router = express.Router();

router.use(pharmacy_auth);

router.get('/', pharmacy_auth, pharmacyCategoryController.getAllCategories);
router.get('/:id', pharmacyCategoryController.getOne);
router.post('/', pharmacyCategoryController.createCategory);
router.patch('/:id', pharmacyCategoryController.updateOne);
router.delete('/:id', pharmacyCategoryController.deleteOne);

module.exports = router;
