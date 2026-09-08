/**
 * Admin Panel Dashboard Controller
 * Connects to Node.js / Express.js / SQLite API
 */

const API_BASE = (window.location.port === '5000' || (window.location.protocol === 'https:' && !window.location.port))
    ? window.location.origin
    : (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' ? 'http://localhost:5000' : window.location.origin);
let authToken = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
let currentProducts = [];
let currentOrders = [];

document.addEventListener('DOMContentLoaded', async () => {
    // 1. Validate Auth Token & Role
    await checkAuth();

    // 2. Initialize UI Navigation
    initNav();
    initMobileToggle();
    initProductForm();
    initDropzone();

    // 3. Load Overview Stats & Products
    loadDashboardStats();
    loadProducts();
});

// --- AUTH GUARD ---
async function checkAuth() {
    if (!authToken) {
        redirectToLogin();
        return;
    }

    try {
        const res = await fetch(`${API_BASE}/api/auth/me`, {
            headers: { 'Authorization': 'Bearer ' + authToken }
        });
        const data = await res.json();

        if (!data.success || data.user.role !== 'ADMIN') {
            redirectToLogin();
            return;
        }

        // Display Admin Name
        const nameEl = document.getElementById('admin-name');
        const avatarEl = document.getElementById('admin-avatar');
        if (nameEl) nameEl.textContent = data.user.firstName ? `${data.user.firstName} ${data.user.lastName}` : data.user.email;
        if (avatarEl && data.user.firstName) avatarEl.textContent = data.user.firstName.charAt(0).toUpperCase();

    } catch (err) {
        console.warn('API auth error:', err);
        redirectToLogin();
    }
}

function redirectToLogin() {
    localStorage.removeItem('auth_token');
    sessionStorage.removeItem('auth_token');
    window.location.href = '../login.html';
}

// Logout
document.getElementById('btn-logout')?.addEventListener('click', () => {
    localStorage.removeItem('auth_token');
    sessionStorage.removeItem('auth_token');
    showToast('Logged out successfully');
    setTimeout(() => {
        window.location.href = '../login.html';
    }, 800);
});

// --- NAVIGATION & TABS ---
function initNav() {
    const navItems = document.querySelectorAll('.nav-item');
    const heading = document.getElementById('page-heading');

    navItems.forEach(item => {
        item.addEventListener('click', () => {
            navItems.forEach(n => n.classList.remove('active'));
            item.classList.add('active');

            const tabId = item.dataset.tab;
            document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));
            const targetPane = document.getElementById(`tab-${tabId}`);
            if (targetPane) targetPane.classList.add('active');

            if (heading) {
                const titles = {
                    overview: 'Dashboard Overview',
                    products: 'Product Inventory & Catalog',
                    customers: 'Registered Customer Accounts',
                    cart: 'Active Customer Carts',
                    orders: 'Placed Customer Orders',
                    wishlist: 'Customer Wishlist Tracker',
                    addresses: 'Customer Delivery Addresses',
                    enquiries: 'Customer Messages & Inquiries',
                    reviews: 'Customer Ratings & Reviews'
                };
                heading.textContent = titles[tabId] || 'Dashboard';
            }

            // Auto close mobile sidebar after tab selection
            closeMobileSidebar();

            // Lazy fetch on tab switch
            if (tabId === 'customers') loadCustomers();
            if (tabId === 'cart') loadCart();
            if (tabId === 'orders') loadOrders();
            if (tabId === 'wishlist') loadWishlist();
            if (tabId === 'addresses') loadAddresses();
            if (tabId === 'enquiries') loadEnquiries();
            if (tabId === 'reviews') loadReviews();
        });
    });
}

function initMobileToggle() {
    const btn = document.getElementById('mobile-toggle');
    const sidebar = document.getElementById('admin-sidebar');
    const backdrop = document.getElementById('sidebar-backdrop');

    if (btn && sidebar) {
        btn.addEventListener('click', () => {
            const isOpen = sidebar.classList.toggle('open');
            if (backdrop) backdrop.classList.toggle('active', isOpen);
        });
    }

    if (backdrop) {
        backdrop.addEventListener('click', () => {
            closeMobileSidebar();
        });
    }
}

function closeMobileSidebar() {
    const sidebar = document.getElementById('admin-sidebar');
    const backdrop = document.getElementById('sidebar-backdrop');
    if (sidebar) sidebar.classList.remove('open');
    if (backdrop) backdrop.classList.remove('active');
}

// --- STATS OVERVIEW ---
async function loadDashboardStats() {
    try {
        const res = await fetch(`${API_BASE}/api/admin/stats`, {
            headers: { 'Authorization': 'Bearer ' + authToken }
        });
        const data = await res.json();
        if (data.success && data.stats) {
            document.getElementById('stat-products').textContent = data.stats.totalProducts;
            document.getElementById('stat-customers').textContent = data.stats.totalCustomers;
            document.getElementById('stat-enquiries').textContent = data.stats.newEnquiries;
            document.getElementById('stat-reviews').textContent = data.stats.totalReviews;
            document.getElementById('stat-rating').textContent = data.stats.averageRating;
            
            const soldEl = document.getElementById('stat-products-sold');
            if (soldEl) soldEl.textContent = data.stats.totalProductsSold || 0;

            const revenueEl = document.getElementById('stat-revenue');
            if (revenueEl) revenueEl.textContent = 'Rs. ' + (data.stats.totalRevenue || 0).toLocaleString('en-IN');

            const ordersEl = document.getElementById('stat-orders');
            if (ordersEl) ordersEl.textContent = data.stats.totalOrders || 0;

            const cartEl = document.getElementById('stat-cart');
            if (cartEl) cartEl.textContent = data.stats.totalCartItems || 0;

            const wishEl = document.getElementById('stat-wishlist');
            if (wishEl) wishEl.textContent = data.stats.totalWishlist || 0;

            const addrEl = document.getElementById('stat-addresses');
            if (addrEl) addrEl.textContent = data.stats.totalAddresses || 0;

            if (data.stats.newEnquiries > 0) {
                const badge = document.getElementById('badge-enquiries');
                if (badge) {
                    badge.textContent = data.stats.newEnquiries;
                    badge.style.display = 'inline-block';
                }
            }
        }
    } catch (e) {
        console.error('Failed to load stats:', e);
    }
}

