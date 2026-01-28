const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Order = require('../models/Order');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { protect, admin } = require('../middleware/authMiddleware');
const crypto = require('crypto');
const nodemailer = require('nodemailer');

// Security middleware
const { loginLimiter, registerLimiter } = require('../middleware/securityMiddleware');
const {
    validateRegistration,
    validateLogin,
    validateEmail,
    validatePasswordReset
} = require('../middleware/validationMiddleware');
const { securityLogger, authLogger } = require('../middleware/securityLogger');

// Apply auth logger to all routes
router.use(authLogger);

// Account lockout settings
const MAX_LOGIN_ATTEMPTS = 5;
const LOCK_TIME = 15 * 60 * 1000; // 15 minutes

// Generate JWT
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET || 'secret123', { expiresIn: '30d' });
};

// @desc    Get all users with stats
// @route   GET /api/auth/users
// @access  Private/Admin
router.get('/users', protect, admin, async (req, res) => {
    try {
        const users = await User.find({});
        const usersWithStats = await Promise.all(users.map(async (user) => {
            const orderCount = await Order.countDocuments({ user: user._id });
            return {
                _id: user._id,
                name: user.name,
                email: user.email,
                isAdmin: user.isAdmin,
                isBlocked: user.isBlocked,
                totalOrders: orderCount,
                lastLogin: user.lastLogin,
                createdAt: user.createdAt
            };
        }));
        res.json(usersWithStats);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Register new user
// @route   POST /api/auth/register
// @access  Public
router.post('/register', registerLimiter, validateRegistration, async (req, res) => {
    const { name, email, password } = req.body;
    const ip = req.ip || req.connection.remoteAddress;

    try {
        const userExists = await User.findOne({ email: email.toLowerCase() });
        if (userExists) {
            securityLogger.logSuspiciousActivity(
                'DUPLICATE_REGISTRATION',
                { email },
                ip,
                req.get('user-agent')
            );
            return res.status(400).json({ message: 'User already exists' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const user = await User.create({
            name,
            email: email.toLowerCase(),
            password: hashedPassword,
            lastPasswordChange: new Date()
        });

        if (user) {
            securityLogger.logRegistration(user.email, ip, req.get('user-agent'));

            res.status(201).json({
                _id: user._id,
                name: user.name,
                email: user.email,
                isAdmin: user.isAdmin,
                cart: user.cart,
                token: generateToken(user._id)
            });
        } else {
            res.status(400).json({ message: 'Invalid user data' });
        }
    } catch (error) {
        securityLogger.logError(error, 'Registration', null, ip);
        res.status(500).json({ message: error.message });
    }
});

// @desc    Auth user & get token
// @route   POST /api/auth/login
// @access  Public
router.post('/login', loginLimiter, validateLogin, async (req, res) => {
    const { email, password } = req.body;
    const ip = req.ip || req.connection.remoteAddress;

    try {
        const user = await User.findOne({ email: email.toLowerCase() });

        if (!user) {
            securityLogger.logFailedAuth(email, ip, 'User not found');
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        // Check if account is blocked
        if (user.isBlocked) {
            securityLogger.logFailedAuth(email, ip, 'Account blocked');
            return res.status(403).json({
                message: 'Account has been blocked. Please contact support.',
                code: 'ACCOUNT_BLOCKED'
            });
        }

        // Check if account is locked
        if (user.accountLockUntil && user.accountLockUntil > Date.now()) {
            const lockTimeRemaining = Math.ceil((user.accountLockUntil - Date.now()) / 60000);
            securityLogger.logFailedAuth(email, ip, 'Account locked');
            return res.status(423).json({
                message: `Account is locked due to too many failed login attempts. Please try again in ${lockTimeRemaining} minutes.`,
                code: 'ACCOUNT_LOCKED',
                retryAfter: lockTimeRemaining
            });
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
            // Increment failed login attempts
            user.failedLoginAttempts = (user.failedLoginAttempts || 0) + 1;

            // Lock account if max attempts exceeded
            if (user.failedLoginAttempts >= MAX_LOGIN_ATTEMPTS) {
                user.accountLockUntil = Date.now() + LOCK_TIME;
                await user.save();

                securityLogger.logSuspiciousActivity(
                    'ACCOUNT_LOCKED',
                    { email, attempts: user.failedLoginAttempts },
                    ip,
                    req.get('user-agent')
                );

                return res.status(423).json({
                    message: `Account locked due to ${MAX_LOGIN_ATTEMPTS} failed login attempts. Please try again in 15 minutes.`,
                    code: 'ACCOUNT_LOCKED'
                });
            }

            await user.save();
            securityLogger.logFailedAuth(email, ip, `Invalid password (${user.failedLoginAttempts} attempts)`);

            return res.status(401).json({
                message: 'Invalid email or password',
                attemptsRemaining: MAX_LOGIN_ATTEMPTS - user.failedLoginAttempts
            });
        }

        // Successful login - reset failed attempts
        user.failedLoginAttempts = 0;
        user.accountLockUntil = undefined;
        user.lastLogin = new Date();
        await user.save();

        securityLogger.logLogin(true, email, ip, req.get('user-agent'));

        res.json({
            _id: user._id,
            name: user.name,
            email: user.email,
            isAdmin: user.isAdmin,
            cart: user.cart,
            token: generateToken(user._id)
        });
    } catch (error) {
        console.error(error);
        securityLogger.logError(error, 'Login', null, ip);
        res.status(500).json({ message: error.message });
    }
});

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
router.put('/profile', protect, async (req, res) => {
    try {
        const user = await User.findById(req.user._id);

        if (user) {
            user.name = req.body.name || user.name;
            user.email = req.body.email || user.email;
            user.phone = req.body.phone || user.phone;
            if (req.body.password) {
                const salt = await bcrypt.genSalt(10);
                user.password = await bcrypt.hash(req.body.password, salt);
            }
            if (req.body.addresses) {
                user.addresses = req.body.addresses;
            }
            if (req.body.notificationPreferences) {
                user.notificationPreferences = req.body.notificationPreferences;
            }

            const updatedUser = await user.save();

            res.json({
                _id: updatedUser._id,
                name: updatedUser.name,
                email: updatedUser.email,
                phone: updatedUser.phone,
                addresses: updatedUser.addresses,
                isAdmin: updatedUser.isAdmin,
                cart: updatedUser.cart,
                token: generateToken(updatedUser._id)
            });
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});
// @desc    Get user wishlist
// @route   GET /api/auth/wishlist
// @access  Private
router.get('/wishlist', protect, async (req, res) => {
    try {
        const user = await User.findById(req.user._id).populate('wishlist');
        res.json(user.wishlist);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Toggle wishlist item
// @route   POST /api/auth/wishlist/:id
// @access  Private
router.post('/wishlist/:id', protect, async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        const productId = req.params.id;

        if (user.wishlist.includes(productId)) {
            user.wishlist = user.wishlist.filter(id => id.toString() !== productId);
            await user.save();
            res.json({ message: 'Product removed from wishlist', wishlist: user.wishlist });
        } else {
            user.wishlist.push(productId);
            await user.save();
            res.json({ message: 'Product added to wishlist', wishlist: user.wishlist });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Delete user account
// @route   DELETE /api/auth/profile
// @access  Private
router.delete('/profile', protect, async (req, res) => {
    try {
        const user = await User.findById(req.user._id);

        if (user) {
            await user.deleteOne();
            res.json({ message: 'User removed' });
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});
// @desc    Forgot Password
// @route   POST /api/auth/forgotpassword
// @access  Public
router.post('/forgotpassword', async (req, res) => {
    const { email } = req.body;
    try {
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Generate token
        const resetToken = crypto.randomBytes(20).toString('hex');
        const resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
        const resetPasswordExpire = Date.now() + 10 * 60 * 1000; // 10 Minutes

        user.resetPasswordToken = resetPasswordToken;
        user.resetPasswordExpire = resetPasswordExpire;
        await user.save();

        const resetUrl = `http://localhost:5173/reset-password/${resetToken}`;

        const message = `
            <h1>You have requested a password reset</h1>
            <p>Please go to this link to reset your password:</p>
            <a href=${resetUrl} clicktracking=off>${resetUrl}</a>
        `;

        // Check if email is configured
        if (!process.env.EMAIL_USER || process.env.EMAIL_USER === 'your_email@gmail.com') {
            // Development mode: Return link directly without sending email
            console.log(`Password reset requested for ${user.email}`);
            console.log(`Reset URL: ${resetUrl}`);
            return res.json({
                message: 'Password reset link generated (Development Mode - Email not configured)',
                resetUrl: resetUrl // Only for development
            });
        }

        try {
            const transporter = nodemailer.createTransport({
                service: 'gmail',
                auth: {
                    user: process.env.EMAIL_USER,
                    pass: process.env.EMAIL_PASS
                }
            });

            await transporter.sendMail({
                from: 'Siraba Organic <info@sirabaorganic.com>',
                to: user.email,
                subject: 'Password Reset Request',
                html: message
            });

            res.json({ message: 'Password reset email sent successfully' });
        } catch (error) {
            console.error('Email sending error:', error);
            user.resetPasswordToken = undefined;
            user.resetPasswordExpire = undefined;
            await user.save();
            return res.status(500).json({ message: 'Email could not be sent. Please try again later.' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Reset Password
// @route   PUT /api/auth/resetpassword/:resetToken
// @access  Public
router.put('/resetpassword/:resetToken', async (req, res) => {
    const resetPasswordToken = crypto.createHash('sha256').update(req.params.resetToken).digest('hex');

    try {
        const user = await User.findOne({
            resetPasswordToken,
            resetPasswordExpire: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).json({ message: 'Invalid Token' });
        }

        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(req.body.password, salt);
        user.resetPasswordToken = undefined;
        user.resetPasswordExpire = undefined;
        await user.save();

        res.json({
            success: true,
            token: generateToken(user._id),
            message: 'Password Reset Success'
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
