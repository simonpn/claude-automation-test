// Admin API routes (protected - requires admin key)
const express = require('express');
const router = express.Router();
const { getDb } = require('../db/connection');
const { getAllUsersWithStats, getAggregateStats } = require('../services/usage');

// Simple admin key auth (in production, use proper auth)
const ADMIN_KEY = process.env.ADMIN_KEY || 'snowlion-admin-dev';

function requireAdmin(req, res, next) {
    const adminKey = req.headers['x-admin-key'];

    if (!adminKey || adminKey !== ADMIN_KEY) {
        return res.status(401).json({ error: 'Admin authentication required' });
    }

    next();
}

// Apply admin auth to all routes
router.use(requireAdmin);

// GET /api/admin/stats - Get aggregate statistics
router.get('/stats', (req, res) => {
    try {
        const stats = getAggregateStats();
        res.json(stats);
    } catch (error) {
        console.error('Admin stats error:', error);
        res.status(500).json({ error: 'Failed to get stats' });
    }
});

// GET /api/admin/users - Get all users with usage stats
router.get('/users', (req, res) => {
    try {
        const users = getAllUsersWithStats();
        res.json({ users });
    } catch (error) {
        console.error('Admin users error:', error);
        res.status(500).json({ error: 'Failed to get users' });
    }
});

// GET /api/admin/feedback - Get all feedback
router.get('/feedback', (req, res) => {
    try {
        const db = getDb();
        const limit = Math.min(parseInt(req.query.limit) || 100, 500);

        const feedback = db.prepare(`
            SELECT
                f.id,
                f.document_types,
                f.process_ideas,
                f.general_notes,
                f.rating,
                f.created_at,
                u.email as user_email,
                u.company_name as user_company,
                u.industry as user_industry
            FROM feedback f
            LEFT JOIN users u ON f.user_id = u.id
            ORDER BY f.created_at DESC
            LIMIT ?
        `).all(limit);

        res.json({ feedback });
    } catch (error) {
        console.error('Admin feedback error:', error);
        res.status(500).json({ error: 'Failed to get feedback' });
    }
});

// GET /api/admin/leads - Get leads (users who signed up)
router.get('/leads', (req, res) => {
    try {
        const db = getDb();

        const leads = db.prepare(`
            SELECT
                id,
                email,
                company_name,
                industry,
                company_size,
                created_at,
                trial_ends_at,
                email_verified,
                is_active
            FROM users
            ORDER BY created_at DESC
        `).all();

        res.json({ leads });
    } catch (error) {
        console.error('Admin leads error:', error);
        res.status(500).json({ error: 'Failed to get leads' });
    }
});

// PUT /api/admin/users/:id/extend-trial - Extend user's trial
router.put('/users/:id/extend-trial', (req, res) => {
    try {
        const { id } = req.params;
        const { days } = req.body;

        if (!days || days < 1 || days > 365) {
            return res.status(400).json({ error: 'Days must be between 1 and 365' });
        }

        const db = getDb();

        // Get current trial end
        const user = db.prepare('SELECT trial_ends_at FROM users WHERE id = ?').get(id);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Extend from current end date or now, whichever is later
        const currentEnd = new Date(user.trial_ends_at);
        const now = new Date();
        const baseDate = currentEnd > now ? currentEnd : now;
        const newEnd = new Date(baseDate.getTime() + days * 24 * 60 * 60 * 1000);

        db.prepare('UPDATE users SET trial_ends_at = ? WHERE id = ?').run(newEnd.toISOString(), id);

        res.json({
            message: 'Trial extended',
            newTrialEndsAt: newEnd.toISOString()
        });
    } catch (error) {
        console.error('Admin extend trial error:', error);
        res.status(500).json({ error: 'Failed to extend trial' });
    }
});

// PUT /api/admin/users/:id/deactivate - Deactivate user
router.put('/users/:id/deactivate', (req, res) => {
    try {
        const { id } = req.params;
        const db = getDb();

        const result = db.prepare('UPDATE users SET is_active = 0 WHERE id = ?').run(id);

        if (result.changes === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json({ message: 'User deactivated' });
    } catch (error) {
        console.error('Admin deactivate error:', error);
        res.status(500).json({ error: 'Failed to deactivate user' });
    }
});

module.exports = router;
