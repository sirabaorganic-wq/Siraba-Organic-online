/**
 * Frontend Security Utilities
 * OWASP Top 10 Security Measures for React Frontend
 */

/**
 * OWASP A03:2021 – Injection (XSS Prevention)
 * Sanitize HTML content to prevent XSS attacks
 */
export const sanitizeHTML = (html) => {
    const div = document.createElement('div');
    div.textContent = html;
    return div.innerHTML;
};

/**
 * OWASP A03:2021 – Injection (XSS Prevention)
 * Escape HTML special characters
 */
export const escapeHTML = (str) => {
    if (!str) return '';

    const htmlEscapeMap = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#x27;',
        '/': '&#x2F;',
    };

    return str.replace(/[&<>"'/]/g, (char) => htmlEscapeMap[char]);
};

/**
 * OWASP A03:2021 – Injection (XSS Prevention)
 * Remove potentially dangerous HTML tags and attributes
 */
export const stripScripts = (html) => {
    if (!html) return '';

    // Remove script tags
    let clean = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');

    // Remove event handlers
    clean = clean.replace(/\s*on\w+\s*=\s*["'][^"']*["']/gi, '');

    // Remove javascript: protocol
    clean = clean.replace(/javascript:/gi, '');

    return clean;
};

/**
 * OWASP A02:2021 – Cryptographic Failures
 * Secure token storage in sessionStorage (more secure than localStorage)
 */
export const secureStorage = {
    setToken: (token) => {
        try {
            // Use sessionStorage instead of localStorage for better security
            // Token expires when browser/tab is closed
            sessionStorage.setItem('authToken', token);

            // Optional: Set expiration time
            const expiryTime = new Date().getTime() + (30 * 24 * 60 * 60 * 1000); // 30 days
            sessionStorage.setItem('tokenExpiry', expiryTime.toString());
        } catch (error) {
            console.error('Failed to store token:', error);
        }
    },

    getToken: () => {
        try {
            const token = sessionStorage.getItem('authToken');
            const expiry = sessionStorage.getItem('tokenExpiry');

            // Check if token is expired
            if (expiry && new Date().getTime() > parseInt(expiry)) {
                secureStorage.clearToken();
                return null;
            }

            return token;
        } catch (error) {
            console.error('Failed to retrieve token:', error);
            return null;
        }
    },

    clearToken: () => {
        try {
            sessionStorage.removeItem('authToken');
            sessionStorage.removeItem('tokenExpiry');
        } catch (error) {
            console.error('Failed to clear token:', error);
        }
    },

    isTokenValid: () => {
        const token = secureStorage.getToken();
        if (!token) return false;

        try {
            // Basic JWT validation (check structure)
            const parts = token.split('.');
            if (parts.length !== 3) return false;

            // Decode payload
            const payload = JSON.parse(atob(parts[1]));

            // Check expiration
            if (payload.exp && payload.exp * 1000 < Date.now()) {
                secureStorage.clearToken();
                return false;
            }

            return true;
        } catch (error) {
            return false;
        }
    }
};

/**
 * OWASP A03:2021 – Injection
 * Validate email format
 */
export const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

/**
 * OWASP A07:2021 – Identification and Authentication Failures
 * Validate password strength
 */
export const validatePassword = (password) => {
    const minLength = 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);

    return {
        isValid: password.length >= minLength && hasUpperCase && hasLowerCase && hasNumbers && hasSpecialChar,
        errors: {
            minLength: password.length < minLength ? `Password must be at least ${minLength} characters` : null,
            uppercase: !hasUpperCase ? 'Password must contain at least one uppercase letter' : null,
            lowercase: !hasLowerCase ? 'Password must contain at least one lowercase letter' : null,
            number: !hasNumbers ? 'Password must contain at least one number' : null,
            specialChar: !hasSpecialChar ? 'Password must contain at least one special character' : null,
        }
    };
};

/**
 * OWASP A03:2021 – Injection
 * Sanitize user input before sending to API
 */
export const sanitizeInput = (input) => {
    if (typeof input !== 'string') return input;

    // Remove potential NoSQL injection characters
    let sanitized = input.replace(/[${}]/g, '');

    // Trim whitespace
    sanitized = sanitized.trim();

    // Limit length
    if (sanitized.length > 1000) {
        sanitized = sanitized.substring(0, 1000);
    }

    return sanitized;
};

/**
 * OWASP A03:2021 – Injection
 * Sanitize form data object
 */
