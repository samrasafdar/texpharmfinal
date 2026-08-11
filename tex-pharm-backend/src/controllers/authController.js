const User = require('../models/User');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { sendEmail } = require('../utils/sendEmail');

// ===== Generate JWT Token =====
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRE || '7d'
    });
};

// ===== Generate Refresh Token =====
const generateRefreshToken = (id) => {
    return jwt.sign({ id }, process.env.REFRESH_TOKEN_SECRET, {
        expiresIn: '30d'
    });
};

// ===== Register User =====
const register = async (req, res) => {
    try {
        const { name, email, password } = req.body;

        // Check if user exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: 'User already exists with this email'
            });
        }

        // Create verification token
        const verificationToken = crypto.randomBytes(20).toString('hex');

        // Create user
        const user = await User.create({
            name,
            email,
            password,
            verificationToken,
            isVerified: false
        });

        // Send verification email (best-effort — does not block registration success)
        const verificationUrl = `${process.env.CLIENT_URL}/verify-email/${verificationToken}`;
        try {
            await sendEmail({
                to: user.email,
                subject: 'Verify your email - Tex-Pharm Inc',
                html: `
                    <h1>Welcome to Tex-Pharm Inc!</h1>
                    <p>Please click the link below to verify your email address:</p>
                    <a href="${verificationUrl}" style="padding:12px 24px; background:#0b5ed7; color:white; text-decoration:none; border-radius:5px;">Verify Email</a>
                    <p>This link will expire in 24 hours.</p>
                `
            });
        } catch (emailError) {
            console.error('Verification email failed to send:', emailError.message);
        }

        // Generate token
        const token = generateToken(user._id);
        const refreshToken = generateRefreshToken(user._id);

        res.status(201).json({
            success: true,
            message: 'User registered successfully! Please check your email to verify your account.',
            data: {
                user,
                token,
                refreshToken
            }
        });

    } catch (error) {
        console.error('Register error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to register user. Please try again.'
        });
    }
};

// ===== Login User =====
const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Find user with password
        const user = await User.findOne({ email }).select('+password');

        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        // Check if account is temporarily locked from too many failed attempts
        if (user.isLocked()) {
            const minutesLeft = Math.ceil((user.lockUntil - Date.now()) / 60000);
            return res.status(423).json({
                success: false,
                message: `Too many failed login attempts. Try again in ${minutesLeft} minute(s).`
            });
        }

        // Check if user is active
        if (!user.isActive) {
            return res.status(401).json({
                success: false,
                message: 'Your account has been deactivated. Please contact support.'
            });
        }

        // Check password
        const isPasswordMatch = await user.comparePassword(password);
        if (!isPasswordMatch) {
            await user.recordFailedLogin();
            const attemptsLeft = Math.max(5 - user.loginAttempts, 0);
            return res.status(401).json({
                success: false,
                message: attemptsLeft > 0
                    ? `Invalid email or password. ${attemptsLeft} attempt(s) left before temporary lockout.`
                    : 'Too many failed attempts. Account locked for 15 minutes.'
            });
        }

        // Correct password - clear any failed attempt count
        await user.resetLoginAttempts();

        // Check if this is the user's first-ever login (to send a greeting email)
        const isFirstLogin = !user.lastLogin;

        // Update last login
        user.lastLogin = new Date();
        await user.save();

        // Send a greeting email on first login only (avoids spamming on every login)
        if (isFirstLogin) {
            sendEmail({
                to: user.email,
                subject: `Welcome aboard, ${user.name}! - Tex-Pharm Inc`,
                html: `
                    <h1>Hi ${user.name}, great to see you! 👋</h1>
                    <p>Thanks for logging in to Tex-Pharm Inc for the first time.</p>
                    <p>Browse our textile, chemical, and machinery products, and let us know if you need anything.</p>
                    <a href="${process.env.CLIENT_URL}" style="padding:12px 24px; background:#0b5ed7; color:white; text-decoration:none; border-radius:5px;">Visit Tex-Pharm Inc</a>
                `
            }).catch(err => console.error('Greeting email failed to send:', err.message));
        }

        // Generate token
        const token = generateToken(user._id);
        const refreshToken = generateRefreshToken(user._id);

        // Set cookie
        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        });

        res.status(200).json({
            success: true,
            message: 'Login successful!',
            data: {
                user,
                token,
                refreshToken
            }
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to login. Please try again.'
        });
    }
};

