// Database initialization script
const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

const DB_PATH = process.env.DATABASE_PATH || './data/snowlion.db';

function initDatabase() {
    // Ensure data directory exists
    const dataDir = path.dirname(DB_PATH);
    if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
        console.log(`Created data directory: ${dataDir}`);
    }

    // Connect to database
    const db = new Database(DB_PATH);
    console.log(`Connected to database: ${DB_PATH}`);

    // Enable foreign keys
    db.pragma('foreign_keys = ON');

    // Read and execute schema
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');

    db.exec(schema);
    console.log('Database schema initialized successfully');

    // Verify tables exist
    const tables = db.prepare(`
        SELECT name FROM sqlite_master
        WHERE type='table'
        ORDER BY name
    `).all();

    console.log('Tables created:', tables.map(t => t.name).join(', '));

    db.close();
    console.log('Database initialization complete');
}

// Run if called directly
if (require.main === module) {
    initDatabase();
}

module.exports = { initDatabase };