// --- PRODUCTS MANAGEMENT ---
async function loadProducts() {
    try {
        const res = await fetch(`${API_BASE}/api/products`);
        const list = await res.json();
        currentProducts = list;

        renderProductsTable(list);
    } catch (err) {
        console.error('Error fetching products:', err);
    }
}

function renderProductsTable(list) {
    const tbody = document.querySelector('#products-table tbody');
    if (!tbody) return;
    tbody.innerHTML = '';

    if (list.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" style="text-align:center; padding:30px; color:#94a3b8;">No products found. Click "+ Add Product" to create one.</td></tr>';
        return;
    }

    list.forEach(p => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>
                <div class="table-product-cell">
                    <img class="table-product-img" src="../${p.image}" alt="${p.name}" onerror="this.src='../images/healthy-mix.jpg'">
                    <div>
                        <div class="table-product-name">${p.name}</div>
                        <div class="table-product-cat">ID: ${p.id}</div>
                    </div>
                </div>
            </td>
            <td><span class="badge badge-gray">${p.category}</span></td>
            <td><strong>Rs. ${p.price}</strong></td>
            <td>
                <div class="action-btns">
                    <button class="btn-icon" onclick="openEditProductModal('${p.id}')" title="Edit Product"><i class="fa-solid fa-pen-to-square"></i></button>
                    <button class="btn-icon btn-icon-danger" onclick="deleteProduct('${p.id}')" title="Delete Product"><i class="fa-solid fa-trash-can"></i></button>
                </div>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

// Product Search Filter
document.getElementById('product-search-input')?.addEventListener('input', (e) => {
    const q = e.target.value.toLowerCase().trim();
    const filtered = currentProducts.filter(p => 
        p.name.toLowerCase().includes(q) || 
        p.category.toLowerCase().includes(q) ||
        (p.description && p.description.toLowerCase().includes(q))
    );
    renderProductsTable(filtered);
});

// --- PRODUCT MODAL & SIZES ---
// --- PRODUCT MODAL & SIZES ---
function openAddProductModal() {
    document.getElementById('modal-product-title').textContent = 'Add New Organic Product';
    document.getElementById('form-product-id').value = '';
    document.getElementById('product-form').reset();
    document.getElementById('image-preview').src = '../images/healthy-mix.jpg';
    document.getElementById('form-product-image-url').value = 'images/healthy-mix.jpg';

    // Clear and add 1 default size row
    const container = document.getElementById('sizes-container');
    container.innerHTML = '';
    addSizeRow('250g', '100');

    document.getElementById('product-modal').classList.add('active');
}

function openEditProductModal(id) {
    const product = currentProducts.find(p => String(p.id) === String(id));
    if (!product) {
        alert('Product not found: ' + id);
        return;
    }

    document.getElementById('modal-product-title').textContent = 'Edit Product: ' + product.name;
    document.getElementById('form-product-id').value = product.id;
    document.getElementById('form-product-name').value = product.name || '';
    
    // Category selection with fallback
    const catSelect = document.getElementById('form-product-category');
    if (catSelect) {
        const catClean = (product.category || '').trim().toLowerCase();
        let matched = false;
        for (let opt of catSelect.options) {
            if (opt.value.toLowerCase() === catClean || opt.text.toLowerCase() === catClean) {
                catSelect.value = opt.value;
                matched = true;
                break;
            }
        }
        if (!matched && product.category) {
            const newOpt = document.createElement('option');
            newOpt.value = product.category;
            newOpt.textContent = product.category;
            catSelect.appendChild(newOpt);
            catSelect.value = product.category;
        }
    }

    document.getElementById('form-product-price').value = product.price !== undefined ? product.price : '';
    document.getElementById('form-product-desc').value = product.description || '';
    document.getElementById('form-product-ingredients').value = product.ingredients || '';
    document.getElementById('form-product-benefits').value = Array.isArray(product.benefits) ? product.benefits.join(', ') : (product.benefits || '');
    
    const inStock = (product.inStock === true || product.inStock === 1 || product.in_stock === 1 || product.in_stock === true);
    document.getElementById('form-product-stock').value = inStock ? '1' : '0';

    const featured = (product.featured === true || product.featured === 1);
    document.getElementById('form-product-featured').value = featured ? '1' : '0';

    document.getElementById('form-product-image-url').value = product.image || 'images/healthy-mix.jpg';
    
    let previewSrc = product.image || 'images/healthy-mix.jpg';
    if (!previewSrc.startsWith('http') && !previewSrc.startsWith('data:') && !previewSrc.startsWith('../')) {
        previewSrc = '../' + previewSrc.replace(/^\//, '');
    }
    document.getElementById('image-preview').src = previewSrc;

    // Populate Size Tiers
    const container = document.getElementById('sizes-container');
    container.innerHTML = '';
    if (product.sizes && Array.isArray(product.sizes) && product.sizes.length > 0) {
        product.sizes.forEach(s => addSizeRow(s.weight, s.price));
    } else {
        addSizeRow('Standard', product.price || 100);
    }

    document.getElementById('product-modal').classList.add('active');
}

function closeProductModal() {
    document.getElementById('product-modal').classList.remove('active');
}

function addSizeRow(weight = '', price = '') {
    const container = document.getElementById('sizes-container');
    if (!container) return;
    const row = document.createElement('div');
    row.className = 'size-row';
    row.innerHTML = `
        <input type="text" class="form-control size-weight" placeholder="Weight / Size (e.g., 250g, 500ml)" value="${weight}" required>
        <input type="number" class="form-control size-price" placeholder="Price (Rs.)" value="${price}" min="1" step="1" required>
        <button type="button" class="btn-remove-size" onclick="this.parentElement.remove()" title="Remove Tier">✕</button>
    `;
    container.appendChild(row);

    // Sync base price on edit if first row
    const priceInput = row.querySelector('.size-price');
    priceInput.addEventListener('input', () => {
        const allPrices = container.querySelectorAll('.size-price');
        if (allPrices.length === 1 || allPrices[0] === priceInput) {
            const basePriceEl = document.getElementById('form-product-price');
            if (basePriceEl) basePriceEl.value = priceInput.value;
        }
    });
}

// Global scope attachments
window.openAddProductModal = openAddProductModal;
window.openEditProductModal = openEditProductModal;
window.closeProductModal = closeProductModal;
window.addSizeRow = addSizeRow;
window.deleteProduct = deleteProduct;

// Initialize Drag & Drop Uploader
function initDropzone() {
    const dropzone = document.getElementById('dropzone-area');
    const fileInput = document.getElementById('form-product-file');

    if (!dropzone || !fileInput) return;

    ['dragenter', 'dragover'].forEach(eventName => {
        dropzone.addEventListener(eventName, (e) => {
            e.preventDefault();
            e.stopPropagation();
            dropzone.style.borderColor = 'var(--admin-primary)';
            dropzone.style.background = '#e8f5e9';
        });
    });

    ['dragleave', 'drop'].forEach(eventName => {
        dropzone.addEventListener(eventName, (e) => {
            e.preventDefault();
            e.stopPropagation();
            dropzone.style.borderColor = '#cbd5e1';
            dropzone.style.background = '#f8fafc';
        });
    });

    dropzone.addEventListener('drop', (e) => {
        const files = e.dataTransfer.files;
        if (files && files.length > 0) {
            handleFileUpload(files[0]);
        }
    });

    fileInput.addEventListener('change', (e) => {
        if (e.target.files && e.target.files.length > 0) {
            handleFileUpload(e.target.files[0]);
        }
    });
}

async function handleFileUpload(file) {
    if (!file || !file.type.startsWith('image/')) {
        alert('Please upload a valid image file (PNG, JPG, JPEG, WEBP).');
        return;
    }

    // Immediate Preview
    const reader = new FileReader();
    reader.onload = (e) => {
        document.getElementById('image-preview').src = e.target.result;
    };
    reader.readAsDataURL(file);

    // Upload to server via Multer
    const formData = new FormData();
    formData.append('image', file);

    try {
        const res = await fetch(`${API_BASE}/api/products/upload`, {
            method: 'POST',
            headers: { 'Authorization': 'Bearer ' + authToken },
            body: formData
        });
        const data = await res.json();
        if (data.success && data.imageUrl) {
            document.getElementById('form-product-image-url').value = data.imageUrl;
            document.querySelectorAll('.preset-thumb').forEach(t => t.classList.remove('active'));
            showToast('Image uploaded and linked successfully!');
        } else {
            alert(data.message || 'Image upload failed');
        }
    } catch (err) {
        console.error('Image upload failed:', err);
        showToast('Image upload failed, using local preview');
    }
}

// Product Form Submit (Create / Edit)
function initProductForm() {
    const form = document.getElementById('product-form');
    if (!form) return;

    // Sync base price field with size rows
    const basePriceInput = document.getElementById('form-product-price');
    if (basePriceInput) {
        basePriceInput.addEventListener('input', () => {
            const firstSizePrice = document.querySelector('.size-row .size-price');
            if (firstSizePrice) {
                firstSizePrice.value = basePriceInput.value;
            }
        });
    }

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const id = document.getElementById('form-product-id').value;
        const name = document.getElementById('form-product-name').value.trim();
        const category = document.getElementById('form-product-category').value;
        const price = parseFloat(document.getElementById('form-product-price').value) || 0;
        const description = document.getElementById('form-product-desc').value.trim();
        const ingredients = document.getElementById('form-product-ingredients').value.trim();
        const benefitsRaw = document.getElementById('form-product-benefits').value.trim();
        const inStock = document.getElementById('form-product-stock').value === '1';
        const featured = document.getElementById('form-product-featured').value === '1';
        const image = document.getElementById('form-product-image-url').value || 'images/healthy-mix.jpg';

        // Gather size tiers
        const sizeRows = document.querySelectorAll('.size-row');
        const sizes = [];
        sizeRows.forEach(row => {
            const w = row.querySelector('.size-weight').value.trim();
            const p = parseFloat(row.querySelector('.size-price').value);
            if (w && !isNaN(p)) {
                sizes.push({ weight: w, price: p });
            }
        });

        if (sizes.length === 0) {
            sizes.push({ weight: 'Standard', price: price });
        }

        const benefits = benefitsRaw ? benefitsRaw.split(',').map(b => b.trim()).filter(Boolean) : [];

        const payload = {
            name,
            category,
            price: price || (sizes[0] ? sizes[0].price : 0),
            description,
            ingredients,
            benefits,
            sizes,
            sizesJson: JSON.stringify(sizes),
            inStock,
            featured,
            image
        };

        const isEdit = !!id;
        const endpoint = isEdit ? `${API_BASE}/api/products/${encodeURIComponent(id)}` : `${API_BASE}/api/products`;
        const method = isEdit ? 'PUT' : 'POST';

        const saveBtn = document.getElementById('btn-save-product');
        if (saveBtn) {
            saveBtn.disabled = true;
            saveBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Saving...`;
        }

        try {
            const res = await fetch(endpoint, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + authToken
                },
                body: JSON.stringify(payload)
            });
            const data = await res.json();

            if (data.success) {
                showToast(isEdit ? 'Product updated successfully!' : 'Product added successfully!');
                closeProductModal();
                await loadProducts();
                await loadDashboardStats();
                if (window.StorageService && Array.isArray(currentProducts)) {
                    window.StorageService.saveProducts(currentProducts);
                }
            } else {
                alert(data.message || 'Operation failed');
            }
        } catch (err) {
            console.error('Error saving product:', err);
            alert('Failed to save product: ' + err.message);
        } finally {
            if (saveBtn) {
                saveBtn.disabled = false;
                saveBtn.innerHTML = `<i class="fa-solid fa-floppy-disk"></i> Save Product`;
            }
        }
    });
}

// Delete Product
async function deleteProduct(id) {
    if (!confirm('Are you sure you want to permanently delete this product?')) return;

    try {
        const res = await fetch(`${API_BASE}/api/products/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': 'Bearer ' + authToken }
        });
        const data = await res.json();
        if (data.success) {
            showToast('Product deleted successfully');
            await loadProducts();
            await loadDashboardStats();
        } else {
            alert(data.message || 'Failed to delete');
        }
    } catch (err) {
        console.error('Delete error:', err);
    }
}

// --- CUSTOMERS TAB ---
async function loadCustomers() {
    try {
        const res = await fetch(`${API_BASE}/api/admin/customers`, {
            headers: { 'Authorization': 'Bearer ' + authToken }
        });
        const data = await res.json();
        const tbody = document.querySelector('#customers-table tbody');
        if (!tbody) return;
        tbody.innerHTML = '';

        if (!data.customers || data.customers.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding:30px; color:#94a3b8;">No customer accounts registered yet.</td></tr>';
            return;
        }

        data.customers.forEach(c => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><strong>${c.firstName || ''} ${c.lastName || ''}</strong></td>
                <td>${c.email}</td>
                <td>${c.phone || '—'}</td>
                <td>${new Date(c.createdAt).toLocaleDateString()}</td>
                <td>
                    <button class="btn-icon btn-icon-danger" onclick="deleteCustomer(${c.id})" title="Delete Account">
                        <i class="fa-solid fa-trash"></i>
                    </button>
                </td>
            `;
            tbody.appendChild(tr);
        });
    } catch (err) {
        console.error('Error loading customers:', err);
    }
}

async function deleteCustomer(id) {
    if (!confirm('Are you sure you want to delete this customer account?')) return;
    try {
        const res = await fetch(`${API_BASE}/api/admin/customers/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': 'Bearer ' + authToken }
        });
        const data = await res.json();
        if (data.success) {
            showToast('Customer account deleted');
            loadCustomers();
            loadDashboardStats();
        }
    } catch (err) {
        console.error('Error deleting customer:', err);
    }
}

