const express = require('express');
const router = express.Router();
const db = require('../db');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

// Apply admin protection to all routes in this router
router.use(authenticateToken, requireAdmin);

// GET /api/admin/stats - Overview Dashboard Counters
router.get('/stats', async (req, res) => {
    try {
        const [products, customers, enquiries, reviews, orders, cartItems, wishlists, addresses, orderRows] = await Promise.all([
            db.getAsync('SELECT COUNT(*) as total, SUM(CASE WHEN in_stock = 1 THEN 1 ELSE 0 END) as inStock FROM products'),
            db.getAsync('SELECT COUNT(*) as total FROM users WHERE role = "CUSTOMER"'),
            db.getAsync('SELECT COUNT(*) as total, SUM(CASE WHEN status = "NEW" THEN 1 ELSE 0 END) as newCount FROM enquiries'),
            db.getAsync('SELECT COUNT(*) as total, AVG(rating) as avgRating FROM reviews'),
            db.getAsync('SELECT COUNT(*) as total, SUM(CASE WHEN status = "PENDING" THEN 1 ELSE 0 END) as pendingCount FROM orders'),
            db.getAsync('SELECT COUNT(*) as total FROM cart_items'),
            db.getAsync('SELECT COUNT(*) as total FROM wishlist'),
            db.getAsync('SELECT COUNT(*) as total FROM addresses'),
            db.allAsync('SELECT items_json, total_amount, status FROM orders')
        ]);

        let totalProductsSold = 0;
        let totalRevenue = 0;

        (orderRows || []).forEach(r => {
            // Include placed, accepted, confirmed, shipped, delivered orders (exclude declined or cancelled)
            if (r.status !== 'DECLINED' && r.status !== 'CANCELLED') {
                totalRevenue += (parseFloat(r.total_amount) || 0);

                let items = [];
                try {
                    items = typeof r.items_json === 'string' ? JSON.parse(r.items_json) : (r.items_json || []);
                } catch (e) {
                    items = [];
                }

                if (Array.isArray(items)) {
                    items.forEach(i => {
                        totalProductsSold += (parseInt(i.quantity) || 1);
                    });
                }
            }
        });

        res.json({
            success: true,
            stats: {
                totalProducts: products.total || 0,
                inStockProducts: products.inStock || 0,
                totalCustomers: customers.total || 0,
                totalEnquiries: enquiries.total || 0,
                newEnquiries: enquiries.newCount || 0,
                totalReviews: reviews.total || 0,
                averageRating: reviews.avgRating ? parseFloat(reviews.avgRating).toFixed(1) : '5.0',
                totalOrders: orders.total || 0,
                pendingOrders: orders.pendingCount || 0,
                totalRevenue: totalRevenue,
                totalProductsSold: totalProductsSold,
                totalCartItems: cartItems.total || 0,
                totalWishlist: wishlists.total || 0,
                totalAddresses: addresses.total || 0
            }
        });
    } catch (err) {
        console.error('Error fetching admin stats:', err);
        res.status(500).json({ success: false, message: 'Failed to load stats' });
    }
});

// GET /api/admin/customers - List customers
router.get('/customers', async (req, res) => {
    try {
        const rows = await db.allAsync(`
            SELECT id, email, first_name as firstName, last_name as lastName, phone, role, created_at as createdAt 
            FROM users 
            WHERE role = 'CUSTOMER' 
            ORDER BY created_at DESC
        `);
        res.json({ success: true, customers: rows });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Failed to fetch customers' });
    }
});

// DELETE /api/admin/customers/:id - Delete customer
router.delete('/customers/:id', async (req, res) => {
    try {
        const result = await db.runAsync('DELETE FROM users WHERE id = ? AND role = "CUSTOMER"', [req.params.id]);
        if (result.changes === 0) {
            return res.status(404).json({ success: false, message: 'Customer not found or cannot delete admin' });
        }
        res.json({ success: true, message: 'Customer account deleted successfully' });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Failed to delete customer' });
    }
});

// GET /api/admin/cart - List all active cart items
router.get('/cart', async (req, res) => {
    try {
        const rows = await db.allAsync('SELECT * FROM cart_items ORDER BY created_at DESC');
        res.json({ success: true, cartItems: rows });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Failed to fetch cart items' });
    }
});

// DELETE /api/admin/cart/:id - Remove item from active cart
router.delete('/cart/:id', async (req, res) => {
    try {
        await db.runAsync('DELETE FROM cart_items WHERE id = ?', [req.params.id]);
        res.json({ success: true, message: 'Cart item removed successfully' });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Failed to delete cart item' });
    }
});

