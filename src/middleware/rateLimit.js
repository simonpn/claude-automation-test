// Rate limiting middleware
const rateLimit = require('express-rate-limit');

// General API rate limit
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // 100 requests per window
    message: { error: 'Too many requests, please try again later' },
    standardHeaders: true,
    legacyHeaders: false
});

// Stricter limit for auth endpoints (prevent brute force)
const authLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 10, // 10 requests per hour
    message: { error: 'Too many authentication attempts, please try again later' },
    standardHeaders: true,
    legacyHeaders: false
});

// Document processing limit (on top of quota system)
const documentLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 5, // 5 requests per minute
    message: { error: 'Processing too fast, please slow down' },
    standardHeaders: true,
    legacyHeaders: false
});

module.exports = { apiLimiter, authLimiter, documentLimiter };
