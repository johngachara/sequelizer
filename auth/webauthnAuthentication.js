const express = require('express');
const router = express.Router();
const { auth } = require('../firebase/firebase');
const { db } = require('../firebase/firebase');
const { generateAuthenticationOptions, verifyAuthenticationResponse } = require('@simplewebauthn/server');
const base64url = require('base64url');
const rpID = process.env.rpID;
const origin = process.env.origin;

exports.generateOptions = router.post('/api/generate-auth-options', async (req, res) => {
    const { idToken } = req.body;

    if (!idToken) {
        return res.status(400).json({ error: 'Missing Firebase ID token' });
    }

    try {
        const decodedToken = await auth.verifyIdToken(idToken);
        const uid = decodedToken.uid;

        const userRef = db.collection('users').doc(uid);
        const userDoc = await userRef.get();

        if (!userDoc.exists) {
            return res.status(404).json({ error: 'User not found' });
        }

        const userData = userDoc.data();
        const userPasskeys = userData.credentials || [];

        if (userPasskeys.length === 0) {
            return res.status(400).json({ error: 'No passkeys found for this user' });
        }

        const options = await generateAuthenticationOptions({
            rpID,
            allowCredentials: userPasskeys.map(passkey => ({
                id: passkey.id,
                type: 'public-key',
                transports: passkey.transports || [],
            })),
            userVerification: 'preferred',
        });

        const cleanOptions = JSON.parse(JSON.stringify(options));

        await userRef.update({
            currentAuthenticationOptions: cleanOptions
        });

        return res.json(options);

    } catch (error) {
        console.error('Error generating authentication options:', error);
        return res.status(500).json({ error: error.message });
    }
});

exports.verifyOptions = router.post('/api/verify-authentication', async (req, res) => {
    const { body } = req;

    if (!body.idToken || !body.id) {
        return res.status(400).json({ error: 'Missing Firebase ID token or passkey ID' });
    }

    try {


        const decodedToken = await auth.verifyIdToken(body.idToken);
        const uid = decodedToken.uid;

        const userRef = db.collection('users').doc(uid);
        const userDoc = await userRef.get();

        if (!userDoc.exists) {
            return res.status(404).json({ error: 'User not found' });
        }

        const userData = userDoc.data();
        const currentOptions = userData.currentAuthenticationOptions;

        if (!currentOptions?.challenge) {
            return res.status(400).json({ error: 'No saved authentication challenge' });
        }

        const passkey = (userData.credentials || []).find(p => p.id === body.id);

        if (!passkey) {
            return res.status(400).json({ error: 'No matching passkey found' });
        }


        let verification;
        try {
            const authenticationResponse = {
                id: body.id,
                rawId: body.rawId,
                response: body.response,
                type: body.type,
                clientExtensionResults: body.clientExtensionResults || {}
            };
            // Convert the stored public key back to the correct format
            const credential = {
                id: passkey.id,
                publicKey: base64url.toBuffer(passkey.publicKey),
                counter: passkey.counter || 0,
                transports: passkey.transports || []
            };


            verification = await verifyAuthenticationResponse({
                response: authenticationResponse,
                expectedChallenge: currentOptions.challenge,
                expectedOrigin: origin,
                expectedRPID: rpID,
                credential,
                requireUserVerification: false
            });
        } catch (error) {
            console.error('Verification failed:', {
                error: error.message,
                stack: error.stack
            });
            return res.status(400).json({
                error: 'Authentication verification failed',
                details: error.message
            });
        }

        if (verification.verified) {
            // Update counter
            const newCounter = verification.authenticationInfo.newCounter;
            const updatedPasskeys = userData.credentials.map(p =>
                p.id === passkey.id ? { ...p, counter: newCounter } : p
            );

            // Clear currentAuthenticationOptions after use
            await userRef.update({
                credentials: updatedPasskeys,
                currentAuthenticationOptions: null
            });

            // Create Firebase custom token
            const firebaseToken = await auth.createCustomToken(uid);

            return res.json({
                success: verification.verified,
                message: 'Authentication successful',
                firebaseToken
            });
        } else {
            return res.status(401).json({ error: 'Authentication not verified' });
        }

    } catch (error) {
        console.error('Error verifying authentication:', error);
        return res.status(500).json({ error: error.message });
    }
});