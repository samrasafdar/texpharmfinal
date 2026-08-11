const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');

// ============================================
// MANUAL BANK PAYMENT ONLY
// ============================================

// Payment Information
router.get('/info', protect, (req, res) => {
    res.status(200).json({
        success: true,
        paymentMethod: "Bank Alfalah",
        accountName: "Tex Pharm",
        accountNumber: process.env.BANK_ACCOUNT_NUMBER || '',
        currency: "PKR",
        message: "Order will be confirmed only after advance payment verification."
    });
});

// Verify Payment (Admin will verify manually)
router.post('/verify', protect, (req, res) => {
    res.status(200).json({
        success: true,
        message: "Payment proof received. Your order will be confirmed after verification."
    });
});

module.exports = router;