const errorHandler = (err, req, res, next) => {
    let error = { ...err };
    error.message = err.message;

    // ===== Log error =====
    console.error('❌ Error:', err);

    // ===== Mongoose duplicate key error =====
    if (err.code === 11000) {
        const field = Object.keys(err.keyPattern)[0];
        const message = `${field.charAt(0).toUpperCase() + field.slice(1)} already exists. Please use another ${field}.`;
        error = { message, statusCode: 400 };
    }

    // ===== Mongoose validation error =====
    if (err.name === 'ValidationError') {
        const message = Object.values(err.errors).map(val => val.message).join('. ');
        error = { message, statusCode: 400 };
    }

    // ===== Multer (file upload) errors =====
    if (err.name === 'MulterError') {
        const message = err.code === 'LIMIT_FILE_SIZE'
            ? 'Payment screenshot must be smaller than 5MB.'
            : err.message;
        error = { message, statusCode: 400 };
    }
    if (err.message && err.message.startsWith('Only image files')) {
        error = { message: err.message, statusCode: 400 };
    }

    // ===== JWT errors =====
    if (err.name === 'JsonWebTokenError') {
        error = { message: 'Invalid token. Please login again.', statusCode: 401 };
    }
    if (err.name === 'TokenExpiredError') {
        error = { message: 'Token expired. Please login again.', statusCode: 401 };
    }

    // ===== Response =====
    res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || 'Internal Server Error',
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
};

module.exports = errorHandler;