// GET /api/admin/orders - List all customer placed orders
router.get('/orders', async (req, res) => {
    try {
        const rows = await db.allAsync('SELECT * FROM orders ORDER BY created_at DESC');
        const formatted = rows.map(r => {
            let items = [];
            try {
                items = typeof r.items_json === 'string' ? JSON.parse(r.items_json) : (r.items_json || []);
            } catch (e) {
                items = [];
            }
            return {
                id: r.id,
                orderNumber: r.order_number,
                customerName: r.customer_name,
                customerEmail: r.customer_email,
                customerPhone: r.customer_phone,
                items: items,
                totalAmount: r.total_amount,
                shippingAddress: r.shipping_address,
                status: r.status,
                createdAt: r.created_at
            };
        });
        res.json({ success: true, orders: formatted });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Failed to fetch orders' });
    }
});

// PUT /api/admin/orders/:id - Update order status (Accept, Decline, Shipped, Delivered)
router.put('/orders/:id', async (req, res) => {
    try {
        const { status, declineReason } = req.body;
        const validStatuses = ['PENDING', 'ACCEPTED', 'CONFIRMED', 'DECLINED', 'CANCELLED', 'SHIPPED', 'DELIVERED'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ success: false, message: 'Invalid order status' });
        }
        await db.runAsync('UPDATE orders SET status = ? WHERE id = ?', [status, req.params.id]);
        
        // Fetch order details for notification template
        const order = await db.getAsync('SELECT * FROM orders WHERE id = ?', [req.params.id]);
        
        res.json({
            success: true,
            message: `Order marked as ${status}`,
            order: order
        });
    } catch (err) {
        console.error('Update order status error:', err);
        res.status(500).json({ success: false, message: 'Failed to update order status' });
    }
});

// DELETE /api/admin/orders/:id - Delete order
router.delete('/orders/:id', async (req, res) => {
    try {
        await db.runAsync('DELETE FROM orders WHERE id = ?', [req.params.id]);
        res.json({ success: true, message: 'Order deleted successfully' });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Failed to delete order' });
    }
});

// GET /api/admin/wishlist - List all wishlisted products by customers
router.get('/wishlist', async (req, res) => {
    try {
        const rows = await db.allAsync('SELECT * FROM wishlist ORDER BY created_at DESC');
        res.json({ success: true, wishlist: rows });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Failed to fetch wishlist items' });
    }
});

// DELETE /api/admin/wishlist/:id - Remove wishlist item
router.delete('/wishlist/:id', async (req, res) => {
    try {
        await db.runAsync('DELETE FROM wishlist WHERE id = ?', [req.params.id]);
        res.json({ success: true, message: 'Wishlist item removed' });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Failed to delete wishlist item' });
    }
});

// GET /api/admin/addresses - List all customer shipping/delivery addresses
router.get('/addresses', async (req, res) => {
    try {
        const rows = await db.allAsync('SELECT * FROM addresses ORDER BY created_at DESC');
        res.json({ success: true, addresses: rows });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Failed to fetch customer addresses' });
    }
});

// DELETE /api/admin/addresses/:id - Delete customer address
router.delete('/addresses/:id', async (req, res) => {
    try {
        await db.runAsync('DELETE FROM addresses WHERE id = ?', [req.params.id]);
        res.json({ success: true, message: 'Address removed successfully' });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Failed to delete address' });
    }
});

// GET /api/admin/enquiries - List contact inquiries
router.get('/enquiries', async (req, res) => {
    try {
        const rows = await db.allAsync('SELECT * FROM enquiries ORDER BY created_at DESC');
        res.json({ success: true, enquiries: rows });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Failed to fetch enquiries' });
    }
});

// PUT /api/admin/enquiries/:id - Update enquiry status
router.put('/enquiries/:id', async (req, res) => {
    try {
        const { status } = req.body;
        const validStatuses = ['NEW', 'IN_PROGRESS', 'RESOLVED'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ success: false, message: 'Invalid status' });
        }
        await db.runAsync('UPDATE enquiries SET status = ? WHERE id = ?', [status, req.params.id]);
        res.json({ success: true, message: 'Enquiry status updated' });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Failed to update enquiry' });
    }
});

// DELETE /api/admin/enquiries/:id - Delete enquiry
router.delete('/enquiries/:id', async (req, res) => {
    try {
        await db.runAsync('DELETE FROM enquiries WHERE id = ?', [req.params.id]);
        res.json({ success: true, message: 'Enquiry deleted' });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Failed to delete enquiry' });
    }
});

// GET /api/admin/reviews - List all reviews
router.get('/reviews', async (req, res) => {
    try {
        const rows = await db.allAsync('SELECT * FROM reviews ORDER BY created_at DESC');
        res.json({ success: true, reviews: rows });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Failed to fetch reviews' });
    }
});

// DELETE /api/admin/reviews/:id - Delete review
router.delete('/reviews/:id', async (req, res) => {
    try {
        await db.runAsync('DELETE FROM reviews WHERE id = ?', [req.params.id]);
        res.json({ success: true, message: 'Review deleted' });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Failed to delete review' });
    }
});

module.exports = router;
