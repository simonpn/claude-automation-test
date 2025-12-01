// Snowlion - Document to BOM Converter
// Main entry point

require('dotenv').config();

const express = require('express');
const path = require('path');
const fs = require('fs');
const { initDatabase } = require('./db/init');
const { closeDb } = require('./db/connection');
const { apiLimiter } = require('./middleware/rateLimit');

// Import routes
const authRoutes = require('./api/auth');
const usageRoutes = require('./api/usage');
const documentsRoutes = require('./api/documents');
const feedbackRoutes = require('./api/feedback');
const adminRoutes = require('./api/admin');

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS for frontend integration
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, X-Admin-Key');

    if (req.method === 'OPTIONS') {
        return res.sendStatus(200);
    }
    next();
});

// Apply general rate limiting
app.use('/api', apiLimiter);

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        service: 'snowlion-doc-to-bom',
        timestamp: new Date().toISOString(),
        version: '1.0.0'
    });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/usage', usageRoutes);
app.use('/api/documents', documentsRoutes);
app.use('/api/feedback', feedbackRoutes);
app.use('/api/admin', adminRoutes);

// Root endpoint - service info
app.get('/', (req, res) => {
    res.json({
        service: 'Snowlion Document to BOM Converter',
        description: 'AI-powered document processing for Norwegian sub-contractors',
        version: '1.0.0',
        endpoints: {
            health: 'GET /health',
            auth: {
                signup: 'POST /api/auth/signup',
                verify: 'GET /api/auth/verify',
                login: 'POST /api/auth/login',
                loginComplete: 'GET /api/auth/login/complete',
                logout: 'POST /api/auth/logout',
                me: 'GET /api/auth/me'
            },
            documents: {
                upload: 'POST /api/documents/upload',
                process: 'POST /api/documents/process/:documentId',
                formats: 'GET /api/documents/formats'
            },
            usage: {
                stats: 'GET /api/usage/stats',
                history: 'GET /api/usage/history'
            },
            feedback: {
                submit: 'POST /api/feedback',
                prompts: 'GET /api/feedback/prompts',
                mine: 'GET /api/feedback/mine'
            }
        },
        documentation: 'https://github.com/simonpn/claude-automation-test'
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: 'Endpoint not found' });
});

// Error handler
app.use((err, req, res, next) => {
    console.error('Server error:', err);
    res.status(500).json({ error: 'Internal server error' });
});

// Graceful shutdown
function gracefulShutdown() {
    console.log('\nShutting down gracefully...');
    closeDb();
    process.exit(0);
}

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

// Initialize database and start server
function startServer() {
    // Ensure data directory exists
    const dataDir = './data';
    if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
    }

    // Initialize database
    try {
        initDatabase();
        console.log('Database initialized');
    } catch (error) {
        console.error('Database initialization failed:', error);
        process.exit(1);
    }

    // Start server
    app.listen(port, () => {
        console.log(`
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║   🦁 Snowlion Document to BOM Converter                   ║
║                                                           ║
║   Server running on http://localhost:${port}                 ║
║                                                           ║
║   Environment: ${process.env.NODE_ENV || 'development'}                            ║
║   Trial duration: ${process.env.TRIAL_DURATION_DAYS || 14} days                              ║
║   Weekly doc limit: ${process.env.WEEKLY_DOCUMENT_LIMIT || 10} documents                        ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
        `);
    });
}

// Run if called directly
if (require.main === module) {
    startServer();
}

module.exports = { app, startServer };
