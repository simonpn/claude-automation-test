// Authentication service
const { getDb } = require('../db/connection');
const { v4: uuidv4 } = require('uuid');
const crypto = require('crypto');

const TRIAL_DURATION_DAYS = parseInt(process.env.TRIAL_DURATION_DAYS || '14');

// Generate a secure random token
function generateToken() {
    return crypto.randomBytes(32).toString('hex');
}

// Create a new user (signup)
function createUser({ email, companyName, industry, companySize }) {
    const db = getDb();
    const id = uuidv4();
    const verificationToken = generateToken();
    const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(); // 24 hours
    const trialEndsAt = new Date(Date.now() + TRIAL_DURATION_DAYS * 24 * 60 * 60 * 1000).toISOString();

    try {
        const stmt = db.prepare(`
            INSERT INTO users (id, email, company_name, industry, company_size, trial_ends_at, verification_token, verification_expires_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `);
        stmt.run(id, email.toLowerCase(), companyName, industry, companySize, trialEndsAt, verificationToken, verificationExpires);

        return {
            id,
            email: email.toLowerCase(),
            verificationToken,
            trialEndsAt
        };
    } catch (error) {
        if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
            throw new Error('Email already registered');
        }
        throw error;
    }
}

// Verify email with token
function verifyEmail(token) {
    const db = getDb();

    const user = db.prepare(`
        SELECT id, email, verification_expires_at
        FROM users
        WHERE verification_token = ? AND email_verified = 0
    `).get(token);

    if (!user) {
        throw new Error('Invalid verification token');
    }

    if (new Date(user.verification_expires_at) < new Date()) {
        throw new Error('Verification token expired');
    }

    db.prepare(`
        UPDATE users
        SET email_verified = 1, verification_token = NULL, verification_expires_at = NULL
        WHERE id = ?
    `).run(user.id);

    return { id: user.id, email: user.email };
}

// Create a session for authenticated user
function createSession(userId) {
    const db = getDb();
    const id = uuidv4();
    const token = generateToken();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(); // 7 days

    db.prepare(`
        INSERT INTO sessions (id, user_id, token, expires_at)
        VALUES (?, ?, ?, ?)
    `).run(id, userId, token, expiresAt);

    // Log the login
    logUsage(userId, 'login');

    return { token, expiresAt };
}

// Validate session token
function validateSession(token) {
    const db = getDb();

    const session = db.prepare(`
        SELECT s.user_id, s.expires_at, u.email, u.company_name, u.industry, u.trial_ends_at, u.is_active, u.email_verified
        FROM sessions s
        JOIN users u ON s.user_id = u.id
        WHERE s.token = ?
    `).get(token);

    if (!session) {
        return null;
    }

    if (new Date(session.expires_at) < new Date()) {
        // Clean up expired session
        db.prepare('DELETE FROM sessions WHERE token = ?').run(token);
        return null;
    }

    if (!session.is_active) {
        return null;
    }

    return {
        userId: session.user_id,
        email: session.email,
        companyName: session.company_name,
        industry: session.industry,
        trialEndsAt: session.trial_ends_at,
        emailVerified: session.email_verified === 1
    };
}

// Delete session (logout)
function deleteSession(token) {
    const db = getDb();
    db.prepare('DELETE FROM sessions WHERE token = ?').run(token);
}

// Get user by email
function getUserByEmail(email) {
    const db = getDb();
    return db.prepare('SELECT * FROM users WHERE email = ?').get(email.toLowerCase());
}

// Log usage action
function logUsage(userId, action, tokensUsed = 0, documentName = null) {
    const db = getDb();
    const id = uuidv4();

    db.prepare(`
        INSERT INTO usage_logs (id, user_id, action, tokens_used, document_name)
        VALUES (?, ?, ?, ?, ?)
    `).run(id, userId, action, tokensUsed, documentName);
}

// Check if user is within trial period
function isTrialActive(trialEndsAt) {
    return new Date(trialEndsAt) > new Date();
}

// Request login link (magic link style)
function requestLoginLink(email) {
    const db = getDb();
    const user = getUserByEmail(email);

    if (!user) {
        throw new Error('User not found');
    }

    if (!user.email_verified) {
        throw new Error('Email not verified');
    }

    // Generate new verification token for login
    const loginToken = generateToken();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString(); // 15 minutes

    db.prepare(`
        UPDATE users
        SET verification_token = ?, verification_expires_at = ?
        WHERE id = ?
    `).run(loginToken, expiresAt, user.id);

    return { userId: user.id, loginToken, email: user.email };
}

// Complete login with magic link token
function completeLogin(token) {
    const db = getDb();

    const user = db.prepare(`
        SELECT id, email, verification_expires_at, email_verified
        FROM users
        WHERE verification_token = ? AND email_verified = 1
    `).get(token);

    if (!user) {
        throw new Error('Invalid login token');
    }

    if (new Date(user.verification_expires_at) < new Date()) {
        throw new Error('Login token expired');
    }

    // Clear the token
    db.prepare(`
        UPDATE users
        SET verification_token = NULL, verification_expires_at = NULL
        WHERE id = ?
    `).run(user.id);

    // Create session
    return createSession(user.id);
}

module.exports = {
    createUser,
    verifyEmail,
    createSession,
    validateSession,
    deleteSession,
    getUserByEmail,
    logUsage,
    isTrialActive,
    requestLoginLink,
    completeLogin,
    generateToken
};
