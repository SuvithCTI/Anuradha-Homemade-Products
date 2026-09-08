const express = require('express');
const router = express.Router();
const path = require('path');
const multer = require('multer');
const db = require('../db');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

// Multer storage for uploaded product images
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join(__dirname, '../uploads'));
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, 'prod_' + uniqueSuffix + ext);
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

// Helper to normalize product format
function formatProduct(row) {
    let sizes = [];
    if (row.sizes_json) {
        try {
            sizes = JSON.parse(row.sizes_json);
        } catch (e) {
            sizes = [{ weight: 'Standard', price: row.price }];
        }
    } else {
        sizes = [{ weight: 'Standard', price: row.price }];
    }

    let benefits = [];
    if (row.benefits) {
        try {
            benefits = row.benefits.startsWith('[') ? JSON.parse(row.benefits) : row.benefits.split(',').map(b => b.trim());
        } catch (e) {
            benefits = [row.benefits];
        }
    }

    return {
        id: row.id,
        name: row.name,
        category: row.category,
        price: row.price,
        rating: row.rating,
        reviewsCount: row.reviews_count,
        image: row.image,
        description: row.description,
        ingredients: row.ingredients,
        benefits: benefits,
        sizes: sizes,
        sizesJson: row.sizes_json,
        inStock: row.in_stock === 1,
        featured: row.featured === 1,
        createdAt: row.created_at
    };
}

// GET /api/products - Get all products
router.get('/', async (req, res) => {
    try {
        const rows = await db.allAsync('SELECT * FROM products ORDER BY created_at DESC');
        res.json(rows.map(formatProduct));
    } catch (err) {
        console.error('Error fetching products:', err);
        res.status(500).json({ success: false, message: 'Failed to fetch products' });
    }
});

// GET /api/products/:id - Get single product
router.get('/:id', async (req, res) => {
    try {
        const row = await db.getAsync('SELECT * FROM products WHERE id = ?', [req.params.id]);
        if (!row) {
            return res.status(404).json({ success: false, message: 'Product not found' });
        }
        res.json(formatProduct(row));
    } catch (err) {
        res.status(500).json({ success: false, message: 'Failed to fetch product' });
    }
});

// POST /api/products/upload - Admin image upload
router.post('/upload', authenticateToken, requireAdmin, upload.single('image'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ success: false, message: 'No image file uploaded' });
    }
    const relativePath = 'uploads/' + req.file.filename;
    res.json({
        success: true,
        message: 'Image uploaded successfully',
        imageUrl: relativePath
    });
});

// POST /api/products - Admin create product
router.post('/', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { name, category, price, rating, reviewsCount, image, description, ingredients, benefits, sizes, sizesJson, inStock, featured } = req.body;

        if (!name || !category || price === undefined) {
            return res.status(400).json({ success: false, message: 'Name, category, and price are required' });
        }

        // Generate unique id
        const id = req.body.id || name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') + '-' + Date.now().toString().slice(-4);
        
        let sizesToSave = sizesJson;
        if (!sizesToSave && Array.isArray(sizes)) {
            sizesToSave = JSON.stringify(sizes);
        } else if (!sizesToSave) {
            sizesToSave = JSON.stringify([{ weight: 'Standard', price: parseFloat(price) }]);
        }

        let benefitsToSave = typeof benefits === 'object' ? JSON.stringify(benefits) : (benefits || '');

        await db.runAsync(`
            INSERT INTO products (id, name, category, price, rating, reviews_count, image, description, ingredients, benefits, sizes_json, in_stock, featured)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            id,
            name,
            category,
            parseFloat(price) || 0,
            parseFloat(rating) || 5.0,
            parseInt(reviewsCount) || 0,
            image || 'images/healthy-mix.jpg',
            description || '',
            ingredients || '',
            benefitsToSave,
            sizesToSave,
            (inStock === true || inStock === 1 || inStock === '1' || inStock === 'true' || inStock === undefined) ? 1 : 0,
            featured ? 1 : 0
        ]);

        const newRow = await db.getAsync('SELECT * FROM products WHERE id = ?', [id]);
        res.status(201).json({
            success: true,
            message: 'Product created successfully',
            product: formatProduct(newRow)
        });
    } catch (err) {
        console.error('Error creating product:', err);
        res.status(500).json({ success: false, message: 'Failed to create product: ' + err.message });
    }
});

// PUT /api/products/:id - Admin update product
router.put('/:id', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { name, category, price, rating, reviewsCount, image, description, ingredients, benefits, sizes, sizesJson, inStock, featured } = req.body;
        const id = req.params.id;

        const existing = await db.getAsync('SELECT * FROM products WHERE id = ?', [id]);
        if (!existing) {
            return res.status(404).json({ success: false, message: 'Product not found' });
        }

        let sizesToSave = sizesJson;
        if (!sizesToSave && Array.isArray(sizes) && sizes.length > 0) {
            sizesToSave = JSON.stringify(sizes);
        } else if (!sizesToSave) {
            sizesToSave = existing.sizes_json;
        }

        let benefitsToSave;
        if (Array.isArray(benefits)) {
            benefitsToSave = JSON.stringify(benefits);
        } else if (typeof benefits === 'string') {
            benefitsToSave = benefits;
        } else {
            benefitsToSave = existing.benefits;
        }

        const newName = name !== undefined ? name : existing.name;
        const newCategory = category !== undefined ? category : existing.category;
        const newPrice = price !== undefined && !isNaN(parseFloat(price)) ? parseFloat(price) : existing.price;
        const newImage = image !== undefined && image ? image : existing.image;
        const newDesc = description !== undefined ? description : (existing.description || '');
        const newIngredients = ingredients !== undefined ? ingredients : (existing.ingredients || '');
        const newInStock = inStock !== undefined 
            ? (inStock === true || inStock === 1 || inStock === '1' || inStock === 'true' ? 1 : 0) 
            : existing.in_stock;
        const newFeatured = featured !== undefined ? (featured ? 1 : 0) : existing.featured;

        await db.runAsync(`
            UPDATE products SET
                name = ?,
                category = ?,
                price = ?,
                image = ?,
                description = ?,
                ingredients = ?,
                benefits = ?,
                sizes_json = ?,
                in_stock = ?,
                featured = ?
            WHERE id = ?
        `, [
            newName,
            newCategory,
            newPrice,
            newImage,
            newDesc,
            newIngredients,
            benefitsToSave,
            sizesToSave,
            newInStock,
            newFeatured,
            id
        ]);

        const updatedRow = await db.getAsync('SELECT * FROM products WHERE id = ?', [id]);
        res.json({
            success: true,
            message: 'Product updated successfully',
            product: formatProduct(updatedRow)
        });
    } catch (err) {
        console.error('Error updating product:', err);
        res.status(500).json({ success: false, message: 'Failed to update product: ' + err.message });
    }
});

// DELETE /api/products/:id - Admin delete product
router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const id = req.params.id;
        const result = await db.runAsync('DELETE FROM products WHERE id = ?', [id]);
        if (result.changes === 0) {
            return res.status(404).json({ success: false, message: 'Product not found' });
        }
        res.json({ success: true, message: 'Product deleted successfully' });
    } catch (err) {
        console.error('Error deleting product:', err);
        res.status(500).json({ success: false, message: 'Failed to delete product' });
    }
});

module.exports = router;
