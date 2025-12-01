// Usage tracking and quota service
const { getDb } = require('../db/connection');

const WEEKLY_DOCUMENT_LIMIT = parseInt(process.env.WEEKLY_DOCUMENT_LIMIT || '10');

// Get usage stats for a user
function getUserUsageStats(userId) {
    const db = getDb();

    // Get total documents processed
    const totalDocs = db.prepare(`
        SELECT COUNT(*) as count
        FROM usage_logs
        WHERE user_id = ? AND action = 'bom_generated'
    `).get(userId);

    // Get documents processed this week
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    weekStart.setHours(0, 0, 0, 0);

    const weeklyDocs = db.prepare(`
        SELECT COUNT(*) as count
        FROM usage_logs
        WHERE user_id = ? AND action = 'bom_generated' AND created_at >= ?
    `).get(userId, weekStart.toISOString());

    // Get total tokens used
    const totalTokens = db.prepare(`
        SELECT COALESCE(SUM(tokens_used), 0) as total
        FROM usage_logs
        WHERE user_id = ?
    `).get(userId);

    return {
        totalDocuments: totalDocs.count,
        weeklyDocuments: weeklyDocs.count,
        weeklyLimit: WEEKLY_DOCUMENT_LIMIT,
        remainingThisWeek: Math.max(0, WEEKLY_DOCUMENT_LIMIT - weeklyDocs.count),
        totalTokensUsed: totalTokens.total
    };
}

// Check if user can process more documents
function canProcessDocument(userId) {
    const stats = getUserUsageStats(userId);
    return stats.remainingThisWeek > 0;
}

// Get usage history for a user
function getUsageHistory(userId, limit = 50) {
    const db = getDb();

    return db.prepare(`
        SELECT id, action, tokens_used, document_name, created_at
        FROM usage_logs
        WHERE user_id = ?
        ORDER BY created_at DESC
        LIMIT ?
    `).all(userId, limit);
}

// Admin: Get all users with usage stats
function getAllUsersWithStats() {
    const db = getDb();

    return db.prepare(`
        SELECT
            u.id,
            u.email,
            u.company_name,
            u.industry,
            u.created_at,
            u.trial_ends_at,
            u.is_active,
            u.email_verified,
            (SELECT COUNT(*) FROM usage_logs WHERE user_id = u.id AND action = 'bom_generated') as total_documents,
            (SELECT COALESCE(SUM(tokens_used), 0) FROM usage_logs WHERE user_id = u.id) as total_tokens
        FROM users u
        ORDER BY u.created_at DESC
    `).all();
}

// Admin: Get aggregate stats
function getAggregateStats() {
    const db = getDb();

    const totalUsers = db.prepare('SELECT COUNT(*) as count FROM users').get();
    const verifiedUsers = db.prepare('SELECT COUNT(*) as count FROM users WHERE email_verified = 1').get();
    const activeTrials = db.prepare(`
        SELECT COUNT(*) as count FROM users
        WHERE is_active = 1 AND trial_ends_at > datetime('now')
    `).get();
    const totalDocs = db.prepare(`
        SELECT COUNT(*) as count FROM usage_logs WHERE action = 'bom_generated'
    `).get();
    const totalTokens = db.prepare(`
        SELECT COALESCE(SUM(tokens_used), 0) as total FROM usage_logs
    `).get();

    // Users by industry
    const byIndustry = db.prepare(`
        SELECT industry, COUNT(*) as count
        FROM users
        WHERE industry IS NOT NULL
        GROUP BY industry
    `).all();

    return {
        totalUsers: totalUsers.count,
        verifiedUsers: verifiedUsers.count,
        activeTrials: activeTrials.count,
        totalDocumentsProcessed: totalDocs.count,
        totalTokensUsed: totalTokens.total,
        usersByIndustry: byIndustry
    };
}

module.exports = {
    getUserUsageStats,
    canProcessDocument,
    getUsageHistory,
    getAllUsersWithStats,
    getAggregateStats,
    WEEKLY_DOCUMENT_LIMIT
};
