const jwt = require('jsonwebtoken');
const secret = process.env.SECRET_KEY;

const verifyCeleryToken = (req, res, next) => {
    const token = req.header('celery-auth-token');

    if (!token) {
        return res.status(401).json({ error: 'No token, authorization denied' });
    }

    try {
        const decoded = jwt.verify(token, secret);

        if (!decoded.is_celery) {
            return res.status(401).json({ error: 'Invalid token, not a Celery token' });
        }

        req.celery = true;
        next();
    } catch (err) {
        res.status(401).json({ error: 'Token is not valid' });
    }
};

module.exports = verifyCeleryToken;