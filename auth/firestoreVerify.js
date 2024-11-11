const jwt = require('jsonwebtoken');
const {db,firebase} = require('../firebase/firebase')
require('dotenv').config();

const secret = process.env.SECRET_KEY;

module.exports = async function (req, res, next) {
    // Get the Authorization header
    const authHeader = req.header('Authorization');

    // Check if the Authorization header exists and starts with 'Bearer '
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ msg: 'No token, authorization denied' });
    }

    // Extract the token from the Authorization header
    const token = authHeader.split(' ')[1];

    try {
        // Verify the JWT token
        const decoded = jwt.verify(token, secret);

        // Extra security: Check if user still exists in Firestore
        const userRef = db.collection('users').doc(decoded.user.id);
        const userDoc = await userRef.get();

        if (!userDoc.exists) {
            return res.status(401).json({ msg: 'User no longer exists' });
        }

        const userData = userDoc.data();

        // Check if user is active/not disabled
        if (userData.disabled === true) {
            return res.status(403).json({ msg: 'User account is disabled' });
        }

        // Attach extended user information to the request object
        req.user = {
            ...decoded.user,
            role: userData.role,
            username: userData.username,
        };

       // Update last active timestamp
        await userRef.update({
            lastActive: firebase.firestore.FieldValue.serverTimestamp()
        }).catch(err => console.warn('Failed to update last active timestamp:', err));

        next();
    } catch (err) {
        console.error('Token verification error:', err);
        if (err.name === 'TokenExpiredError') {
            return res.status(401).json({ msg: 'Token has expired' });
        }
        return res.status(401).json({ msg: 'Token is not valid' });
    }
};