// --- ENQUIRIES TAB ---
async function loadEnquiries() {
    try {
        const res = await fetch(`${API_BASE}/api/admin/enquiries`, {
            headers: { 'Authorization': 'Bearer ' + authToken }
        });
        const data = await res.json();
        const tbody = document.querySelector('#enquiries-table tbody');
        if (!tbody) return;
        tbody.innerHTML = '';

        if (!data.enquiries || data.enquiries.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding:30px; color:#94a3b8;">No inquiries received yet.</td></tr>';
            return;
        }

        data.enquiries.forEach(e => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><strong>${e.name}</strong></td>
                <td>
                    <div>${e.email}</div>
                    <div style="font-size:0.75rem; color:#64748b;">${e.phone || ''}</div>
                </td>
                <td style="max-width:300px; white-space:pre-wrap;">${e.message}</td>
                <td>
                    <select class="form-control" style="padding:4px 8px; font-size:0.8rem;" onchange="updateEnquiryStatus(${e.id}, this.value)">
                        <option value="NEW" ${e.status === 'NEW' ? 'selected' : ''}>NEW</option>
                        <option value="IN_PROGRESS" ${e.status === 'IN_PROGRESS' ? 'selected' : ''}>IN PROGRESS</option>
                        <option value="RESOLVED" ${e.status === 'RESOLVED' ? 'selected' : ''}>RESOLVED</option>
                    </select>
                </td>
                <td>
                    <button class="btn-icon btn-icon-danger" onclick="deleteEnquiry(${e.id})" title="Delete"><i class="fa-solid fa-trash"></i></button>
                </td>
            `;
            tbody.appendChild(tr);
        });
    } catch (err) {
        console.error('Error loading enquiries:', err);
    }
}

async function updateEnquiryStatus(id, status) {
    try {
        await fetch(`${API_BASE}/api/admin/enquiries/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + authToken },
            body: JSON.stringify({ status })
        });
        showToast('Status updated to ' + status);
        loadDashboardStats();
    } catch (err) {
        console.error('Update status error:', err);
    }
}

