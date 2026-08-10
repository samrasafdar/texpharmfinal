// ============================================
// SEED ADMIN ACCOUNT
// Run this once: node seedAdmin.js
// Creates (or upgrades) an admin account using
// ADMIN_EMAIL / ADMIN_PASSWORD from your .env file
// ============================================
require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('./src/config/database');
const User = require('./src/models/User');

(async () => {
    try {
        await connectDB();

        const email = process.env.ADMIN_EMAIL || 'admin@tex-pharm.com';
        const password = process.env.ADMIN_PASSWORD || 'Admin@123456';

        let user = await User.findOne({ email });

        if (user) {
            user.role = 'admin';
            user.isActive = true;
            user.isVerified = true;
            await user.save();
            console.log(`✅ Existing user upgraded to admin: ${email}`);
        } else {
            user = await User.create({
                name: 'Admin',
                email,
                password,
                role: 'admin',
                isActive: true,
                isVerified: true
            });
            console.log(`✅ New admin account created: ${email}`);
        }

        console.log(`🔑 Login with:\n   Email: ${email}\n   Password: ${password}`);
        console.log('⚠️  Change this password after your first login for security.');

        await mongoose.connection.close();
        process.exit(0);
    } catch (error) {
        console.error('❌ Failed to seed admin:', error.message);
        process.exit(1);
    }
})();
