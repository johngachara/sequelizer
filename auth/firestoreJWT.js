const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { auth } = require('../firebase/firebase');
const {db} = require('../firebase/firebase')
require('dotenv').config();

const secret = process.env.SECRET_KEY;

router.post('/', async (req, res) => {
    const { idToken } = req.body;
    if (!idToken) {
        return res.status(400).json({ error: 'Firebase ID token is required' });
    }

    try {
        // Verify the Firebase ID token
        const decodedToken = await auth.verifyIdToken(idToken);
        const uid = decodedToken.uid;

        // Check if the user exists in Firestore users collection
        const userRef = db.collection('users').doc(uid);
        const userDoc = await userRef.get();

        if (!userDoc.exists) {
            return res.status(403).json({ error: 'User not authorized' });
        }

        // Get user data
        const userData = userDoc.data();

        // Create JWT payload
        const payload = {
            user: {
                id: uid,  // Using Firebase UID as the main identifier
                username: userData.username,
                role: userData.role // If you store roles in your users collection
            }
        };

        // Sign JWT
        jwt.sign(payload, secret, { expiresIn: '30h' }, (err, token) => {
            if (err) {
                console.error('Error creating JWT:', err);
                return res.status(500).json({ error: 'Error creating token' });
            }
            return res.json({
                token,
                user: {
                    id: uid,
                    username: userData.username,
                    role: userData.role,
                }
            });
        });

    } catch (error) {
        console.error('Error in authentication:', error);
        return res.status(401).json({ error: error.message });
    }
});
module.exports =  router