export const sanitizeFormData = (formData) => {
    const sanitized = {};

    for (const key in formData) {
        if (formData.hasOwnProperty(key)) {
            const value = formData[key];

            if (typeof value === 'string') {
                sanitized[key] = sanitizeInput(value);
            } else if (Array.isArray(value)) {
                sanitized[key] = value.map(item =>
                    typeof item === 'string' ? sanitizeInput(item) : item
                );
            } else {
                sanitized[key] = value;
            }
        }
    }

    return sanitized;
};

/**
 * OWASP A01:2021 – Broken Access Control
 * Check if user has required permissions
 */
export const hasPermission = (user, requiredRole) => {
    if (!user) return false;

    if (requiredRole === 'admin') {
        return user.isAdmin === true;
    }

    return true; // Regular user
};

/**
 * OWASP A05:2021 – Security Misconfiguration
 * Validate URL to prevent open redirects
 */
export const isSafeURL = (url) => {
    if (!url) return false;

    try {
        const parsedURL = new URL(url, window.location.origin);
        const allowedDomains = [
            window.location.hostname,
            'localhost',
            '127.0.0.1'
        ];

        // Check if URL is from allowed domain
        return allowedDomains.some(domain =>
            parsedURL.hostname === domain || parsedURL.hostname.endsWith(`.${domain}`)
        );
    } catch (error) {
        return false;
    }
};

/**
 * OWASP A09:2021 – Security Logging and Monitoring
 * Log security events on frontend
 */
export const logSecurityEvent = (eventType, details) => {
    const event = {
        timestamp: new Date().toISOString(),
        type: eventType,
        details,
        userAgent: navigator.userAgent,
        url: window.location.href
    };

    // In production, send to backend logging service
    if (process.env.NODE_ENV === 'production') {
        // Send to your logging endpoint
        console.log('Security Event:', event);
    } else {
        console.warn('Security Event:', event);
    }
};

/**
 * OWASP A03:2021 – Injection
 * Validate phone number format
 */
export const validatePhone = (phone) => {
    // Basic phone validation (adjust regex based on your requirements)
    const phoneRegex = /^[\d\s\-\+\(\)]+$/;
    return phoneRegex.test(phone) && phone.replace(/\D/g, '').length >= 10;
};

/**
 * OWASP A03:2021 – Injection
 * Validate and sanitize URLs
 */
export const sanitizeURL = (url) => {
    if (!url) return '';

    try {
        const parsed = new URL(url);

        // Only allow http and https protocols
        if (!['http:', 'https:'].includes(parsed.protocol)) {
            return '';
        }

        return parsed.href;
    } catch (error) {
        return '';
    }
};

/**
 * OWASP A02:2021 – Cryptographic Failures
 * Generate a random nonce for CSP
 */
export const generateNonce = () => {
    const array = new Uint8Array(16);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
};

/**
 * OWASP A07:2021 – Identification and Authentication Failures
 * Handle API errors securely (don't expose sensitive info)
 */
export const handleAPIError = (error) => {
    // Don't expose detailed error messages to users
    const safeMessages = {
        401: 'Authentication failed. Please log in again.',
        403: 'You do not have permission to access this resource.',
        404: 'The requested resource was not found.',
        429: 'Too many requests. Please try again later.',
        500: 'An unexpected error occurred. Please try again later.',
    };

    const statusCode = error.response?.status;
    const message = safeMessages[statusCode] || 'An error occurred. Please try again.';

    // Log detailed error for debugging (in development only)
    if (process.env.NODE_ENV === 'development') {
        console.error('API Error:', error);
    }

    return {
        message,
        statusCode,
        shouldRetry: statusCode >= 500,
        shouldLogout: statusCode === 401
    };
};

/**
 * OWASP A05:2021 – Security Misconfiguration
 * Validate file upload
 */
export const validateFileUpload = (file, options = {}) => {
    const {
        maxSize = 5 * 1024 * 1024, // 5MB default
        allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
        allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp']
    } = options;

    const errors = [];

    // Check file size
    if (file.size > maxSize) {
        errors.push(`File size must be less than ${maxSize / (1024 * 1024)}MB`);
    }

    // Check file type
    if (!allowedTypes.includes(file.type)) {
        errors.push(`File type must be one of: ${allowedTypes.join(', ')}`);
    }

    // Check file extension
    const extension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
    if (!allowedExtensions.includes(extension)) {
        errors.push(`File extension must be one of: ${allowedExtensions.join(', ')}`);
    }

    return {
        isValid: errors.length === 0,
        errors
    };
};

export default {
    sanitizeHTML,
    escapeHTML,
    stripScripts,
    secureStorage,
    validateEmail,
    validatePassword,
    sanitizeInput,
    sanitizeFormData,
    hasPermission,
    isSafeURL,
    logSecurityEvent,
    validatePhone,
    sanitizeURL,
    generateNonce,
    handleAPIError,
    validateFileUpload
};
