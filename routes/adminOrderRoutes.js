const express = require('express');
const { admin_auth } = require('../middlewares/verifyToken');
const orderController = require('../controllers/adminOrderController');

const router = express.Router();
router.use(admin_auth);

router.get('/', orderController.getOrders);

module.exports = router;
