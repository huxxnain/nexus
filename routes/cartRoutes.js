const express = require('express');
const { pharmacy_auth } = require('../middlewares/verifyToken');
const cartController = require('../controllers/cartController');

const router = express.Router();
router.use(pharmacy_auth);

router.post('/', cartController.userCart);
router.get('/', cartController.getUserCart);
router.put('/', cartController.emptyCart);

module.exports = router;
