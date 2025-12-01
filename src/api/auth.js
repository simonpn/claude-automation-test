// Authentication API routes
const express = require('express');
const router = express.Router();
const {
    createUser,
    verifyEmail,
    requestLoginLink,
    completeLogin,
    deleteSession,
    getUserByEmail
} = require('../services/auth');
const { authLimiter } = require('../middleware/rateLimit');
const { requireAuth } = require('../middleware/auth');

// POST /api/auth/signup - Register new user
router.post('/signup', authLimiter, (req, res) => {
    try {
        const { email, companyName, industry, companySize } = req.body;

        if (!email) {
            return res.status(400).json({ error: 'Email is required' });
        }

        // Basic email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ error: 'Invalid email format' });
        }

        // Validate industry if provided
        const validIndustries = ['energy', 'defence', 'shipbuilding', 'datacenter', 'other'];
        if (industry && !validIndustries.includes(industry)) {
            return res.status(400).json({ error: 'Invalid industry', validOptions: validIndustries });
        }

        const user = createUser({ email, companyName, industry, companySize });

        // In production, send verification email here
        // For now, return the token for testing
        console.log(`[DEV] Verification link: /api/auth/verify?token=${user.verificationToken}`);

        res.status(201).json({
            message: 'User created. Please check your email to verify your account.',
            userId: user.id,
            trialEndsAt: user.trialEndsAt,
            // Remove in production - only for testing
            _devVerificationToken: process.env.NODE_ENV === 'development' ? user.verificationToken : undefined
        });
    } catch (error) {
        if (error.message === 'Email already registered') {
            return res.status(409).json({ error: error.message });
        }
        console.error('Signup error:', error);
        res.status(500).json({ error: 'Failed to create user' });
    }
});

// GET /api/auth/verify - Verify email with token
router.get('/verify', (req, res) => {
    try {
        const { token } = req.query;

        if (!token) {
            return res.status(400).json({ error: 'Verification token required' });
        }

        const user = verifyEmail(token);

        res.json({
            message: 'Email verified successfully',
            email: user.email
        });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// POST /api/auth/login - Request magic link login
router.post('/login', authLimiter, (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ error: 'Email is required' });
        }

        const result = requestLoginLink(email);

        // In production, send login email here
        console.log(`[DEV] Login link: /api/auth/login/complete?token=${result.loginToken}`);

        res.json({
            message: 'Login link sent to your email',
            // Remove in production - only for testing
            _devLoginToken: process.env.NODE_ENV === 'development' ? result.loginToken : undefined
        });
    } catch (error) {
        // Don't reveal if user exists or not
        res.json({ message: 'If this email is registered, a login link has been sent' });
    }
});

// GET /api/auth/login/complete - Complete login with magic link
router.get('/login/complete', (req, res) => {
    try {
        const { token } = req.query;

        if (!token) {
            return res.status(400).json({ error: 'Login token required' });
        }

        const session = completeLogin(token);

        res.json({
            message: 'Login successful',
            token: session.token,
            expiresAt: session.expiresAt
        });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// POST /api/auth/logout - Logout (invalidate session)
router.post('/logout', requireAuth, (req, res) => {
    try {
        const authHeader = req.headers.authorization;
        const token = authHeader.substring(7);

        deleteSession(token);

        res.json({ message: 'Logged out successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to logout' });
    }
});

// GET /api/auth/me - Get current user info
router.get('/me', requireAuth, (req, res) => {
    res.json({
        userId: req.user.userId,
        email: req.user.email,
        companyName: req.user.companyName,
        industry: req.user.industry,
        trialEndsAt: req.user.trialEndsAt
    });
});

module.exports = router;