async function deleteEnquiry(id) {
    if (!confirm('Delete this inquiry?')) return;
    try {
        await fetch(`${API_BASE}/api/admin/enquiries/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': 'Bearer ' + authToken }
        });
        showToast('Inquiry deleted');
        loadEnquiries();
        loadDashboardStats();
    } catch (err) {
        console.error('Delete enquiry error:', err);
    }
}

// --- REVIEWS TAB ---
async function loadReviews() {
    try {
        const res = await fetch(`${API_BASE}/api/admin/reviews`, {
            headers: { 'Authorization': 'Bearer ' + authToken }
        });
        const data = await res.json();
        const tbody = document.querySelector('#reviews-table tbody');
        if (!tbody) return;
        tbody.innerHTML = '';

        if (!data.reviews || data.reviews.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding:30px; color:#94a3b8;">No customer reviews submitted yet.</td></tr>';
            return;
        }

        data.reviews.forEach(r => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><span class="badge badge-gray">${r.product_id || 'General'}</span></td>
                <td><strong>${r.user_name}</strong></td>
                <td>★ ${r.rating} / 5</td>
                <td style="max-width:320px;">${r.comment}</td>
                <td>
                    <button class="btn-icon btn-icon-danger" onclick="deleteReview(${r.id})" title="Delete Review"><i class="fa-solid fa-trash"></i></button>
                </td>
            `;
            tbody.appendChild(tr);
        });
    } catch (err) {
        console.error('Error loading reviews:', err);
    }
}

