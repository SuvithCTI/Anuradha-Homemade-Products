const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');
const { JWT_SECRET, authenticateToken } = require('../middleware/auth');

// POST /api/auth/login
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ success: false, message: 'Email and password are required' });
        }

        const cleanEmail = email.trim().toLowerCase();
        let query = 'SELECT * FROM users WHERE LOWER(email) = ?';
        let params = [cleanEmail];

        // Also allow username "admin" shortcut
        if (cleanEmail === 'admin') {
            query = 'SELECT * FROM users WHERE LOWER(email) = ? OR role = ?';
            params = ['admin@anuradhaorganics.com', 'ADMIN'];
        }

        const user = await db.getAsync(query, params);

        if (!user) {
            return res.status(401).json({ success: false, message: 'Invalid email or password' });
        }

        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) {
            return res.status(401).json({ success: false, message: 'Invalid email or password' });
        }

        const token = jwt.sign(
            { id: user.id, email: user.email, role: user.role, firstName: user.first_name, lastName: user.last_name },
            JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.json({
            success: true,
            message: 'Login successful',
            token: token,
            user: {
                id: user.id,
                email: user.email,
                firstName: user.first_name,
                lastName: user.last_name,
                phone: user.phone,
                role: user.role
            }
        });
    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ success: false, message: 'Internal server error during login' });
    }
});

// POST /api/auth/register
router.post('/register', async (req, res) => {
    try {
        const { email, password, firstName, lastName, first_name, last_name, phone } = req.body;
        if (!email || !password) {
            return res.status(400).json({ success: false, message: 'Email and password are required' });
        }

        const cleanEmail = email.trim().toLowerCase();
        const existing = await db.getAsync('SELECT id FROM users WHERE LOWER(email) = ?', [cleanEmail]);
        if (existing) {
            return res.status(409).json({ success: false, message: 'Account with this email already exists' });
        }

        const fName = (firstName || first_name || '').trim();
        const lName = (lastName || last_name || '').trim();
        const userPhone = (phone || '').trim();

        const hashedPassword = await bcrypt.hash(password, 10);
        const result = await db.runAsync(`
            INSERT INTO users (email, password_hash, first_name, last_name, phone, role)
            VALUES (?, ?, ?, ?, ?, 'CUSTOMER')
        `, [cleanEmail, hashedPassword, fName, lName, userPhone]);

        const userId = result.lastID;
        const token = jwt.sign(
            { id: userId, email: cleanEmail, role: 'CUSTOMER', firstName: fName, lastName: lName },
            JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.status(201).json({
            success: true,
            message: 'Account registered successfully',
            token: token,
            user: {
                id: userId,
                email: cleanEmail,
                firstName: fName,
                lastName: lName,
                phone: userPhone,
                role: 'CUSTOMER'
            }
        });
    } catch (err) {
        console.error('Registration error:', err);
        res.status(500).json({ success: false, message: 'Internal server error during registration' });
    }
});

// GET /api/auth/me
router.get('/me', authenticateToken, async (req, res) => {
    try {
        const user = await db.getAsync('SELECT id, email, first_name as firstName, last_name as lastName, phone, role, created_at as createdAt FROM users WHERE id = ?', [req.user.id]);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        res.json({ success: true, user });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Failed to fetch user profile' });
    }
});

// PUT /api/auth/profile - Update Customer Profile
router.put('/profile', authenticateToken, async (req, res) => {
    try {
        const { firstName, lastName, first_name, last_name, phone } = req.body;
        const fName = firstName !== undefined ? firstName : first_name;
        const lName = lastName !== undefined ? lastName : last_name;

        const current = await db.getAsync('SELECT * FROM users WHERE id = ?', [req.user.id]);
        if (!current) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        const newFirstName = fName !== undefined ? fName : current.first_name;
        const newLastName = lName !== undefined ? lName : current.last_name;
        const newPhone = phone !== undefined ? phone : current.phone;

        await db.runAsync(
            'UPDATE users SET first_name = ?, last_name = ?, phone = ? WHERE id = ?',
            [newFirstName, newLastName, newPhone, req.user.id]
        );
        const user = await db.getAsync(
            'SELECT id, email, first_name as firstName, last_name as lastName, phone, role, created_at as createdAt FROM users WHERE id = ?',
            [req.user.id]
        );
        res.json({
            success: true,
            message: 'Profile updated successfully',
            user
        });
    } catch (err) {
        console.error('Update profile error:', err);
        res.status(500).json({ success: false, message: 'Failed to update profile' });
    }
});

module.exports = router;