// ===== Refresh Token =====
const refreshToken = async (req, res) => {
    try {
        const { refreshToken } = req.body;

        if (!refreshToken) {
            return res.status(401).json({
                success: false,
                message: 'Refresh token required'
            });
        }

        const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
        const user = await User.findById(decoded.id);

        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Invalid refresh token'
            });
        }

        const newToken = generateToken(user._id);
        const newRefreshToken = generateRefreshToken(user._id);

        res.status(200).json({
            success: true,
            data: {
                token: newToken,
                refreshToken: newRefreshToken
            }
        });

    } catch (error) {
        res.status(401).json({
            success: false,
            message: 'Invalid refresh token'
        });
    }
};

// ===== Get Current User =====
const getMe = async (req, res) => {
    try {
        const user = await User.findById(req.user._id)
            .populate('cart.product');

        res.status(200).json({
            success: true,
            data: user
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to get user data'
        });
    }
};

// ===== Update Profile =====
const updateProfile = async (req, res) => {
    try {
        const allowedUpdates = ['name', 'phone', 'address'];
        const updates = {};

        allowedUpdates.forEach(field => {
            if (req.body[field] !== undefined) {
                updates[field] = req.body[field];
            }
        });

        const user = await User.findByIdAndUpdate(
            req.user._id,
            updates,
            { new: true, runValidators: true }
        ).select('-password');

        res.status(200).json({
            success: true,
            message: 'Profile updated successfully',
            data: user
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to update profile'
        });
    }
};

// ===== Change Password =====
const changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;

        const user = await User.findById(req.user._id).select('+password');

        const isMatch = await user.comparePassword(currentPassword);
        if (!isMatch) {
            return res.status(400).json({
                success: false,
                message: 'Current password is incorrect'
            });
        }

        user.password = newPassword;
        await user.save();

        res.status(200).json({
            success: true,
            message: 'Password changed successfully'
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to change password'
        });
    }
};

// ===== Logout =====
const logout = async (req, res) => {
    res.clearCookie('token');
    res.status(200).json({
        success: true,
        message: 'Logged out successfully'
    });
};

// ===== Verify Email =====
const verifyEmail = async (req, res) => {
    try {
        const { token } = req.params;

        const user = await User.findOne({ verificationToken: token });

        if (!user) {
            return res.status(400).json({
                success: false,
                message: 'Invalid or expired verification token'
            });
        }

        user.isVerified = true;
        user.verificationToken = undefined;
        await user.save();

        res.status(200).json({
            success: true,
            message: 'Email verified successfully!'
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to verify email'
        });
    }
};

// ===== Forgot Password =====
const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;

        const user = await User.findOne({ email });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found with this email'
            });
        }

        const resetToken = crypto.randomBytes(20).toString('hex');
        user.resetPasswordToken = resetToken;
        user.resetPasswordExpire = Date.now() + 3600000; // 1 hour
        await user.save();

        const resetUrl = `${process.env.CLIENT_URL}/reset-password/${resetToken}`;

        await sendEmail({
            to: user.email,
            subject: 'Password Reset - Tex-Pharm Inc',
            html: `
                <h1>Reset Your Password</h1>
                <p>Click the link below to reset your password:</p>
                <a href="${resetUrl}" style="padding:12px 24px; background:#0b5ed7; color:white; text-decoration:none; border-radius:5px;">Reset Password</a>
                <p>This link will expire in 1 hour.</p>
                <p>If you didn't request this, please ignore this email.</p>
            `
        });

        res.status(200).json({
            success: true,
            message: 'Password reset email sent successfully'
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to send reset email'
        });
    }
};

// ===== Reset Password =====
const resetPassword = async (req, res) => {
    try {
        const { token } = req.params;
        const { password } = req.body;

        const user = await User.findOne({
            resetPasswordToken: token,
            resetPasswordExpire: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).json({
                success: false,
                message: 'Invalid or expired reset token'
            });
        }

        user.password = password;
        user.resetPasswordToken = undefined;
        user.resetPasswordExpire = undefined;
        await user.save();

        res.status(200).json({
            success: true,
            message: 'Password reset successfully'
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to reset password'
        });
    }
};

module.exports = {
    register,
    login,
    refreshToken,
    getMe,
    updateProfile,
    changePassword,
    logout,
    verifyEmail,
    forgotPassword,
    resetPassword
};