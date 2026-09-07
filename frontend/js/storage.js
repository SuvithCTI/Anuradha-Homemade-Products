/**
 * StorageService - Standalone Client-Side Data & Storage Engine
 * Anuradha Homemade Organic Products
 * 
 * Manages Products, Customer Users, Inquiries, Reviews, Newsletters, and Cart via localStorage.
 */

(function(window) {
    'use strict';

    const STORAGE_KEYS = {
        PRODUCTS: 'anuradha_products',
        USERS: 'anuradha_users',
        CURRENT_USER: 'anuradha_current_user',
        AUTH_TOKEN: 'auth_token',
        ENQUIRIES: 'anuradha_enquiries',
        FEEDBACKS: 'anuradha_feedbacks',
        NEWSLETTERS: 'anuradha_newsletters',
        LOGS: 'anuradha_login_logs',
        CART: 'anuradha_cart'
    };

    // Initial Core Products Catalogue (Matching Store Mockup)
    const DEFAULT_PRODUCTS = [
        {
            id: 'amla-powder',
            name: 'Pure Organic Amla Powder',
            category: 'amla-products',
            price: 100.0,
            rating: 4.8,
            reviewsCount: 42,
            image: 'images/amla-powder.jpg',
            description: '100% pure sun-dried wild Indian gooseberry powder. Rich in natural Vitamin C and essential antioxidants for daily vitality.',
            ingredients: '100% Sun-Dried Organic Indian Gooseberry (Amla)',
            benefits: 'Rich in Vitamin C and antioxidants, Boosts natural immunity, Improves hair growth & skin health, Enhances digestion.',
            sizesJson: JSON.stringify([
                { weight: '100g', price: 100 },
                { weight: '250g', price: 200 },
                { weight: '500g', price: 380 }
            ]),
            inStock: true,
            featured: true,
            createdAt: new Date(Date.now() - 86400000 * 10).toISOString(),
            updatedAt: new Date(Date.now() - 86400000 * 10).toISOString()
        },
        {
            id: 'sweet-amla-candy',
            name: 'Wild Honey Soaked Amla Candy',
            category: 'amla-products',
            price: 250.0,
            rating: 4.9,
            reviewsCount: 68,
            image: 'images/sweet-amla-candy.jpg',
            description: 'Fresh organic amla chunks steeped in raw forest honey for 60 days. A traditional Ayurvedic digestive candy.',
            ingredients: 'Fresh Organic Amla, Raw Wild Forest Honey, Cardamom, Black Pepper',
            benefits: 'Steeped in raw wild honey for 60 days, Rich source of Vitamin C & natural immunity builder, Excellent digestive and appetite booster.',
            sizesJson: JSON.stringify([
                { weight: '250g', price: 250 },
                { weight: '500g', price: 480 }
            ]),
            inStock: true,
            featured: true,
            createdAt: new Date(Date.now() - 86400000 * 9).toISOString(),
            updatedAt: new Date(Date.now() - 86400000 * 9).toISOString()
        },
        {
            id: 'healthy-mix',
            name: 'Traditional Sathu Maavu Health Mix',
            category: 'healthy-mixes',
            price: 120.0,
            rating: 4.9,
            reviewsCount: 95,
            image: 'images/healthy-mix.jpg',
            description: 'Time-tested multigrain nutrition mix crafted with 18 sprouted grains, pulses, millets, and dry fruits.',
            ingredients: 'Sprouted Ragi, Bajra, Jowar, Wheat, Red Rice, Barley, Roasted Gram, Green Gram, Groundnuts, Almonds, Cashews, Cardamom, Dry Ginger, Sago',
            benefits: '18 sprouted grains, pulses, millets & nuts, Complete wholesome nutrition for toddlers and adults, High in natural dietary fiber, calcium & iron.',
            sizesJson: JSON.stringify([
                { weight: '250g', price: 120 },
                { weight: '500g', price: 230 },
                { weight: '1kg', price: 450 }
            ]),
            inStock: true,
            featured: true,
            createdAt: new Date(Date.now() - 86400000 * 6).toISOString(),
            updatedAt: new Date(Date.now() - 86400000 * 6).toISOString()
        },
        {
            id: 'nuts-powder',
            name: 'Sprouted Nuts & Seeds Powder',
            category: 'nuts-powders',
            price: 320.0,
            rating: 4.9,
            reviewsCount: 64,
            image: 'images/nuts-powder.jpg',
            description: 'A high-protein, nutrient-dense powder made from premium sprouted almonds, walnuts, pistachios, cashews, and pumpkin seeds.',
            ingredients: 'Sprouted Almonds, Sprouted Walnuts, Pistachios, Cashews, Sprouted Pumpkin Seeds, Cardamom',
            benefits: 'Powerhouse of protein and vitamins, Boosts brain health & memory in children, Rich in healthy fats (Omega-3).',
            sizesJson: JSON.stringify([
                { weight: '250g', price: 320 },
                { weight: '500g', price: 600 }
            ]),
            inStock: true,
            featured: true,
            createdAt: new Date(Date.now() - 86400000 * 8).toISOString(),
            updatedAt: new Date(Date.now() - 86400000 * 8).toISOString()
        },
        {
            id: 'ragi-almond-powder',
            name: 'Sprouted Ragi & Almond Mix',
            category: 'nuts-powders',
            price: 240.0,
            rating: 4.8,
            reviewsCount: 51,
            image: 'images/ragi-almond-powder.jpg',
            description: 'Traditional weaning and wellness food. Sprouting increases ragi\'s calcium absorption threefold, blended with almonds to create a rich health drink.',
            ingredients: 'Sprouted Finger Millet (Ragi), Premium Almonds, Cardamom',
            benefits: 'Exceptionally high in Calcium and Iron, Easily digestible for infants and elderly, Supports bone development.',
            sizesJson: JSON.stringify([
                { weight: '250g', price: 240 },
                { weight: '500g', price: 450 }
            ]),
            inStock: true,
            featured: true,
            createdAt: new Date(Date.now() - 86400000 * 7).toISOString(),
            updatedAt: new Date(Date.now() - 86400000 * 7).toISOString()
        },
        {
            id: 'millet-health-mix',
            name: 'Multi-Millet Health Porridge Mix',
            category: 'healthy-mixes',
            price: 260.0,
            rating: 4.7,
            reviewsCount: 33,
            image: 'images/millet-health-mix.jpg',
            description: 'A diabetic-friendly and weight-loss supportive porridge mix made from 9 varieties of premium organic millets.',
            ingredients: 'Finger Millet, Pearl Millet, Foxtail Millet, Little Millet, Kodo Millet, Barnyard Millet, Sorghum, Brown Top Millet, Cardamom',
            benefits: 'Helps regulate blood sugar levels, Keeps you full longer, helping in weight control, Rich in iron, magnesium, and dietary fiber.',
            sizesJson: JSON.stringify([
                { weight: '500g', price: 260 },
                { weight: '1kg', price: 500 }
            ]),
            inStock: true,
            featured: false,
            createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
            updatedAt: new Date(Date.now() - 86400000 * 5).toISOString()
        },
        {
            id: 'cow-ghee',
            name: 'Pure Homemade Cow Ghee (Bilona Method)',
            category: 'other-organics',
            price: 450.0,
            rating: 5.0,
            reviewsCount: 104,
            image: 'images/cow-ghee.jpg',
            description: 'Churned from cultured butter of grass-fed cows using the traditional Vedic Bilona method. Highly aromatic, grainy, and packed with healthy fats.',
            ingredients: '100% Clarified Butter (Cow Milk Fat)',
            benefits: 'Traditional aroma and rich grainy texture, Enhances digestion and nutrient absorption, Good for joints, skin, and overall vitality.',
            sizesJson: JSON.stringify([
                { weight: '250ml', price: 450 },
                { weight: '500ml', price: 850 },
                { weight: '1L', price: 1600 }
            ]),
            inStock: true,
            featured: false,
            createdAt: new Date(Date.now() - 86400000 * 4).toISOString(),
            updatedAt: new Date(Date.now() - 86400000 * 4).toISOString()
        },
        {
            id: 'forest-honey',
            name: 'Raw Wild Forest Honey',
            category: 'other-organics',
            price: 160.0,
            rating: 4.9,
            reviewsCount: 77,
            image: 'images/forest-honey.webp',
            description: '100% pure, unfiltered, and unpasteurized honey sourced directly from forest beehives. Retains natural pollen, propolis, and royal jelly.',
            ingredients: '100% Raw Wild Forest Honey',
            benefits: 'Natural energy booster and immunity builder, Soothes cough and throat irritation, Rich in natural enzymes and antioxidants.',
            sizesJson: JSON.stringify([
                { weight: '250g', price: 160 },
                { weight: '500g', price: 290 },
                { weight: '1kg', price: 550 }
            ]),
            inStock: true,
            featured: true,
            createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
            updatedAt: new Date(Date.now() - 86400000 * 3).toISOString()
        }
    ];

    // Default Seed Customer Account
    const DEFAULT_USERS = [
        {
            id: 1,
            firstName: 'Demo',
            lastName: 'Customer',
            email: 'customer@anuradhaorganics.com',
            password: 'Customer@123',
            authProvider: 'LOCAL',
            emailVerified: true,
            createdAt: new Date(Date.now() - 86400000 * 30).toISOString()
        }
    ];

    // Seed Sample Enquiries
    const DEFAULT_ENQUIRIES = [
        {
            id: 101,
            name: 'Priya Sundaram',
            email: 'priya.s@example.com',
            phone: '+91 98401 23456',
            subject: 'Bulk order inquiry for Sathu Maavu',
            message: 'Hello, I want to order 25kg of Health Mix for our wellness retreat. Do you offer bulk packaging?',
            status: 'NEW',
            createdAt: new Date(Date.now() - 86400000 * 2).toISOString()
        }
    ];

    // Seed Sample Feedbacks
    const DEFAULT_FEEDBACKS = [
        {
            id: 201,
            name: 'Ananya Sharma',
            email: 'ananya@example.com',
            rating: 5,
            comment: 'The honey soaked amla is absolutely delicious! My whole family loves it.',
            createdAt: new Date(Date.now() - 86400000 * 3).toISOString()
        },
        {
            id: 202,
            name: 'Venkatesh Iyer',
            email: 'venkat.iyer@example.com',
            rating: 5,
            comment: 'Very authentic sprouted ragi flour. Aroma is so fresh compared to store brands.',
            createdAt: new Date(Date.now() - 86400000 * 6).toISOString()
        }
    ];

    // Seed Sample Newsletters
    const DEFAULT_NEWSLETTERS = [
        { id: 1, email: 'wellness.guru@example.com', createdAt: new Date(Date.now() - 86400000 * 12).toISOString() }
    ];

    const SCHEMA_VERSION = 'aho_v4_correct_images';

    // Seed Initial Data into localStorage if not present
    function initDatabase() {
        const storedVersion = localStorage.getItem('aho_schema_version');
        let shouldResetProducts = false;

        if (!localStorage.getItem(STORAGE_KEYS.PRODUCTS) || storedVersion !== SCHEMA_VERSION) {
            shouldResetProducts = true;
        } else {
            try {
                const list = JSON.parse(localStorage.getItem(STORAGE_KEYS.PRODUCTS) || '[]');
                if (!Array.isArray(list) || list.length === 0 || 
                    list.some(p => p.id === 'moringa-leaf-powder' || p.id === 'turmeric-powder' || p.id === 'triphala-churna' || p.id === 'ragi-flour' || (p.image && (p.image.includes('wild-honey-soaked-amla-candy') || p.image.includes('moringa') || p.image.includes('turmeric') || p.image.includes('triphala'))))) {
                    shouldResetProducts = true;
                }
            } catch (e) {
                shouldResetProducts = true;
            }
        }

        if (shouldResetProducts) {
            localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(DEFAULT_PRODUCTS));
            localStorage.setItem('aho_schema_version', SCHEMA_VERSION);
        }
        if (!localStorage.getItem(STORAGE_KEYS.USERS)) {
            localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(DEFAULT_USERS));
        }
        if (!localStorage.getItem(STORAGE_KEYS.ENQUIRIES)) {
            localStorage.setItem(STORAGE_KEYS.ENQUIRIES, JSON.stringify(DEFAULT_ENQUIRIES));
        }
        if (!localStorage.getItem(STORAGE_KEYS.FEEDBACKS)) {
            localStorage.setItem(STORAGE_KEYS.FEEDBACKS, JSON.stringify(DEFAULT_FEEDBACKS));
        }
        if (!localStorage.getItem(STORAGE_KEYS.NEWSLETTERS)) {
            localStorage.setItem(STORAGE_KEYS.NEWSLETTERS, JSON.stringify(DEFAULT_NEWSLETTERS));
        }
        if (!localStorage.getItem(STORAGE_KEYS.LOGS)) {
            localStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify([
                {
                    id: 1,
                    email: 'customer@anuradhaorganics.com',
                    ipAddress: '127.0.0.1 (Local Session)',
                    status: 'SUCCESS',
                    loginTime: new Date().toISOString()
                }
            ]));
        }

        // Clean out any legacy admin references
        const users = JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || '[]');
        const filteredUsers = users.filter(u => u.email.toLowerCase() !== 'admin@anuradhaorganics.com');
        if (filteredUsers.length !== users.length) {
            localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(filteredUsers.length ? filteredUsers : DEFAULT_USERS));
        }
    }

    initDatabase();

    const StorageService = {
        // --- PRODUCTS ---
        getProducts: function() {
            try {
                const list = JSON.parse(localStorage.getItem(STORAGE_KEYS.PRODUCTS) || '[]');
                if (Array.isArray(list) && list.length > 0 && !list.some(p => p.id === 'moringa-leaf-powder' || p.id === 'turmeric-powder' || p.id === 'triphala-churna' || (p.image && p.image.includes('wild-honey-soaked-amla-candy.jpg')))) {
                    return list;
                }
                localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(DEFAULT_PRODUCTS));
                localStorage.setItem('aho_schema_version', SCHEMA_VERSION);
                return DEFAULT_PRODUCTS;
            } catch (e) {
                return DEFAULT_PRODUCTS;
            }
        },

        getProductById: function(id) {
            const products = this.getProducts();
            return products.find(p => p.id === id) || null;
        },

        // --- AUTH & CUSTOMERS ---
        getUsers: function() {
            try {
                return JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || '[]');
            } catch (e) {
                return DEFAULT_USERS;
            }
        },

        login: function(email, password) {
            const users = this.getUsers();
            const cleanEmail = (email || '').trim().toLowerCase();
            const user = users.find(u => u.email.toLowerCase() === cleanEmail);

            const isSuccess = user && user.password === password;

            this.addLoginLog(cleanEmail, isSuccess ? 'SUCCESS' : 'FAILURE');

            if (!isSuccess) {
                return { success: false, message: 'Invalid email or password.' };
            }

            const fakeToken = 'customer_token_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9);
            const userPayload = {
                id: user.id,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                authProvider: user.authProvider || 'LOCAL',
                emailVerified: user.emailVerified !== false
            };

            localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, fakeToken);
            localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(userPayload));

            return {
                success: true,
                token: fakeToken,
                user: userPayload,
                message: 'Login successful'
            };
        },

        register: function(userData) {
            const users = this.getUsers();
            const cleanEmail = (userData.email || '').trim().toLowerCase();

            if (users.some(u => u.email.toLowerCase() === cleanEmail)) {
                return { success: false, message: 'This email is already registered.' };
            }

            const newUser = {
                id: Date.now(),
                firstName: (userData.firstName || 'Customer').trim(),
                lastName: (userData.lastName || '').trim(),
                email: cleanEmail,
                password: userData.password,
                authProvider: 'LOCAL',
                emailVerified: true,
                createdAt: new Date().toISOString()
            };

            users.push(newUser);
            localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));

            return { success: true, message: 'Registration successful! You can now sign in.', user: newUser };
        },

        getCurrentUser: function() {
            try {
                const userJson = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
                return userJson ? JSON.parse(userJson) : null;
            } catch (e) {
                return null;
            }
        },

        setCurrentUser: function(user) {
            localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
        },

        updateProfile: function(firstName, lastName) {
            const current = this.getCurrentUser();
            if (!current) return { success: false, message: 'Not authenticated' };

            const users = this.getUsers();
            const userIndex = users.findIndex(u => u.email.toLowerCase() === current.email.toLowerCase());

            if (userIndex !== -1) {
                users[userIndex].firstName = firstName.trim();
                users[userIndex].lastName = lastName.trim();
                localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));

                current.firstName = firstName.trim();
                current.lastName = lastName.trim();
                this.setCurrentUser(current);

                return { success: true, message: 'Profile updated successfully!', user: current };
            }
            return { success: false, message: 'User record not found' };
        },

        logout: function() {
            localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
            localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
        },

        // --- ENQUIRIES ---
        getEnquiries: function() {
            try {
                return JSON.parse(localStorage.getItem(STORAGE_KEYS.ENQUIRIES) || '[]');
            } catch (e) {
                return [];
            }
        },

        addEnquiry: function(data) {
            const enquiries = this.getEnquiries();
            const newEnquiry = {
                id: Date.now(),
                name: data.name || 'Customer',
                email: data.email || '',
                phone: data.phone || '',
                subject: data.subject || 'Customer Enquiry',
                message: data.message || '',
                status: 'NEW',
                createdAt: new Date().toISOString()
            };
            enquiries.unshift(newEnquiry);
            localStorage.setItem(STORAGE_KEYS.ENQUIRIES, JSON.stringify(enquiries));
            return { success: true, message: 'Enquiry submitted successfully! We will contact you shortly.' };
        },

        // --- FEEDBACKS / REVIEWS ---
        getFeedbacks: function() {
            try {
                return JSON.parse(localStorage.getItem(STORAGE_KEYS.FEEDBACKS) || '[]');
            } catch (e) {
                return [];
            }
        },

        addFeedback: function(data) {
            const feedbacks = this.getFeedbacks();
            const newFeedback = {
                id: Date.now(),
                name: data.name || 'Customer',
                email: data.email || '',
                rating: parseInt(data.rating) || 5,
                comment: data.comment || '',
                createdAt: new Date().toISOString()
            };
            feedbacks.unshift(newFeedback);
            localStorage.setItem(STORAGE_KEYS.FEEDBACKS, JSON.stringify(feedbacks));
            return { success: true, message: 'Thank you for your review and rating!' };
        },

        // --- NEWSLETTERS ---
        getNewsletters: function() {
            try {
                return JSON.parse(localStorage.getItem(STORAGE_KEYS.NEWSLETTERS) || '[]');
            } catch (e) {
                return [];
            }
        },

        addNewsletter: function(email) {
            const newsletters = this.getNewsletters();
            const cleanEmail = (email || '').trim().toLowerCase();

            if (newsletters.some(n => n.email.toLowerCase() === cleanEmail)) {
                return { success: true, message: 'You are already subscribed to our newsletter!' };
            }

            newsletters.unshift({
                id: Date.now(),
                email: cleanEmail,
                createdAt: new Date().toISOString()
            });
            localStorage.setItem(STORAGE_KEYS.NEWSLETTERS, JSON.stringify(newsletters));
            return { success: true, message: 'Subscribed to newsletter successfully!' };
        },

        // --- LOGIN AUDIT LOGS ---
        getLoginLogs: function() {
            try {
                return JSON.parse(localStorage.getItem(STORAGE_KEYS.LOGS) || '[]');
            } catch (e) {
                return [];
            }
        },

        addLoginLog: function(email, status) {
            const logs = this.getLoginLogs();
            logs.unshift({
                id: Date.now(),
                email: email,
                ipAddress: '127.0.0.1 (Web Session)',
                status: status,
                loginTime: new Date().toISOString()
            });
            if (logs.length > 50) logs.length = 50;
            localStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify(logs));
        }
    };

    window.StorageService = StorageService;
})(window);
