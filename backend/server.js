require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
require('./db'); // Initializes MySQL DB

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Ensure uploads folder exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// Serve uploaded images
app.use('/uploads', express.static(uploadsDir));

// API Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/products', require('./routes/products'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api', require('./routes/public'));

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ status: 'UP', timestamp: new Date().toISOString(), service: 'Anuradha Organics Node/Express API' });
});

// Serve frontend static files
const frontendDir = path.join(__dirname, '../frontend');
app.use(express.static(frontendDir));

// Fallback to frontend index for direct browser navigation
app.use((req, res) => {
    if (req.path.startsWith('/api/')) {
        return res.status(404).json({ success: false, message: 'API route not found' });
    }
    const filePath = path.join(frontendDir, req.path);
    if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
        return res.sendFile(filePath);
    }
    res.sendFile(path.join(frontendDir, 'index.html'));
});

// Start Server
app.listen(PORT, () => {
    console.log(`==================================================`);
    console.log(`🌱 Anuradha Homemade Organics Backend is running!`);
    console.log(`🚀 Server URL: http://localhost:${PORT}`);
    console.log(`📊 Admin Panel: http://localhost:${PORT}/admin/dashboard.html`);
    console.log(`🛍️ Storefront:  http://localhost:${PORT}/shop.html`);
    console.log(`==================================================`);
});

module.exports = app;
