const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { securityLogger } = require('./securityLogger');

/**
 * OWASP A01:2021 – Broken Access Control
 * OWASP A07:2021 – Identification and Authentication Failures
 * Enhanced authentication middleware with better security
 */

const protect = async (req, res, next) => {
    let token;
    const ip = req.ip || req.connection.remoteAddress;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            token = req.headers.authorization.split(' ')[1];

            // Verify token
            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret123');

            // Check if token is expired
            if (decoded.exp && decoded.exp < Date.now() / 1000) {
                securityLogger.logFailedAuth('unknown', ip, 'Token expired');
                return res.status(401).json({
                    message: 'Not authorized, token expired',
                    code: 'TOKEN_EXPIRED'
                });
            }

            // Fetch user and exclude sensitive fields
            req.user = await User.findById(decoded.id).select('-password -resetPasswordToken -resetPasswordExpire');

            if (!req.user) {
                securityLogger.logFailedAuth(decoded.id, ip, 'User not found');
                return res.status(401).json({
                    message: 'Not authorized, user not found',
                    code: 'USER_NOT_FOUND'
                });
            }

            // Check if user account is active (if you have this field)
            if (req.user.isBlocked) {
                securityLogger.logFailedAuth(req.user.email, ip, 'Account blocked');
                return res.status(403).json({
                    message: 'Account has been blocked. Please contact support.',
                    code: 'ACCOUNT_BLOCKED'
                });
            }

            // Check for account lockout due to failed login attempts
            if (req.user.accountLockUntil && req.user.accountLockUntil > Date.now()) {
                const lockTimeRemaining = Math.ceil((req.user.accountLockUntil - Date.now()) / 60000);
                securityLogger.logFailedAuth(req.user.email, ip, 'Account locked');
                return res.status(423).json({
                    message: `Account is locked. Please try again in ${lockTimeRemaining} minutes.`,
                    code: 'ACCOUNT_LOCKED',
                    retryAfter: lockTimeRemaining
                });
            }

            next();
        } catch (error) {
            console.error('Auth error:', error);

            if (error.name === 'JsonWebTokenError') {
                securityLogger.logFailedAuth('unknown', ip, 'Invalid token');
                return res.status(401).json({
                    message: 'Not authorized, token invalid',
                    code: 'INVALID_TOKEN'
                });
            }

            if (error.name === 'TokenExpiredError') {
                securityLogger.logFailedAuth('unknown', ip, 'Token expired');
                return res.status(401).json({
                    message: 'Not authorized, token expired',
                    code: 'TOKEN_EXPIRED'
                });
            }

            return res.status(401).json({
                message: 'Not authorized, authentication failed',
                code: 'AUTH_FAILED'
            });
        }
    } else {
        securityLogger.logFailedAuth('unknown', ip, 'No token provided');
        return res.status(401).json({
            message: 'Not authorized, no token provided',
            code: 'NO_TOKEN'
        });
    }
};

/**
 * OWASP A01:2021 – Broken Access Control
 * Admin authorization middleware with logging
 */
const admin = (req, res, next) => {
    const ip = req.ip || req.connection.remoteAddress;

    if (req.user && req.user.isAdmin) {
        securityLogger.logAdminAccess(
            req.user._id,
            `${req.method} ${req.path}`,
            ip
        );
        next();
    } else {
        securityLogger.logUnauthorizedAccess(
            req.user ? req.user._id : 'unknown',
            `Admin: ${req.method} ${req.path}`,
            ip,
            req.get('user-agent')
        );
        return res.status(403).json({
            message: 'Not authorized as an admin',
            code: 'ADMIN_REQUIRED'
        });
    }
};

/**
 * OWASP A01:2021 – Broken Access Control
 * Middleware to check if user is accessing their own resources
 */
const ownResource = (paramName = 'id') => {
    return (req, res, next) => {
        const resourceId = req.params[paramName];
        const userId = req.user._id.toString();
        const ip = req.ip || req.connection.remoteAddress;

        // Admin can access any resource
        if (req.user.isAdmin) {
            return next();
        }

        // Check if user is accessing their own resource
        if (resourceId !== userId) {
            securityLogger.logUnauthorizedAccess(
                userId,
                `Resource: ${req.path}`,
                ip,
                req.get('user-agent')
            );
            return res.status(403).json({
                message: 'Not authorized to access this resource',
                code: 'FORBIDDEN'
            });
        }

        next();
    };
};

/**
 * OWASP A01:2021 – Broken Access Control
 * Optional authentication - doesn't fail if no token
 */
const optionalAuth = async (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            token = req.headers.authorization.split(' ')[1];
            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret123');
            req.user = await User.findById(decoded.id).select('-password -resetPasswordToken -resetPasswordExpire');
        } catch (error) {
            // Token is invalid but we don't fail, just proceed without user
            req.user = null;
        }
    }

    next();
};

module.exports = { protect, admin, ownResource, optionalAuth };
