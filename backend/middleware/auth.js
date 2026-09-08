const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'aho_super_secret_jwt_key_2026';

function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
        return res.status(401).json({ success: false, message: 'Access token required' });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ success: false, message: 'Invalid or expired token' });
        }
        req.user = user;
        next();
    });
}

function requireAdmin(req, res, next) {
    if (!req.user || req.user.role !== 'ADMIN') {
        return res.status(403).json({ success: false, message: 'Admin access required' });
    }
    next();
}

module.exports = {
    JWT_SECRET,
    authenticateToken,
    requireAdmin
};
