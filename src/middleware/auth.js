// Authentication middleware
const { validateSession, isTrialActive } = require('../services/auth');

// Require authentication
function requireAuth(req, res, next) {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Authentication required' });
    }

    const token = authHeader.substring(7);
    const session = validateSession(token);

    if (!session) {
        return res.status(401).json({ error: 'Invalid or expired session' });
    }

    if (!session.emailVerified) {
        return res.status(403).json({ error: 'Email not verified' });
    }

    // Check trial status
    if (!isTrialActive(session.trialEndsAt)) {
        return res.status(403).json({
            error: 'Trial expired',
            message: 'Your trial period has ended. Contact us to continue using Snowlion.',
            trialEndsAt: session.trialEndsAt
        });
    }

    req.user = session;
    next();
}

// Optional authentication (doesn't fail if not authenticated)
function optionalAuth(req, res, next) {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.substring(7);
        const session = validateSession(token);
        if (session) {
            req.user = session;
        }
    }

    next();
}

module.exports = { requireAuth, optionalAuth };
