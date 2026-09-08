const express = require('express');
const router = express.Router();
const db = require('../db');

// POST /api/enquiries - Public Contact Form
router.post('/enquiries', async (req, res) => {
    try {
        const { name, email, phone, message } = req.body;
        if (!name || !email || !message) {
            return res.status(400).json({ success: false, message: 'Name, email, and message are required' });
        }
        const result = await db.runAsync(`
            INSERT INTO enquiries (name, email, phone, message, status)
            VALUES (?, ?, ?, ?, 'NEW')
        `, [name, email, phone || '', message]);

        res.status(201).json({ success: true, message: 'Enquiry submitted successfully', id: result.lastID });
    } catch (err) {
        console.error('Enquiry error:', err);
        res.status(500).json({ success: false, message: 'Failed to submit enquiry' });
    }
});

// GET /api/reviews - Get public reviews
router.get('/reviews', async (req, res) => {
    try {
        const rows = await db.allAsync('SELECT * FROM reviews ORDER BY created_at DESC LIMIT 20');
        res.json({ success: true, reviews: rows || [] });
    } catch (err) {
        console.error('Fetch reviews error:', err);
        res.status(500).json({ success: false, message: 'Failed to fetch reviews' });
    }
});

// POST /api/feedback - Public Review Submission
router.post('/feedback', async (req, res) => {
    try {
        const { productId, name, rating, comment } = req.body;
        if (!name || !comment) {
            return res.status(400).json({ success: false, message: 'Name and comment are required' });
        }
        const result = await db.runAsync(`
            INSERT INTO reviews (product_id, user_name, rating, comment)
            VALUES (?, ?, ?, ?)
        `, [productId || 'general', name, parseInt(rating) || 5, comment]);

        res.status(201).json({ success: true, message: 'Review submitted successfully', id: result.lastID });
    } catch (err) {
        console.error('Feedback error:', err);
        res.status(500).json({ success: false, message: 'Failed to submit feedback' });
    }
});

