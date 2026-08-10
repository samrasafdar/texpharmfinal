const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middleware/auth');
const upload = require('../middleware/upload');
const {
    createOrder,
    getMyOrders,
    getOrder,
    cancelOrder,
    getAllOrders,
    updateOrderStatus
} = require('../controllers/orderController');

// ===== User Routes =====
router.post('/', protect, upload.single('paymentScreenshot'), createOrder);
router.get('/my-orders', protect, getMyOrders);
router.get('/:id', protect, getOrder);
router.put('/:id/cancel', protect, cancelOrder);

// ===== Admin Routes =====
router.get('/admin/all', protect, admin, getAllOrders);
router.put('/admin/:id/status', protect, admin, updateOrderStatus);

module.exports = router;