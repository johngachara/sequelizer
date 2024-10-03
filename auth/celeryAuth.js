const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
require('dotenv').config();

const secret = process.env.SECRET_KEY;
const celeryApiKey = process.env.CELERY_API_KEY;

// Validation middleware
const validateCeleryToken = [
    body('api_key')
        .notEmpty().withMessage('API key is required')
        .isString().withMessage('API key must be a string')
];

router.post('/', validateCeleryToken, (req, res) => {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { api_key } = req.body;

    // Check if the provided API key matches the Celery API key
    if (api_key !== celeryApiKey) {
        console.error('Invalid Celery API key');
        return res.status(403).json({ error: 'Invalid API key' });
    }

    try {
        // Create a JWT for Celery
        const payload = {
            is_celery: true,
        };

        jwt.sign(payload, secret, { expiresIn: '1h' }, (err, token) => {
            if (err) {
                console.error('Error creating JWT:', err);
                return res.status(500).json({ error: 'Error creating token' });
            }
            return res.json({ token });
        });
    } catch (error) {
        console.error('Error in Celery authentication:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;