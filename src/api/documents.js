// Document processing API routes
const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const { requireAuth } = require('../middleware/auth');
const { documentLimiter } = require('../middleware/rateLimit');
const { canProcessDocument } = require('../services/usage');
const { logUsage } = require('../services/auth');

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = './data/uploads';
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueName = `${uuidv4()}${path.extname(file.originalname)}`;
        cb(null, uniqueName);
    }
});

const upload = multer({
    storage,
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB max
    },
    fileFilter: (req, file, cb) => {
        const allowedTypes = ['.pdf', '.docx', '.doc', '.xlsx', '.xls', '.csv'];
        const ext = path.extname(file.originalname).toLowerCase();
        if (allowedTypes.includes(ext)) {
            cb(null, true);
        } else {
            cb(new Error(`File type ${ext} not supported. Allowed: ${allowedTypes.join(', ')}`));
        }
    }
});

// POST /api/documents/upload - Upload document for BOM extraction
router.post('/upload', requireAuth, documentLimiter, upload.single('document'), async (req, res) => {
    try {
        // Check quota
        if (!canProcessDocument(req.user.userId)) {
            return res.status(429).json({
                error: 'Weekly document limit reached',
                message: 'You have reached your weekly document processing limit. Try again next week or contact us for extended access.'
            });
        }

        if (!req.file) {
            return res.status(400).json({ error: 'No document uploaded' });
        }

        const documentId = uuidv4();

        // Log the upload
        logUsage(req.user.userId, 'document_upload', 0, req.file.originalname);

        // TODO: Integrate with Azure OpenAI for actual BOM extraction
        // For now, return a placeholder response
        const mockBom = {
            documentId,
            originalFileName: req.file.originalname,
            status: 'processing',
            message: 'Document uploaded successfully. BOM extraction will be processed.',
            uploadedAt: new Date().toISOString(),
            // Placeholder BOM structure
            bom: null
        };

        res.status(202).json(mockBom);

    } catch (error) {
        console.error('Document upload error:', error);
        if (error.message.includes('File type')) {
            return res.status(400).json({ error: error.message });
        }
        res.status(500).json({ error: 'Failed to process document' });
    }
});

// POST /api/documents/process - Process document and generate BOM (placeholder)
router.post('/process/:documentId', requireAuth, documentLimiter, async (req, res) => {
    try {
        const { documentId } = req.params;

        // Check quota
        if (!canProcessDocument(req.user.userId)) {
            return res.status(429).json({
                error: 'Weekly document limit reached',
                message: 'You have reached your weekly document processing limit.'
            });
        }

        // TODO: Implement actual Azure OpenAI integration
        // This is a placeholder that simulates BOM generation

        // Simulate processing delay
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Mock BOM result
        const mockTokensUsed = Math.floor(Math.random() * 2000) + 500;

        // Log the BOM generation
        logUsage(req.user.userId, 'bom_generated', mockTokensUsed, `doc_${documentId}`);

        const bomResult = {
            documentId,
            status: 'completed',
            processedAt: new Date().toISOString(),
            tokensUsed: mockTokensUsed,
            bom: {
                title: 'Extracted Bill of Materials',
                generatedAt: new Date().toISOString(),
                items: [
                    { partNumber: 'PLH-001', description: 'Placeholder Item 1', quantity: 10, unit: 'pcs' },
                    { partNumber: 'PLH-002', description: 'Placeholder Item 2', quantity: 5, unit: 'pcs' },
                    { partNumber: 'PLH-003', description: 'Placeholder Item 3', quantity: 20, unit: 'm' }
                ],
                notes: 'This is a placeholder BOM. Azure OpenAI integration coming soon.'
            }
        };

        res.json(bomResult);

    } catch (error) {
        console.error('Document processing error:', error);
        res.status(500).json({ error: 'Failed to process document' });
    }
});

// GET /api/documents/formats - Get supported document formats
router.get('/formats', (req, res) => {
    res.json({
        supported: [
            { extension: '.pdf', description: 'PDF documents' },
            { extension: '.docx', description: 'Microsoft Word (2007+)' },
            { extension: '.doc', description: 'Microsoft Word (legacy)' },
            { extension: '.xlsx', description: 'Microsoft Excel (2007+)' },
            { extension: '.xls', description: 'Microsoft Excel (legacy)' },
            { extension: '.csv', description: 'Comma-separated values' }
        ],
        maxSize: '10MB'
    });
});

module.exports = router;
