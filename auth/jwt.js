const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const user = require('../models/user');
require('dotenv').config();
const {auth} = require('../firebase/firebase')
const secret = process.env.SECRET_KEY;



router.post('/', async (req, res) => {
    const { idToken } = req.body;
    console.log(idToken)
    if (!idToken) {
        return res.status(400).json({ error: 'Firebase ID token is required' });
    }

    try {
        // Verify the Firebase ID token
        const decodedToken = await auth.verifyIdToken(idToken.firebaseToken);
        const uid = decodedToken.uid;
        console.log(uid)
        // Check if the UID is in the allowed list in your database
        const allowedUser = await user.findOne({ where: { firebase_uid: uid } });
        console.log('Allowed user:', allowedUser);
        if (!allowedUser) {
            return res.status(403).json({ error: 'User not authorized' });
        }

        // If the user is authorized, create a JWT
        const payload = {
            user: {
                id: allowedUser.id,
                firebase_uid: uid
            }
        };

        jwt.sign(payload, secret, { expiresIn: '120h' }, (err, token) => {
            if (err) {
                console.error('Error creating JWT:', err);
                return res.status(500).json({ error: 'Error creating token' });
            }
            return res.json({ token });
        });

    } catch (error) {
        console.error('Error verifying Firebase ID token:', error);
        return res.status(401).json({ error: error.message });
    }
});

module.exports = router;