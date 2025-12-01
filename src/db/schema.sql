-- Snowlion Database Schema
-- SQLite implementation

-- Users table (also serves as lead capture)
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    company_name TEXT,
    industry TEXT CHECK(industry IN ('energy', 'defence', 'shipbuilding', 'datacenter', 'other')),
    company_size TEXT CHECK(company_size IN ('small', 'medium', 'large')),  -- small: <50, medium: 50-200, large: >200
    created_at TEXT DEFAULT (datetime('now')),
    trial_ends_at TEXT,
    is_active INTEGER DEFAULT 1,
    email_verified INTEGER DEFAULT 0,
    verification_token TEXT,
    verification_expires_at TEXT
);

-- Usage logs for tracking document processing and costs
CREATE TABLE IF NOT EXISTS usage_logs (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    action TEXT NOT NULL CHECK(action IN ('document_upload', 'bom_generated', 'login')),
    tokens_used INTEGER DEFAULT 0,
    document_name TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Feedback collection for product development
CREATE TABLE IF NOT EXISTS feedback (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    document_types TEXT,      -- What other docs would you like processed?
    process_ideas TEXT,       -- What other processes could AI help with?
    general_notes TEXT,
    rating INTEGER CHECK(rating >= 1 AND rating <= 5),
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Sessions for simple token-based auth
CREATE TABLE IF NOT EXISTS sessions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    token TEXT UNIQUE NOT NULL,
    expires_at TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_usage_user_id ON usage_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_usage_created_at ON usage_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token);
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