async function deleteReview(id) {
    if (!confirm('Delete this customer review?')) return;
    try {
        await fetch(`${API_BASE}/api/admin/reviews/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': 'Bearer ' + authToken }
        });
        showToast('Review removed');
        loadReviews();
        loadDashboardStats();
    } catch (err) {
        console.error('Delete review error:', err);
    }
}

// --- ACTIVE CARTS TAB ---
async function loadCart() {
    try {
        const res = await fetch(`${API_BASE}/api/admin/cart`, {
            headers: { 'Authorization': 'Bearer ' + authToken }
        });
        const data = await res.json();
        const tbody = document.querySelector('#cart-table tbody');
        if (!tbody) return;
        tbody.innerHTML = '';

        if (!data.cartItems || data.cartItems.length === 0) {
            tbody.innerHTML = '<tr><td colspan="8" style="text-align:center; padding:30px; color:#94a3b8;">No active shopping carts found.</td></tr>';
            return;
        }

        data.cartItems.forEach(item => {
            const subtotal = (parseFloat(item.price) || 0) * (parseInt(item.quantity) || 1);
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>
                    <div class="table-product-cell">
                        <img class="table-product-img" src="../${item.product_image || 'images/healthy-mix.jpg'}" alt="${item.product_name}" onerror="this.src='../images/healthy-mix.jpg'">
                        <div>
                            <div class="table-product-name">${item.product_name}</div>
                            <div class="table-product-cat">ID: ${item.product_id}</div>
                        </div>
                    </div>
                </td>
                <td>
                    <strong>${item.customer_name || 'Customer'}</strong><br>
                    <span style="font-size:0.8rem; color:#64748b;">${item.customer_email}</span>
                    ${item.customer_phone ? `<br><span style="font-size:0.75rem; color:#64748b;">${item.customer_phone}</span>` : ''}
                </td>
                <td><span class="badge badge-gray">${item.weight || 'Standard'}</span></td>
                <td>Rs. ${item.price}</td>
                <td><strong>${item.quantity}</strong></td>
                <td><strong style="color:var(--admin-primary);">Rs. ${subtotal}</strong></td>
                <td style="font-size:0.8rem; color:#64748b;">${new Date(item.created_at).toLocaleDateString()}</td>
                <td>
                    <button class="btn-icon btn-icon-danger" onclick="deleteCartItem(${item.id})" title="Remove from Cart"><i class="fa-solid fa-trash"></i></button>
                </td>
            `;
            tbody.appendChild(tr);
        });
    } catch (err) {
        console.error('Error loading cart items:', err);
    }
}

