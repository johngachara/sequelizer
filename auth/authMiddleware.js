const jwt = require('jsonwebtoken');
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
        // Verify the token
        const decoded = jwt.verify(token, secret);

        // Attach the user information to the request object
        req.user = decoded.user;

        // If the user is authenticated, proceed to the next middleware
        next();
    } catch (err) {
        console.error('Token verification error:', err.message);
        return res.status(401).json({ msg: 'Token is not valid' });
    }
};