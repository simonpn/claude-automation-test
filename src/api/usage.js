// Usage API routes
const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const { getUserUsageStats, getUsageHistory } = require('../services/usage');

// GET /api/usage/stats - Get current user's usage stats
router.get('/stats', requireAuth, (req, res) => {
    try {
        const stats = getUserUsageStats(req.user.userId);
        res.json(stats);
    } catch (error) {
        console.error('Usage stats error:', error);
        res.status(500).json({ error: 'Failed to get usage stats' });
    }
});

// GET /api/usage/history - Get current user's usage history
router.get('/history', requireAuth, (req, res) => {
    try {
        const limit = Math.min(parseInt(req.query.limit) || 50, 100);
        const history = getUsageHistory(req.user.userId, limit);
        res.json({ history });
    } catch (error) {
        console.error('Usage history error:', error);
        res.status(500).json({ error: 'Failed to get usage history' });
    }
});

module.exports = router;