// POST /api/cart - Add item to cart
router.post('/cart', async (req, res) => {
    try {
        const { customerEmail, customerName, customerPhone, productId, productName, productImage, weight, price, quantity } = req.body;
        if (!customerEmail || !productId || !productName || !price) {
            return res.status(400).json({ success: false, message: 'Customer email, product ID, name, and price are required' });
        }
        
        // Check if item with same email, productId, and weight already exists in cart
        const existing = await db.getAsync(
            'SELECT * FROM cart_items WHERE customer_email = ? AND product_id = ? AND weight = ?',
            [customerEmail, productId, weight || 'Standard']
        );

        if (existing) {
            const newQty = existing.quantity + (parseInt(quantity) || 1);
            await db.runAsync('UPDATE cart_items SET quantity = ? WHERE id = ?', [newQty, existing.id]);
            return res.json({ success: true, message: 'Cart item quantity updated', cartId: existing.id });
        }

        const result = await db.runAsync(`
            INSERT INTO cart_items (customer_email, customer_name, customer_phone, product_id, product_name, product_image, weight, price, quantity)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            customerEmail,
            customerName || 'Customer',
            customerPhone || '',
            productId,
            productName,
            productImage || 'images/healthy-mix.jpg',
            weight || 'Standard',
            parseFloat(price) || 0,
            parseInt(quantity) || 1
        ]);

        res.status(201).json({ success: true, message: 'Item added to cart', cartId: result.lastID });
    } catch (err) {
        console.error('Add to cart error:', err);
        res.status(500).json({ success: false, message: 'Failed to add item to cart' });
    }
});

// GET /api/cart - Get cart items for customer
router.get('/cart', async (req, res) => {
    try {
        const { email } = req.query;
        let query = 'SELECT * FROM cart_items ORDER BY created_at DESC';
        let params = [];
        if (email) {
            query = 'SELECT * FROM cart_items WHERE customer_email = ? ORDER BY created_at DESC';
            params = [email];
        }
        const rows = await db.allAsync(query, params);
        res.json({ success: true, cart: rows });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Failed to fetch cart' });
    }
});

// PUT /api/cart/:id - Update cart item quantity
router.put('/cart/:id', async (req, res) => {
    try {
        const { quantity } = req.body;
        const qty = parseInt(quantity);
        if (isNaN(qty) || qty <= 0) {
            await db.runAsync('DELETE FROM cart_items WHERE id = ?', [req.params.id]);
            return res.json({ success: true, message: 'Cart item removed' });
        }
        await db.runAsync('UPDATE cart_items SET quantity = ? WHERE id = ?', [qty, req.params.id]);
        res.json({ success: true, message: 'Cart updated' });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Failed to update cart' });
    }
});

// Handler for deleting cart items
async function handleCartDelete(req, res) {
    try {
        const id = req.params.id;
        const email = req.query.email || req.body?.email;
        const productId = req.query.productId || req.body?.productId;

        if (id) {
            await db.runAsync('DELETE FROM cart_items WHERE id = ?', [id]);
        } else if (email && productId) {
            await db.runAsync('DELETE FROM cart_items WHERE (customer_email = ? OR customer_email LIKE ?) AND product_id = ?', [email, email + '%', productId]);
        } else if (email) {
            await db.runAsync('DELETE FROM cart_items WHERE customer_email = ? OR customer_email LIKE ?', [email, email + '%']);
        } else if (productId) {
            await db.runAsync('DELETE FROM cart_items WHERE product_id = ?', [productId]);
        }

        res.json({ success: true, message: 'Cart updated successfully' });
    } catch (err) {
        console.error('Delete cart error:', err);
        res.status(500).json({ success: false, message: 'Failed to remove cart item' });
    }
}

router.delete('/cart', handleCartDelete);
router.delete('/cart/:id', handleCartDelete);

// POST /api/orders - Public Cart Checkout / Place Order
router.post('/orders', async (req, res) => {
    try {
        const { customerName, customerEmail, customerPhone, items, totalAmount, shippingAddress } = req.body;
        if (!customerName || !customerEmail || !items || !shippingAddress) {
            return res.status(400).json({ success: false, message: 'Name, email, cart items, and shipping address are required' });
        }
        const orderNumber = 'AHO-' + Math.floor(100000 + Math.random() * 900000);
        const itemsJson = typeof items === 'string' ? items : JSON.stringify(items);
        const result = await db.runAsync(`
            INSERT INTO orders (order_number, customer_name, customer_email, customer_phone, items_json, total_amount, shipping_address, status)
            VALUES (?, ?, ?, ?, ?, ?, ?, 'PENDING')
        `, [orderNumber, customerName.trim(), customerEmail.trim().toLowerCase(), customerPhone || '', itemsJson, parseFloat(totalAmount) || 0, shippingAddress]);

        const orderId = result.lastID;

        // Auto clean active cart for this customer
        await db.runAsync('DELETE FROM cart_items WHERE customer_email = ? OR customer_email LIKE ?', [customerEmail, customerEmail + '%']);

        // Auto remove ordered products from wishlist if present
        let parsedItems = [];
        try {
            parsedItems = typeof items === 'string' ? JSON.parse(items) : items;
        } catch (e) {
            parsedItems = [];
        }
        if (Array.isArray(parsedItems)) {
            for (const item of parsedItems) {
                const pId = item.id || item.productId;
                if (pId) {
                    await db.runAsync('DELETE FROM wishlist WHERE (customer_email = ? OR customer_email LIKE ?) AND product_id = ?', [customerEmail, customerEmail + '%', pId]);
                }
            }
        }

        const newOrder = await db.getAsync('SELECT * FROM orders WHERE id = ?', [orderId]);

        res.status(201).json({
            success: true,
            message: 'Order placed successfully! Waiting for confirmation from the admin.',
            orderId: orderId,
            orderNumber: orderNumber,
            order: newOrder ? {
                id: newOrder.id,
                orderNumber: newOrder.order_number,
                customerName: newOrder.customer_name,
                customerEmail: newOrder.customer_email,
                customerPhone: newOrder.customer_phone,
                items: parsedItems,
                totalAmount: newOrder.total_amount,
                shippingAddress: newOrder.shipping_address,
                status: newOrder.status || 'PENDING',
                createdAt: newOrder.created_at
            } : null
        });
    } catch (err) {
        console.error('Order placement error:', err);
        res.status(500).json({ success: false, message: 'Failed to place order: ' + err.message });
    }
});

// GET /api/orders - Customer Fetch Orders (by email / phone)
router.get('/orders', async (req, res) => {
    try {
        const { email, phone } = req.query;
        let query = 'SELECT * FROM orders ORDER BY created_at DESC';
        let params = [];

        if (email) {
            const cleanEmail = email.trim().toLowerCase();
            query = 'SELECT * FROM orders WHERE LOWER(customer_email) = ? OR customer_email LIKE ? ORDER BY created_at DESC';
            params = [cleanEmail, cleanEmail + '%'];
        } else if (phone) {
            query = 'SELECT * FROM orders WHERE customer_phone = ? ORDER BY created_at DESC';
            params = [phone.trim()];
        }

        const rows = await db.allAsync(query, params);
        const formattedOrders = rows.map(row => {
            let items = [];
            if (row.items_json) {
                try {
                    items = JSON.parse(row.items_json);
                } catch (e) {
                    items = [];
                }
            }
            return {
                id: row.id,
                orderNumber: row.order_number,
                customerName: row.customer_name,
                customerEmail: row.customer_email,
                customerPhone: row.customer_phone,
                items: items,
                totalAmount: row.total_amount,
                shippingAddress: row.shipping_address,
                status: row.status || 'PENDING',
                createdAt: row.created_at
            };
        });

        res.json({ success: true, orders: formattedOrders });
    } catch (err) {
        console.error('Fetch customer orders error:', err);
        res.status(500).json({ success: false, message: 'Failed to fetch orders' });
    }
});

// POST /api/wishlist - Public Add to Wishlist
router.post('/wishlist', async (req, res) => {
    try {
        const { customerEmail, customerName, productId, productName, productPrice, productImage } = req.body;
        if (!customerEmail || !productId || !productName) {
            return res.status(400).json({ success: false, message: 'Email, product ID, and product name are required' });
        }

        // Avoid duplicate wishlist item for same email & product
        const existing = await db.getAsync(
            'SELECT id FROM wishlist WHERE (customer_email = ? OR customer_email LIKE ?) AND product_id = ?',
            [customerEmail, customerEmail + '%', productId]
        );
        if (existing) {
            return res.json({ success: true, message: 'Item already in wishlist', id: existing.id });
        }

        const result = await db.runAsync(`
            INSERT INTO wishlist (customer_email, customer_name, product_id, product_name, product_price, product_image)
            VALUES (?, ?, ?, ?, ?, ?)
        `, [customerEmail, customerName || 'Shopper', productId, productName, parseFloat(productPrice) || 0, productImage || 'images/healthy-mix.jpg']);

        res.status(201).json({ success: true, message: 'Product added to wishlist', id: result.lastID });
    } catch (err) {
        console.error('Wishlist error:', err);
        res.status(500).json({ success: false, message: 'Failed to add to wishlist' });
    }
});

// GET /api/wishlist - Public Get Wishlist
router.get('/wishlist', async (req, res) => {
    try {
        const { email } = req.query;
        let query = 'SELECT * FROM wishlist ORDER BY created_at DESC';
        let params = [];
        if (email) {
            query = 'SELECT * FROM wishlist WHERE customer_email = ? OR customer_email LIKE ? ORDER BY created_at DESC';
            params = [email, email + '%'];
        }
        const rows = await db.allAsync(query, params);
        res.json({ success: true, wishlist: rows });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Failed to fetch wishlist' });
    }
});

// Handler for deleting wishlist items
async function handleWishlistDelete(req, res) {
    try {
        const id = req.params.id;
        const email = req.query.email || req.body?.email;
        const productId = req.query.productId || req.body?.productId;

        if (id) {
            await db.runAsync('DELETE FROM wishlist WHERE id = ?', [id]);
        } else if (email && productId) {
            await db.runAsync('DELETE FROM wishlist WHERE (customer_email = ? OR customer_email LIKE ?) AND product_id = ?', [email, email + '%', productId]);
        } else if (email) {
            await db.runAsync('DELETE FROM wishlist WHERE customer_email = ? OR customer_email LIKE ?', [email, email + '%']);
        } else if (productId) {
            await db.runAsync('DELETE FROM wishlist WHERE product_id = ?', [productId]);
        }
        res.json({ success: true, message: 'Wishlist item removed' });
    } catch (err) {
        console.error('Delete wishlist error:', err);
        res.status(500).json({ success: false, message: 'Failed to delete wishlist item' });
    }
}

router.delete('/wishlist', handleWishlistDelete);
router.delete('/wishlist/:id', handleWishlistDelete);

// POST /api/addresses - Public Save Address
router.post('/addresses', async (req, res) => {
    try {
        const { customerName, customerEmail, customerPhone, streetAddress, city, state, pincode, addressType } = req.body;
        if (!customerName || !customerEmail || !streetAddress || !city || !pincode) {
            return res.status(400).json({ success: false, message: 'Name, email, street address, city, and pincode are required' });
        }
        const result = await db.runAsync(`
            INSERT INTO addresses (customer_name, customer_email, customer_phone, street_address, city, state, pincode, address_type)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `, [customerName, customerEmail, customerPhone || '', streetAddress, city, state || 'Tamil Nadu', pincode, addressType || 'Home']);

        res.status(201).json({ success: true, message: 'Address saved successfully', id: result.lastID });
    } catch (err) {
        console.error('Address error:', err);
        res.status(500).json({ success: false, message: 'Failed to save address' });
    }
});

module.exports = router;
