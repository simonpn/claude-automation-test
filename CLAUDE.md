# Project Context for Claude

Snowlion - Document to BOM Converter for Norwegian sub-contractors.

## Project Structure

```
src/
├── index.js              # Main entry point, Express server
├── api/                  # API route handlers
│   ├── auth.js           # Authentication endpoints
│   ├── usage.js          # Usage stats endpoints
│   ├── documents.js      # Document upload/processing
│   ├── feedback.js       # Feedback collection
│   └── admin.js          # Admin endpoints
├── db/                   # Database layer
│   ├── schema.sql        # SQLite schema
│   ├── init.js           # DB initialization
│   └── connection.js     # DB connection singleton
├── middleware/           # Express middleware
│   ├── auth.js           # Auth middleware
│   └── rateLimit.js      # Rate limiting
├── services/             # Business logic
│   ├── auth.js           # Auth service
│   └── usage.js          # Usage tracking
└── utils/                # Utility functions
```

## Tech Stack

- Node.js 20+ with Express
- SQLite (better-sqlite3) for database
- Multer for file uploads
- Azure OpenAI for document processing (TODO)

## Running the App

```bash
npm install
npm start           # Production
npm run dev         # Development with watch
npm run db:init     # Initialize database only
```

## Guidelines

- Use plain JavaScript (ES6+)
- Keep code simple and readable
- Add comments for complex logic
- All API routes under `/api/`
- Authentication via Bearer token

## Environment Variables

See `.env.example` for all configuration options.

## When creating PRs

- Reference the issue with "Closes #XXX"
- Include a clear description of changes
