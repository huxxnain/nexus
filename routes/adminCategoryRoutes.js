const express = require('express');

const { admin_auth } = require('../middlewares/verifyToken');
const adminCategoryController = require('../controllers/adminCategoryController');
const router = express.Router();

router.get('/', adminCategoryController.getAllCategories);

router.get('/:id', adminCategoryController.getOne);

router.use(admin_auth);
router.post('/', adminCategoryController.createCategory);
router.patch('/:id', adminCategoryController.updateOne);
router.delete('/:id', adminCategoryController.deleteOne);

module.exports = router;