async function deleteCartItem(id) {
    if (!confirm('Remove this item from the active cart?')) return;
    try {
        await fetch(`${API_BASE}/api/admin/cart/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': 'Bearer ' + authToken }
        });
        showToast('Cart item removed');
        loadCart();
        loadDashboardStats();
    } catch (err) {
        console.error('Delete cart item error:', err);
    }
}

// --- PLACED ORDERS TAB & APPROVAL WORKFLOW ---
async function loadOrders() {
    try {
        const res = await fetch(`${API_BASE}/api/admin/orders`, {
            headers: { 'Authorization': 'Bearer ' + authToken }
        });
        const data = await res.json();
        currentOrders = data.orders || [];
        const tbody = document.querySelector('#orders-table tbody');
        if (!tbody) return;
        tbody.innerHTML = '';

        if (!currentOrders || currentOrders.length === 0) {
            tbody.innerHTML = '<tr><td colspan="8" style="text-align:center; padding:30px; color:#94a3b8;">No customer orders placed yet.</td></tr>';
            return;
        }

        currentOrders.forEach(o => {
            const itemsText = (o.items && o.items.length) 
                ? o.items.map(i => `<strong>${i.name}</strong> (${i.weight || 'Std'}) × ${i.quantity}`).join('<br>')
                : 'Order Items';

            const isPending = o.status === 'PENDING';
            const isAccepted = o.status === 'ACCEPTED' || o.status === 'CONFIRMED';
            const isDeclined = o.status === 'DECLINED' || o.status === 'CANCELLED';

            let statusBadge = `<span class="badge badge-orange">⏳ Pending Approval</span>`;
            if (isAccepted) statusBadge = `<span class="badge badge-green">✅ Accepted</span>`;
            else if (isDeclined) statusBadge = `<span class="badge badge-red">❌ Declined</span>`;
            else if (o.status === 'SHIPPED') statusBadge = `<span class="badge badge-blue">🚚 Shipped</span>`;
            else if (o.status === 'DELIVERED') statusBadge = `<span class="badge badge-green">📦 Delivered</span>`;

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>
                    <code>${o.orderNumber || 'ORD-' + o.id}</code><br>
                    ${statusBadge}
                </td>
                <td>
                    <strong>${o.customerName}</strong><br>
                    <span style="font-size:0.8rem; color:#64748b;">${o.customerEmail}</span><br>
                    <span style="font-size:0.8rem; color:#64748b;">${o.customerPhone || ''}</span>
                </td>
                <td style="font-size:0.85rem; line-height:1.4;">${itemsText}</td>
                <td><strong style="color:var(--admin-primary); font-size:1rem;">Rs. ${o.totalAmount}</strong></td>
                <td style="max-width:220px; font-size:0.82rem; color:#475569;">${o.shippingAddress}</td>
                <td>
                    <div style="display:flex; flex-direction:column; gap:6px;">
                        ${isPending ? `
                            <div style="display:flex; gap:4px;">
                                <button type="button" onclick="openOrderApprovalModal(${o.id}, 'ACCEPT')" style="background:#16a34a; color:#fff; border:none; padding:5px 8px; border-radius:6px; font-weight:600; font-size:0.78rem; cursor:pointer; display:flex; align-items:center; gap:4px;" title="Approve & Notify Customer">
                                    <i class="fa-solid fa-check"></i> Accept
                                </button>
                                <button type="button" onclick="openOrderApprovalModal(${o.id}, 'DECLINE')" style="background:#dc2626; color:#fff; border:none; padding:5px 8px; border-radius:6px; font-weight:600; font-size:0.78rem; cursor:pointer; display:flex; align-items:center; gap:4px;" title="Decline & Notify Customer">
                                    <i class="fa-solid fa-xmark"></i> Decline
                                </button>
                            </div>
                        ` : `
                            <select class="form-control" style="padding:3px 6px; font-size:0.78rem; font-weight:600; width:auto;" onchange="updateOrderStatus(${o.id}, this.value)">
                                <option value="PENDING" ${o.status === 'PENDING' ? 'selected' : ''}>⏳ Pending</option>
                                <option value="CONFIRMED" ${isAccepted ? 'selected' : ''}>✅ Accepted</option>
                                <option value="SHIPPED" ${o.status === 'SHIPPED' ? 'selected' : ''}>🚚 Shipped</option>
                                <option value="DELIVERED" ${o.status === 'DELIVERED' ? 'selected' : ''}>📦 Delivered</option>
                                <option value="DECLINED" ${isDeclined ? 'selected' : ''}>❌ Declined</option>
                            </select>
                        `}
                    </div>
                </td>
                <td style="font-size:0.8rem; color:#64748b;">${new Date(o.createdAt).toLocaleDateString()}</td>
                <td>
                    <div class="action-btns">
                        <button class="btn-icon" style="color:#25d366;" onclick="openOrderApprovalModal(${o.id}, '${isDeclined ? 'DECLINE' : 'ACCEPT'}')" title="Notify Customer via WhatsApp"><i class="fa-brands fa-whatsapp"></i></button>
                        <button class="btn-icon" style="color:#0284c7;" onclick="openOrderApprovalModal(${o.id}, '${isDeclined ? 'DECLINE' : 'ACCEPT'}')" title="Notify Customer via Email"><i class="fa-solid fa-envelope"></i></button>
                        <button class="btn-icon btn-icon-danger" onclick="deleteOrder(${o.id})" title="Delete Order Record"><i class="fa-solid fa-trash"></i></button>
                    </div>
                </td>
            `;
            tbody.appendChild(tr);
        });
    } catch (err) {
        console.error('Error loading orders:', err);
    }
}

