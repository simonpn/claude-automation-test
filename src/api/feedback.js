// Feedback collection API routes
const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { getDb } = require('../db/connection');
const { requireAuth, optionalAuth } = require('../middleware/auth');
const { apiLimiter } = require('../middleware/rateLimit');

// POST /api/feedback - Submit feedback
router.post('/', optionalAuth, apiLimiter, (req, res) => {
    try {
        const { documentTypes, processIdeas, generalNotes, rating } = req.body;

        // Require at least one field
        if (!documentTypes && !processIdeas && !generalNotes && !rating) {
            return res.status(400).json({
                error: 'Please provide at least one feedback field',
                fields: ['documentTypes', 'processIdeas', 'generalNotes', 'rating']
            });
        }

        // Validate rating if provided
        if (rating !== undefined && (rating < 1 || rating > 5)) {
            return res.status(400).json({ error: 'Rating must be between 1 and 5' });
        }

        const db = getDb();
        const id = uuidv4();
        const userId = req.user?.userId || null;

        db.prepare(`
            INSERT INTO feedback (id, user_id, document_types, process_ideas, general_notes, rating)
            VALUES (?, ?, ?, ?, ?, ?)
        `).run(id, userId, documentTypes || null, processIdeas || null, generalNotes || null, rating || null);

        res.status(201).json({
            message: 'Thank you for your feedback!',
            feedbackId: id
        });

    } catch (error) {
        console.error('Feedback submission error:', error);
        res.status(500).json({ error: 'Failed to submit feedback' });
    }
});

// GET /api/feedback/prompts - Get feedback prompts (questions to ask)
router.get('/prompts', (req, res) => {
    res.json({
        prompts: [
            {
                field: 'documentTypes',
                question: 'Hvilke andre dokumenttyper ønsker du at AI skal kunne tolke automatisk?',
                questionEn: 'What other document types would you like AI to interpret automatically?',
                placeholder: 'F.eks. tekniske spesifikasjoner, kontrakter, sikkerhetsdatablader...'
            },
            {
                field: 'processIdeas',
                question: 'Hvilke andre prosesser tenker du at AI-agenter kan gjøre jobben lettere?',
                questionEn: 'What other processes do you think AI agents could help make easier?',
                placeholder: 'F.eks. rapportgenerering, kvalitetskontroll, dokumentsøk...'
            },
            {
                field: 'generalNotes',
                question: 'Andre tilbakemeldinger eller forslag?',
                questionEn: 'Any other feedback or suggestions?',
                placeholder: 'Vi setter pris på alle tilbakemeldinger...'
            },
            {
                field: 'rating',
                question: 'Hvor nyttig var dette verktøyet? (1-5)',
                questionEn: 'How useful was this tool? (1-5)',
                type: 'rating',
                min: 1,
                max: 5
            }
        ]
    });
});

// GET /api/feedback/mine - Get user's own feedback history
router.get('/mine', requireAuth, (req, res) => {
    try {
        const db = getDb();

        const feedback = db.prepare(`
            SELECT id, document_types, process_ideas, general_notes, rating, created_at
            FROM feedback
            WHERE user_id = ?
            ORDER BY created_at DESC
        `).all(req.user.userId);

        res.json({ feedback });

    } catch (error) {
        console.error('Feedback fetch error:', error);
        res.status(500).json({ error: 'Failed to get feedback' });
    }
});

module.exports = router;
