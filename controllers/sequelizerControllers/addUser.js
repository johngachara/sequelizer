const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const User = require('../../models/user');
const { body, validationResult } = require('express-validator');

router.post(
    '/',
    [
        body('username')
            .notEmpty().withMessage('Username is required')
            .isString().withMessage('Username must be a string'),
        body('password')
            .notEmpty().withMessage('Password is required')
            .isString().withMessage('Password must be a string'),
        body('password_confirmation')
            .notEmpty().withMessage('Please confirm your password')
            .isString().withMessage('Confirmation password must be a string'),
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { username, password, password_confirmation } = req.body;

        if (password !== password_confirmation) {
            return res.status(400).send('Passwords do not match');
        }

        try {
            const existingUser = await User.findOne({ where: { username:username } });
            if (existingUser) {
                return res.status(400).send('User already exists');
            }

            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(password, salt);

            const newUser = await User.create({
                username,
                password: hashedPassword,
            });

            res.status(201).json({ message: `${username} created successfully` });
        } catch (err) {
            res.status(500).send(err.message);
        }
    }
);

module.exports = router;