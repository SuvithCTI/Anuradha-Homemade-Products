const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const DB_CONFIG = {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT, 10) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'Suvi1912',
    database: process.env.DB_NAME || 'anuradha_organics',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    decimalNumbers: true
};

let pool = null;

// Helper DB wrapper matching SQLite async interface
const db = {
    runAsync: async function(sql, params = []) {
        if (!pool) await initDatabase();
        const [result] = await pool.query(sql, params);
        return {
            lastID: result.insertId,
            changes: result.affectedRows
        };
    },

    getAsync: async function(sql, params = []) {
        if (!pool) await initDatabase();
        const [rows] = await pool.query(sql, params);
        return (rows && rows.length > 0) ? rows[0] : null;
    },

    allAsync: async function(sql, params = []) {
        if (!pool) await initDatabase();
        const [rows] = await pool.query(sql, params);
        return rows || [];
    },

    query: async function(sql, params = []) {
        if (!pool) await initDatabase();
        return pool.query(sql, params);
    },

    getPool: function() {
        return pool;
    }
};

async function initDatabase() {
    if (pool) return;

    try {
        // 1. First ensure MySQL database exists
        const rootConnection = await mysql.createConnection({
            host: DB_CONFIG.host,
            port: DB_CONFIG.port,
            user: DB_CONFIG.user,
            password: DB_CONFIG.password
        });

        await rootConnection.query(`CREATE DATABASE IF NOT EXISTS \`${DB_CONFIG.database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
        await rootConnection.end();

        // 2. Create the connection pool
        pool = mysql.createPool(DB_CONFIG);
        console.log(`🐬 Connected to MySQL Database: '${DB_CONFIG.database}' at ${DB_CONFIG.host}:${DB_CONFIG.port}`);

        // 3. Create all tables in MySQL
        await pool.query(`
            CREATE TABLE IF NOT EXISTS users (
                id INT AUTO_INCREMENT PRIMARY KEY,
                email VARCHAR(255) UNIQUE NOT NULL,
                password_hash VARCHAR(255) NOT NULL,
                first_name VARCHAR(100),
                last_name VARCHAR(100),
                phone VARCHAR(50),
                role VARCHAR(50) NOT NULL DEFAULT 'CUSTOMER',
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        `);

        await pool.query(`
            CREATE TABLE IF NOT EXISTS products (
                id VARCHAR(100) PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                category VARCHAR(100) NOT NULL,
                price DECIMAL(10,2) NOT NULL,
                rating DECIMAL(3,1) DEFAULT 5.0,
                reviews_count INT DEFAULT 0,
                image VARCHAR(500),
                description TEXT,
                ingredients TEXT,
                benefits TEXT,
                sizes_json TEXT,
                in_stock TINYINT(1) DEFAULT 1,
                featured TINYINT(1) DEFAULT 0,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        `);

        await pool.query(`
            CREATE TABLE IF NOT EXISTS enquiries (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                email VARCHAR(255) NOT NULL,
                phone VARCHAR(50),
                message TEXT NOT NULL,
                status VARCHAR(50) DEFAULT 'NEW',
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        `);

        await pool.query(`
            CREATE TABLE IF NOT EXISTS reviews (
                id INT AUTO_INCREMENT PRIMARY KEY,
                product_id VARCHAR(100),
                user_name VARCHAR(255) NOT NULL,
                rating INT DEFAULT 5,
                comment TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        `);

        await pool.query(`
            CREATE TABLE IF NOT EXISTS cart_items (
                id INT AUTO_INCREMENT PRIMARY KEY,
                customer_email VARCHAR(255) NOT NULL,
                customer_name VARCHAR(255),
                customer_phone VARCHAR(50),
                product_id VARCHAR(100) NOT NULL,
                product_name VARCHAR(255) NOT NULL,
                product_image VARCHAR(500),
                weight VARCHAR(50),
                price DECIMAL(10,2) NOT NULL,
                quantity INT DEFAULT 1,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        `);

        await pool.query(`
            CREATE TABLE IF NOT EXISTS orders (
                id INT AUTO_INCREMENT PRIMARY KEY,
                order_number VARCHAR(100) UNIQUE,
                customer_name VARCHAR(255) NOT NULL,
                customer_email VARCHAR(255) NOT NULL,
                customer_phone VARCHAR(50),
                items_json TEXT NOT NULL,
                total_amount DECIMAL(10,2) NOT NULL,
                shipping_address TEXT NOT NULL,
                status VARCHAR(50) DEFAULT 'PENDING',
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        `);

        await pool.query(`
            CREATE TABLE IF NOT EXISTS wishlist (
                id INT AUTO_INCREMENT PRIMARY KEY,
                customer_email VARCHAR(255) NOT NULL,
                customer_name VARCHAR(255),
                product_id VARCHAR(100) NOT NULL,
                product_name VARCHAR(255) NOT NULL,
                product_price DECIMAL(10,2),
                product_image VARCHAR(500),
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        `);

        await pool.query(`
            CREATE TABLE IF NOT EXISTS addresses (
                id INT AUTO_INCREMENT PRIMARY KEY,
                customer_name VARCHAR(255) NOT NULL,
                customer_email VARCHAR(255) NOT NULL,
                customer_phone VARCHAR(50),
                street_address TEXT NOT NULL,
                city VARCHAR(100) NOT NULL,
                state VARCHAR(100) NOT NULL,
                pincode VARCHAR(20) NOT NULL,
                address_type VARCHAR(50) DEFAULT 'Home',
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        `);

        // 4. Seed Default Admin User if not exists
        const adminEmail = 'admin@anuradhaorganics.com';
        const [adminRows] = await pool.query('SELECT * FROM users WHERE email = ?', [adminEmail]);
        if (!adminRows || adminRows.length === 0) {
            const hashedPassword = await bcrypt.hash('Admin@123', 10);
            await pool.query(`
                INSERT INTO users (email, password_hash, first_name, last_name, phone, role)
                VALUES (?, ?, ?, ?, ?, ?)
            `, [adminEmail, hashedPassword, 'Administrator', 'Admin', '9876543210', 'ADMIN']);
            console.log('✅ Default Admin user ready in MySQL: admin@anuradhaorganics.com / Admin@123');
        }

        // 5. Seed Core Products if empty
        const [productCountRows] = await pool.query('SELECT COUNT(*) as count FROM products');
        const count = productCountRows[0]?.count || 0;

        if (count === 0) {
            const seedProducts = [
                {
                    id: 'amla-powder',
                    name: 'Pure Organic Amla Powder',
                    category: 'amla-products',
                    price: 100,
                    rating: 4.8,
                    reviews_count: 42,
                    image: 'images/amla-powder.jpg',
                    description: '100% pure sun-dried wild Indian gooseberry powder. Rich in natural Vitamin C and essential antioxidants for daily vitality.',
                    ingredients: '100% Sun-Dried Organic Indian Gooseberry (Amla)',
                    benefits: 'Rich in Vitamin C and antioxidants, Boosts natural immunity, Improves hair growth & skin health, Enhances digestion.',
                    sizes_json: JSON.stringify([
                        { weight: '100g', price: 100 },
                        { weight: '250g', price: 200 },
                        { weight: '500g', price: 380 }
                    ]),
                    in_stock: 1,
                    featured: 1
                },
                {
                    id: 'sweet-amla-candy',
                    name: 'Wild Honey Soaked Amla Candy',
                    category: 'amla-products',
                    price: 250,
                    rating: 4.9,
                    reviews_count: 68,
                    image: 'images/sweet-amla-candy.jpg',
                    description: 'Fresh organic amla chunks steeped in raw forest honey for 60 days. A traditional Ayurvedic digestive candy.',
                    ingredients: 'Fresh Organic Amla, Raw Wild Forest Honey, Cardamom, Black Pepper',
                    benefits: 'Steeped in raw wild honey for 60 days, Rich source of Vitamin C & natural immunity builder, Excellent digestive and appetite booster.',
                    sizes_json: JSON.stringify([
                        { weight: '250g', price: 250 },
                        { weight: '500g', price: 480 }
                    ]),
                    in_stock: 1,
                    featured: 1
                },
                {
                    id: 'healthy-mix',
                    name: 'Traditional Sathu Maavu Health Mix',
                    category: 'healthy-mixes',
                    price: 120,
                    rating: 4.9,
                    reviews_count: 95,
                    image: 'images/healthy-mix.jpg',
                    description: 'Time-tested multigrain nutrition mix crafted with 18 sprouted grains, pulses, millets, and dry fruits.',
                    ingredients: 'Sprouted Ragi, Bajra, Jowar, Wheat, Red Rice, Barley, Roasted Gram, Green Gram, Groundnuts, Almonds, Cashews, Cardamom, Dry Ginger, Sago',
                    benefits: '18 sprouted grains, pulses, millets & nuts, Complete wholesome nutrition for toddlers and adults, High in natural dietary fiber, calcium & iron.',
                    sizes_json: JSON.stringify([
                        { weight: '250g', price: 120 },
                        { weight: '500g', price: 230 },
                        { weight: '1kg', price: 450 }
                    ]),
                    in_stock: 1,
                    featured: 1
                },
                {
                    id: 'nuts-powder',
                    name: 'Sprouted Nuts & Seeds Powder',
                    category: 'nuts-powders',
                    price: 320,
                    rating: 4.9,
                    reviews_count: 64,
                    image: 'images/nuts-powder.jpg',
                    description: 'A high-protein, nutrient-dense powder made from premium sprouted almonds, walnuts, pistachios, cashews, and pumpkin seeds.',
                    ingredients: 'Sprouted Almonds, Sprouted Walnuts, Pistachios, Cashews, Sprouted Pumpkin Seeds, Cardamom',
                    benefits: 'Powerhouse of protein and vitamins, Boosts brain health & memory in children, Rich in healthy fats (Omega-3).',
                    sizes_json: JSON.stringify([
                        { weight: '250g', price: 320 },
                        { weight: '500g', price: 600 }
                    ]),
                    in_stock: 1,
                    featured: 1
                },
                {
                    id: 'ragi-almond-powder',
                    name: 'Sprouted Ragi & Almond Mix',
                    category: 'nuts-powders',
                    price: 240,
                    rating: 4.8,
                    reviews_count: 51,
                    image: 'images/ragi-almond-powder.jpg',
                    description: 'Traditional weaning and wellness food. Sprouting increases ragi calcium absorption threefold, blended with almonds to create a rich health drink.',
                    ingredients: 'Sprouted Finger Millet (Ragi), Premium Almonds, Cardamom',
                    benefits: 'Exceptionally high in Calcium and Iron, Easily digestible for infants and elderly, Supports bone development.',
                    sizes_json: JSON.stringify([
                        { weight: '250g', price: 240 },
                        { weight: '500g', price: 450 }
                    ]),
                    in_stock: 1,
                    featured: 1
                },
                {
                    id: 'millet-health-mix',
                    name: 'Multi-Millet Health Porridge Mix',
                    category: 'healthy-mixes',
                    price: 260,
                    rating: 4.7,
                    reviews_count: 33,
                    image: 'images/millet-health-mix.jpg',
                    description: 'A diabetic-friendly and weight-loss supportive porridge mix made from 9 varieties of premium organic millets.',
                    ingredients: 'Finger Millet, Pearl Millet, Foxtail Millet, Little Millet, Kodo Millet, Barnyard Millet, Sorghum, Brown Top Millet, Cardamom',
                    benefits: 'Helps regulate blood sugar levels, Keeps you full longer, helping in weight control, Rich in iron, magnesium, and dietary fiber.',
                    sizes_json: JSON.stringify([
                        { weight: '500g', price: 260 },
                        { weight: '1kg', price: 500 }
                    ]),
                    in_stock: 1,
                    featured: 0
                },
                {
                    id: 'cow-ghee',
                    name: 'Pure Homemade Cow Ghee (Bilona Method)',
                    category: 'other-organics',
                    price: 450,
                    rating: 5.0,
                    reviews_count: 104,
                    image: 'images/cow-ghee.jpg',
                    description: 'Churned from cultured butter of grass-fed cows using the traditional Vedic Bilona method. Highly aromatic, grainy, and packed with healthy fats.',
                    ingredients: '100% Clarified Butter (Cow Milk Fat)',
                    benefits: 'Traditional aroma and rich grainy texture, Enhances digestion and nutrient absorption, Good for joints, skin, and overall vitality.',
                    sizes_json: JSON.stringify([
                        { weight: '250ml', price: 450 },
                        { weight: '500ml', price: 850 },
                        { weight: '1L', price: 1600 }
                    ]),
                    in_stock: 1,
                    featured: 0
                },
                {
                    id: 'forest-honey',
                    name: 'Raw Wild Forest Honey',
                    category: 'other-organics',
                    price: 160,
                    rating: 4.9,
                    reviews_count: 77,
                    image: 'images/forest-honey.webp',
                    description: '100% pure, unfiltered, and unpasteurized honey sourced directly from forest beehives. Retains natural pollen, propolis, and royal jelly.',
                    ingredients: '100% Raw Wild Forest Honey',
                    benefits: 'Natural energy booster and immunity builder, Soothes cough and throat irritation, Rich in natural enzymes and antioxidants.',
                    sizes_json: JSON.stringify([
                        { weight: '250g', price: 160 },
                        { weight: '500g', price: 290 },
                        { weight: '1kg', price: 550 }
                    ]),
                    in_stock: 1,
                    featured: 1
                }
            ];

            for (const p of seedProducts) {
                await pool.query(`
                    INSERT INTO products (id, name, category, price, rating, reviews_count, image, description, ingredients, benefits, sizes_json, in_stock, featured)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                `, [p.id, p.name, p.category, p.price, p.rating, p.reviews_count, p.image, p.description, p.ingredients, p.benefits, p.sizes_json, p.in_stock, p.featured]);
            }
            console.log('✅ Seeded 8 core organic products into MySQL database.');
        }

    } catch (err) {
        console.error('❌ Failed to initialize MySQL Database:', err);
    }
}

// Kick off database initialization immediately
initDatabase();

module.exports = db;
