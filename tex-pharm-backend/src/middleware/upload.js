const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

// ===== Ensure uploads directory exists =====
const uploadDir = path.join(__dirname, '..', '..', 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// ===== Storage config =====
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = crypto.randomBytes(8).toString('hex');
        const ext = path.extname(file.originalname).toLowerCase();
        cb(null, `payment-${Date.now()}-${uniqueSuffix}${ext}`);
    }
});

// ===== Only allow image files, max 5MB =====
const fileFilter = (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|webp|gif/;
    const isAllowed = allowedTypes.test(path.extname(file.originalname).toLowerCase()) &&
        allowedTypes.test(file.mimetype);
    if (isAllowed) {
        cb(null, true);
    } else {
        cb(new Error('Only image files (jpg, jpeg, png, webp, gif) are allowed'));
    }
};

const upload = multer({
    storage,
    fileFilter,
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB
});

module.exports = upload;
