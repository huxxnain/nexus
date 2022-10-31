const express = require('express');
const { pharmacy_auth } = require('../middlewares/verifyToken');
const orderController = require('../controllers/pharmacyOrderController');

const router = express.Router();
router.use(pharmacy_auth);

router.get('/purchaseOrders', orderController.getPurchaseOrders);
router.post('/', orderController.createOrder);
router.get('/', orderController.getOrders);
router.get('/:id', orderController.getOrderDetail);
router.get('/purchaseOrders/:id', orderController.getPurchaseOrderDetail);
module.exports = router;