// --- ORDER APPROVAL & NOTIFICATION MODAL ---
function openOrderApprovalModal(orderId, actionType) {
    const order = currentOrders.find(o => o.id === orderId);
    if (!order) return;

    document.getElementById('modal-order-id').value = order.id;
    document.getElementById('modal-order-action-type').value = actionType;

    const titleEl = document.getElementById('modal-order-action-title');
    const summaryEl = document.getElementById('modal-order-summary-box');
    const reasonGroup = document.getElementById('modal-decline-reason-group');
    const customText = document.getElementById('modal-decline-custom-text');

    if (actionType === 'ACCEPT') {
        titleEl.innerHTML = `<span style="color:#16a34a;">✅ Approve Order #${order.orderNumber}</span>`;
        if (reasonGroup) reasonGroup.style.display = 'none';
    } else {
        titleEl.innerHTML = `<span style="color:#dc2626;">❌ Decline Order #${order.orderNumber}</span>`;
        if (reasonGroup) reasonGroup.style.display = 'block';
        if (customText) customText.style.display = 'none';
    }

    const itemsSummary = (order.items && order.items.length) 
        ? order.items.map(i => `${i.name} (${i.weight || 'Std'}) × ${i.quantity}`).join(', ')
        : 'Organic Products';

    summaryEl.innerHTML = `
        <div style="font-size:0.9rem; line-height:1.5;">
            <div><strong>Customer:</strong> ${order.customerName} (${order.customerPhone || 'No phone'} | ${order.customerEmail})</div>
            <div><strong>Items:</strong> ${itemsSummary}</div>
            <div><strong>Total:</strong> <span style="color:var(--admin-primary); font-weight:700;">Rs. ${order.totalAmount}</span></div>
            <div><strong>Shipping:</strong> ${order.shippingAddress}</div>
        </div>
    `;

    updateOrderMessagePreview();
    document.getElementById('order-action-modal').classList.add('active');
}

function closeOrderActionModal() {
    const modal = document.getElementById('order-action-modal');
    if (modal) modal.classList.remove('active');
}

function handleDeclinePresetChange(val) {
    const customText = document.getElementById('modal-decline-custom-text');
    if (customText) {
        customText.style.display = val === 'custom' ? 'block' : 'none';
    }
    updateOrderMessagePreview();
}

function getSelectedDeclineReason() {
    const preset = document.getElementById('modal-decline-preset')?.value || '';
    if (preset === 'custom') {
        return document.getElementById('modal-decline-custom-text')?.value.trim() || 'Unspecified reason';
    }
    return preset;
}

function generateOrderMessageText(order, actionType, reason) {
    if (actionType === 'ACCEPT') {
        return `Hello ${order.customerName},\n\n` +
               `Great news! Your order *#${order.orderNumber}* with *Anuradha Homemade Organics* has been *ACCEPTED & CONFIRMED* ✅\n\n` +
               `📦 *Order Details:*\n` +
               `*Total Amount:* Rs. ${order.totalAmount}\n` +
               `*Delivery Address:* ${order.shippingAddress}\n\n` +
               `🌿 We are carefully handcrafting and packing your fresh organic treats. We will notify you once dispatched!\n\n` +
               `Thank you for trusting Anuradha Homemade Organics.`;
    } else {
        return `Hello ${order.customerName},\n\n` +
               `Regarding your order *#${order.orderNumber}* with *Anuradha Homemade Organics*:\n\n` +
               `We regret to inform you that we are unable to process your order at this time ❌\n\n` +
               `*Reason:* ${reason || 'Items temporarily out of stock'}\n\n` +
               `Please feel free to reach out to us if you have any questions or would like to modify your order.\n\n` +
               `We apologize for any inconvenience caused.`;
    }
}

function updateOrderMessagePreview() {
    const orderId = parseInt(document.getElementById('modal-order-id').value);
    const actionType = document.getElementById('modal-order-action-type').value;
    const order = currentOrders.find(o => o.id === orderId);
    if (!order) return;

    const reason = getSelectedDeclineReason();
    const message = generateOrderMessageText(order, actionType, reason);
    const previewEl = document.getElementById('modal-message-preview');
    if (previewEl) previewEl.textContent = message;
}

document.getElementById('modal-decline-custom-text')?.addEventListener('input', updateOrderMessagePreview);

async function executeOrderNotification(channel) {
    const orderId = parseInt(document.getElementById('modal-order-id').value);
    const actionType = document.getElementById('modal-order-action-type').value;
    const order = currentOrders.find(o => o.id === orderId);
    if (!order) return;

    const newStatus = actionType === 'ACCEPT' ? 'CONFIRMED' : 'DECLINED';
    const reason = getSelectedDeclineReason();
    const messageText = generateOrderMessageText(order, actionType, reason);

    // 1. Update status in backend database
    try {
        await fetch(`${API_BASE}/api/admin/orders/${order.id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + authToken
            },
            body: JSON.stringify({ status: newStatus, declineReason: reason })
        });
    } catch (e) {
        console.error('Order status update error:', e);
    }

    // 2. Dispatch message through requested channel
    if (channel === 'whatsapp') {
        const phone = (order.customerPhone || '').replace(/\D/g, '');
        const targetPhone = phone.length === 10 ? `91${phone}` : phone;
        const waUrl = targetPhone 
            ? `https://wa.me/${targetPhone}?text=${encodeURIComponent(messageText)}`
            : `https://wa.me/?text=${encodeURIComponent(messageText)}`;
        window.open(waUrl, '_blank');
        showToast(`Order ${newStatus.toLowerCase()} & WhatsApp opened!`);
    } else if (channel === 'email') {
        const subject = actionType === 'ACCEPT' 
            ? `Order Confirmed: #${order.orderNumber} - Anuradha Homemade Organics`
            : `Order Update: #${order.orderNumber} - Anuradha Homemade Organics`;
        const mailtoUrl = `mailto:${encodeURIComponent(order.customerEmail)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(messageText)}`;
        window.open(mailtoUrl, '_blank');
        showToast(`Order ${newStatus.toLowerCase()} & Email client opened!`);
    } else {
        showToast(`Order marked as ${newStatus}`);
    }

    closeOrderActionModal();
    loadOrders();
    loadDashboardStats();
}

async function updateOrderStatus(id, status) {
    try {
        await fetch(`${API_BASE}/api/admin/orders/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + authToken
            },
            body: JSON.stringify({ status })
        });
        showToast(`Order status updated to ${status}`);
        loadOrders();
        loadDashboardStats();
    } catch (err) {
        console.error('Update order status error:', err);
    }
}

async function deleteOrder(id) {
    if (!confirm('Are you sure you want to delete this order record?')) return;
    try {
        await fetch(`${API_BASE}/api/admin/orders/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': 'Bearer ' + authToken }
        });
        showToast('Order deleted');
        loadOrders();
        loadDashboardStats();
    } catch (err) {
        console.error('Delete order error:', err);
    }
}

