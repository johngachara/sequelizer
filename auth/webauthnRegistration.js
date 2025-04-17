const express = require('express');
const router = express.Router();
const { auth } = require('../firebase/firebase');
const { db } = require('../firebase/firebase');
const { generateRegistrationOptions, verifyRegistrationResponse} = require('@simplewebauthn/server');
const { isoUint8Array } = require('@simplewebauthn/server/helpers');
/**
 * Human-readable title for the website
 */
const rpName = 'Alltech';
/**
 * A unique identifier for the website. 'localhost' is okay for
 * local dev
 */
const rpID = process.env.rpID;
/**
 * The URL at which registrations and authentications should occur.
 * 'http://localhost' and 'http://localhost:PORT' are also valid.
 * Do NOT include any trailing /
 */
const origin = process.env.origin;
exports.register = router.post('/api/generate-registration-options', async (req, res) => {
    const { idToken } = req.body;

    if (!idToken) {
        return res.status(400).json({ error: 'Firebase ID token is required' });
    }

    try {
        // Verify Firebase user
        const decodedToken = await auth.verifyIdToken(idToken);
        const uid = decodedToken.uid;
        // Fetch user from Firestore
        const userRef = db.collection('users').doc(uid);
        const userDoc = await userRef.get();

        if (!userDoc.exists) {
            return res.status(404).json({ error: 'User not found' });
        }

        const userData = userDoc.data();
        const userPasskeys = userData.credentials || []; // Default to empty array if none exist

        // Generate WebAuthn registration options
        const options = await generateRegistrationOptions({
            rpName,
            rpID,
            userID: isoUint8Array.fromUTF8String(uid),
            userName: userData.username,
            attestationType: 'none', // No need for device attestation
            excludeCredentials: userPasskeys.map(passkey => ({
                id: passkey.id,
                transports: passkey.transports || [],
            })),
            authenticatorSelection: {
                residentKey: 'preferred',
                userVerification: 'discouraged',
                authenticatorAttachment: 'platform',
            },
            preferredAuthenticatorType: 'localDevice',

        });

        // Store these options temporarily
        await userRef.update({ currentRegistrationOptions: options });

        return res.json(options);

    } catch (error) {
        console.error('Error generating registration options:', error);
        return res.status(500).json({ error: error.message });
    }
});
exports.verify = router.post('/api/verify-registration', async (req, res) => {
    const { idToken, response } = req.body;

    if (!idToken || !response) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    try {
        //  Verify Firebase User
        const decodedToken = await auth.verifyIdToken(idToken);
        const uid = decodedToken.uid;

        //  Get User & Saved Challenge from Firestore
        const userRef = db.collection('users').doc(uid);
        const userDoc = await userRef.get();

        if (!userDoc.exists) {
            return res.status(404).json({ error: 'User not found' });
        }

        const userData = userDoc.data();
        const currentOptions = userData.currentRegistrationOptions;

        if (!currentOptions || !currentOptions.challenge) {
            return res.status(400).json({ error: 'No saved challenge found' });
        }

        //  Verify Registration Response
        let verification;
        try {
            verification = await verifyRegistrationResponse({
                response,
                expectedChallenge: currentOptions.challenge,
                expectedOrigin: origin,
                expectedRPID: rpID,
               // requireUserPresence : true,
             //   requireUserVerification : true
            });
        } catch (error) {
            console.error('Verification failed:', error);
            return res.status(400).json({ error: error.message });
        }

        const { verified, registrationInfo } = verification;

        if (!verified) {
            return res.status(400).json({ error: 'Verification failed' });
        }

        //  Extract Passkey Details
        const {
            credential,
            credentialDeviceType,
            credentialBackedUp,
        } = registrationInfo;

        const newPasskey = {
            webAuthnUserID: currentOptions.user.id,
            id: credential.id,
            publicKey: Buffer.from(credential.publicKey).toString('base64url'), // Encode the public key
            counter: credential.counter || 0, // Ensure counter is initialized
            transports: credential.transports || [], // Default to empty array
            deviceType: credentialDeviceType,
            backedUp: credentialBackedUp,
        };

        // Store Passkey in Firestore
        const updatedPasskeys = userData.credentials ? [...userData.credentials, newPasskey] : [newPasskey];

        await userRef.update({
            credentials: updatedPasskeys,
            currentRegistrationOptions: null, // Clear saved challenge
        });

        return res.json({ success: verified , message: 'Passkey registered successfully' });

    } catch (error) {
        console.error('Error verifying registration:', error);
        return res.status(500).json({ error: error.message });
    }
});
