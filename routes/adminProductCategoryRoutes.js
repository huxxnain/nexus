const express = require('express');
const { admin_auth } = require('../middlewares/verifyToken');
const adminProductCategoryController = require('../controllers/adminProductCategoryController');
const router = express.Router();

// router.use(admin_auth);

router.get('/', adminProductCategoryController.getAllCategories);
router.get('/:id', adminProductCategoryController.getOne);
router.post('/', adminProductCategoryController.createCategory);
router.patch('/:id', adminProductCategoryController.updateOne);
router.delete('/:id', adminProductCategoryController.deleteOne);

module.exports = router;
