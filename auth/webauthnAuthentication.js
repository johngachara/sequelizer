const express = require('express');
const router = express.Router();
const { auth,db } = require('../firebase/firebase');
const { generateAuthenticationOptions, verifyAuthenticationResponse } = require('@simplewebauthn/server');
const base64url = require('base64url');
const rpID = process.env.rpID;
const crypto = require('crypto');
const origin = process.env.origin;
const admin = require('firebase-admin');
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
            authenticatorSelection: {
                userVerification: 'preferred',
            },
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
                requireUserPresence : true,
                requireUserVerification : false
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
            // Remember to remove this token when you find time you dont need it
            // Create Firebase custom token
         //   const firebaseToken = await auth.createCustomToken(uid);

            return res.json({
                success: verification.verified,
                message: 'Authentication successful',
            });
        } else {
            return res.status(401).json({ error: 'Authentication not verified' });
        }

    } catch (error) {
        console.error('Error verifying authentication:', error);
        return res.status(500).json({ error: error.message });
    }
});

exports.publicGenerateAuthOptions = router.post('/api/generate-auth-options-public', async (req, res) => {
    try {
        // Generate a random challenge
        const challenge = crypto.randomBytes(32).toString('base64');

        // Store the challenge temporarily in Firestore with TTL
        const challengeRef = await db.collection('challenges').add({
            challenge,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            expiresAt: new Date(Date.now() + 5 * 60 * 1000) // 5 minutes expiry
        });

        // Generate authentication options
        // Note: We're not providing allowCredentials since we don't know which user is authenticating
        const options = await generateAuthenticationOptions({
            rpID,
            challenge,
            userVerification: 'preferred',
            timeout: 60000,
        });
        // Store options ID for verification later
        await challengeRef.update({
            optionsId: challengeRef.id
        });

        res.status(200).json(options);
    } catch (error) {
        console.error('Error generating authentication options:', error);
        res.status(500).json({ success: false, message: 'Failed to generate authentication options' });
    }
})
exports.publicVerifyAuthOptions = router.post('/api/verify-auth-options-public', async (req, res) => {
    try {
        const { id, rawId, response, type, clientExtensionResults } = req.body;

        // 1. Use the credential ID to look up the user
        const credentialSnapshot = await db.collection('credentials')
            .where('credentialId', '==', id)
            .limit(1)
            .get();

        if (credentialSnapshot.empty) {
            return res.status(400).json({
                success: false,
                message: 'Unknown credential'
            });
        }

        // Get the user ID from the credential
        const credentialDoc = credentialSnapshot.docs[0];
        const { userId, credentialPublicKey, counter } = credentialDoc.data();

        // Get the user document
        const userDoc = await db.collection('users').doc(userId).get();
        if (!userDoc.exists) {
            return res.status(400).json({
                success: false,
                message: 'User not found'
            });
        }

        // Get the latest challenge
        const challengeSnapshot = await db.collection('challenges')
            .orderBy('createdAt', 'desc')
            .limit(1)
            .get();

        if (challengeSnapshot.empty) {
            return res.status(400).json({
                success: false,
                message: 'No valid challenge found'
            });
        }

        const challengeDoc = challengeSnapshot.docs[0];
        const { challenge, expiresAt } = challengeDoc.data();

        // Check if challenge has expired
        if (expiresAt.toDate() < new Date()) {
            return res.status(400).json({
                success: false,
                message: 'Challenge has expired, please try again'
            });
        }

        // Prepare verification data
        const expectedChallenge = challenge;
        const authenticator = {
            credentialID: Buffer.from(id, 'base64url'),
            credentialPublicKey: Buffer.from(credentialPublicKey, 'base64url'),
            counter,
        };

        // Verify the authentication response
        const verification = await verifyAuthenticationResponse({
            response: {
                id,
                rawId,
                response,
                type,
                clientExtensionResults
            },
            expectedChallenge,
            expectedOrigin: origin,
            expectedRPID: rpID,
            authenticator,
        });

        if (verification.verified) {
            // Update the counter
            await credentialDoc.ref.update({
                counter: verification.authenticationInfo.newCounter
            });

            // Create a Firebase custom token for this user
            const firebaseToken = await admin.auth().createCustomToken(userId);

            // Get basic user info to return
            const userInfo = {
                uid: userId,
                email: userDoc.data().email,
                displayName: userDoc.data().username
            };

            // Return success with token and user info
            res.status(200).json({
                success: true,
                message: 'Successfully authenticated',
                firebaseToken,
                userInfo
            });
        } else {
            res.status(400).json({
                success: false,
                message: 'Authentication failed'
            });
        }
    } catch (error) {
        console.error('Error verifying authentication:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error during verification'
        });
    }
})