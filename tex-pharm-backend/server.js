const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const cookieParser = require('cookie-parser');
const path = require('path');

// ============================================
// 1. DOTENV - SAB SE PEHLE LOAD KAREIN
// ============================================
require('dotenv').config();

// ============================================
// 2. IMPORT ROUTES
// ============================================
const connectDB = require('./src/config/database');
const authRoutes = require('./src/routes/authRoutes');
const paymentRoutes = require('./src/routes/paymentRoutes');
const productRoutes = require('./src/routes/productRoutes');
const orderRoutes = require('./src/routes/orderRoutes');
const contactRoutes = require('./src/routes/contactRoutes');
const adminRoutes = require('./src/routes/adminRoutes');
const errorHandler = require('./src/middleware/errorHandler');

// ===== Initialize App =====
const app = express();

// ===== Connect Database =====
connectDB();

// ===== Middleware =====
app.use(helmet());
app.use(cors()); // ✅ SAB KUCH ALLOW! CORS FIX HO GAYA.
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// ===== Rate Limiting =====
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100
});
app.use('/api', limiter);

// ===== Serve uploaded payment screenshots =====
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ============================================
// 5. ROUTES
// ============================================
app.use('/api/auth', authRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/admin', adminRoutes);

// ===== Health Check =====
app.get('/api/health', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'Server is running',
        timestamp: new Date().toISOString()
    });
});

// ===== Error Handler =====
app.use(errorHandler);

// ===== 404 Handler =====
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: 'Route not found'
    });
});

// ===== Start Server =====
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
});