// --- WISHLIST TAB ---
async function loadWishlist() {
    try {
        const res = await fetch(`${API_BASE}/api/admin/wishlist`, {
            headers: { 'Authorization': 'Bearer ' + authToken }
        });
        const data = await res.json();
        const tbody = document.querySelector('#wishlist-table tbody');
        if (!tbody) return;
        tbody.innerHTML = '';

        if (!data.wishlist || data.wishlist.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding:30px; color:#94a3b8;">No wishlist items found.</td></tr>';
            return;
        }

        data.wishlist.forEach(w => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>
                    <div class="table-product-cell">
                        <img class="table-product-img" src="../${w.product_image || 'images/healthy-mix.jpg'}" alt="${w.product_name}" onerror="this.src='../images/healthy-mix.jpg'">
                        <div>
                            <div class="table-product-name">${w.product_name}</div>
                            <div class="table-product-cat">ID: ${w.product_id}</div>
                        </div>
                    </div>
                </td>
                <td>
                    <strong>${w.customer_name || 'Shopper'}</strong><br>
                    <span style="font-size:0.8rem; color:#64748b;">${w.customer_email}</span>
                </td>
                <td><strong>Rs. ${w.product_price || 0}</strong></td>
                <td>${new Date(w.created_at).toLocaleDateString()}</td>
                <td>
                    <button class="btn-icon btn-icon-danger" onclick="deleteWishlistItem(${w.id})" title="Remove Wishlist Entry"><i class="fa-solid fa-trash"></i></button>
                </td>
            `;
            tbody.appendChild(tr);
        });
    } catch (err) {
        console.error('Error loading wishlist:', err);
    }
}

async function deleteWishlistItem(id) {
    if (!confirm('Remove this product from wishlist tracker?')) return;
    try {
        await fetch(`${API_BASE}/api/admin/wishlist/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': 'Bearer ' + authToken }
        });
        showToast('Wishlist item removed');
        loadWishlist();
        loadDashboardStats();
    } catch (err) {
        console.error('Delete wishlist error:', err);
    }
}

// --- ADDRESSES TAB ---
async function loadAddresses() {
    try {
        const res = await fetch(`${API_BASE}/api/admin/addresses`, {
            headers: { 'Authorization': 'Bearer ' + authToken }
        });
        const data = await res.json();
        const tbody = document.querySelector('#addresses-table tbody');
        if (!tbody) return;
        tbody.innerHTML = '';

        if (!data.addresses || data.addresses.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" style="text-align:center; padding:30px; color:#94a3b8;">No customer addresses registered yet.</td></tr>';
            return;
        }

        data.addresses.forEach(a => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><strong>${a.customer_name}</strong></td>
                <td>
                    <span style="font-size:0.85rem; color:#334155;">${a.customer_phone || ''}</span><br>
                    <span style="font-size:0.78rem; color:#64748b;">${a.customer_email}</span>
                </td>
                <td style="max-width:280px; font-size:0.85rem;">${a.street_address}</td>
                <td>${a.city}, ${a.state}</td>
                <td><code>${a.pincode}</code></td>
                <td><span class="badge ${a.address_type === 'Home' ? 'badge-green' : 'badge-blue'}">${a.address_type || 'Home'}</span></td>
                <td>
                    <button class="btn-icon btn-icon-danger" onclick="deleteAddress(${a.id})" title="Delete Address"><i class="fa-solid fa-trash"></i></button>
                </td>
            `;
            tbody.appendChild(tr);
        });
    } catch (err) {
        console.error('Error loading addresses:', err);
    }
}

async function deleteAddress(id) {
    if (!confirm('Delete this customer delivery address?')) return;
    try {
        await fetch(`${API_BASE}/api/admin/addresses/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': 'Bearer ' + authToken }
        });
        showToast('Address removed');
        loadAddresses();
        loadDashboardStats();
    } catch (err) {
        console.error('Delete address error:', err);
    }
}

// Toast Helper
function showToast(msg) {
    const toast = document.getElementById('admin-toast');
    const toastText = document.getElementById('toast-text');
    if (!toast || !toastText) return;

    toastText.textContent = msg;
    toast.classList.add('active');
    setTimeout(() => {
        toast.classList.remove('active');
    }, 3000);
}
