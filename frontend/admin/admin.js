const backendUrl = (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1")
    ? (window.location.port === "8080" ? "" : "http://localhost:8080")
    : "https://anuradha-homemade-products.onrender.com";

let currentAdminUser = null;
let allProducts = [];
let allUsers = [];
let allEnquiries = [];

document.addEventListener("DOMContentLoaded", async () => {
    // 1. Authenticate Admin
    await checkAdminAuth();

    // 2. Setup Navigation Tabs & Mobile Drawer
    setupMobileSidebar();
    setupTabs();

    // 3. Load Overview & Initial Data
    loadStats();
    loadProducts();
    loadUsers();
    loadEnquiries();
    loadFeedbacks();
    loadNewsletters();
    loadLogs();

    // 4. Setup Product Modal & Form
    setupProductModal();

    // 5. Search Filters
    setupSearchFilters();

    // 6. Logout
    document.getElementById("btn-admin-logout").addEventListener("click", handleLogout);
});

// Authentication Check
async function checkAdminAuth() {
    const token = localStorage.getItem("auth_token");
    const headers = { "Accept": "application/json" };
    if (token) {
        headers["Authorization"] = `Bearer ${token}`;
    }

    try {
        const response = await fetch(`${backendUrl}/api/auth/me`, {
            method: "GET",
            headers: headers,
            credentials: "include"
        });

        if (response.ok) {
            const data = await response.json();
            const user = data.user;
            if (user && user.role === "ADMIN") {
                currentAdminUser = user;
                document.getElementById("admin-user-name").textContent = user.firstName + " " + user.lastName;
                document.getElementById("admin-avatar").textContent = (user.firstName || "A")[0].toUpperCase();
                const overviewEmail = document.getElementById("admin-overview-email");
                if (overviewEmail) overviewEmail.textContent = user.email;
                return;
            }
        }
        // Non-admin or unauthenticated
        console.warn("Access denied: Admin role required.");
        window.location.href = "../login.html?error=Admin+access+required";
    } catch (e) {
        console.error("Auth check failed", e);
        window.location.href = "../login.html";
    }
}

function getAuthHeaders(isJson = true) {
    const token = localStorage.getItem("auth_token");
    const headers = { "Accept": "application/json" };
    if (isJson) headers["Content-Type"] = "application/json";
    if (token) headers["Authorization"] = `Bearer ${token}`;
    return headers;
}

// Mobile Sidebar Drawer
function setupMobileSidebar() {
    const sidebar = document.getElementById("admin-sidebar");
    const backdrop = document.getElementById("sidebar-backdrop");
    const btnToggle = document.getElementById("btn-toggle-sidebar");
    const btnClose = document.getElementById("btn-close-sidebar");

    function openSidebar() {
        if (sidebar) sidebar.classList.add("open");
        if (backdrop) backdrop.classList.add("active");
        document.body.style.overflow = "hidden";
    }

    function closeSidebar() {
        if (sidebar) sidebar.classList.remove("open");
        if (backdrop) backdrop.classList.remove("active");
        document.body.style.overflow = "";
    }

    if (btnToggle) btnToggle.addEventListener("click", openSidebar);
    if (btnClose) btnClose.addEventListener("click", closeSidebar);
    if (backdrop) backdrop.addEventListener("click", closeSidebar);

    window.closeMobileSidebar = closeSidebar;
}

// Tabs Switching
function setupTabs() {
    const menuButtons = document.querySelectorAll(".sidebar-menu .menu-item");
    const tabPanels = document.querySelectorAll(".tab-panel");
    const pageTitle = document.getElementById("page-title");

    menuButtons.forEach(btn => {
        btn.addEventListener("click", () => {
            menuButtons.forEach(b => b.classList.remove("active"));
            tabPanels.forEach(p => p.classList.remove("active"));

            btn.classList.add("active");
            const targetTab = btn.getAttribute("data-tab");
            const targetPanel = document.getElementById(`tab-${targetTab}`);
            if (targetPanel) targetPanel.classList.add("active");

            // Update title
            const tabName = btn.querySelector("span").textContent;
            pageTitle.textContent = tabName === "Overview" ? "Dashboard Overview" : tabName;

            // Close mobile sidebar on tab select
            if (window.closeMobileSidebar) window.closeMobileSidebar();
        });
    });

    const quickAdd = document.getElementById("btn-quick-add-product");
    if (quickAdd) {
        quickAdd.addEventListener("click", () => {
            const prodTabBtn = document.querySelector('[data-tab="products"]');
            if (prodTabBtn) prodTabBtn.click();
            openProductModal();
        });
    }
}

// 1. STATS OVERVIEW
async function loadStats() {
    try {
        const res = await fetch(`${backendUrl}/api/admin/stats`, {
            headers: getAuthHeaders(false),
            credentials: "include"
        });
        if (res.ok) {
            const data = await res.json();
            document.getElementById("stat-products").textContent = data.totalProducts || 0;
            document.getElementById("stat-users").textContent = data.totalUsers || 0;
            document.getElementById("stat-enquiries").textContent = data.totalEnquiries || 0;
            document.getElementById("stat-feedbacks").textContent = data.totalFeedbacks || 0;
            document.getElementById("stat-subscribers").textContent = data.totalSubscribers || 0;
        }
    } catch (e) {
        console.error("Failed to load stats", e);
    }
}

// 2. PRODUCTS MANAGEMENT
async function loadProducts() {
    const tbody = document.getElementById("products-table-body");
    try {
        const res = await fetch(`${backendUrl}/api/admin/products`, {
            headers: getAuthHeaders(false),
            credentials: "include"
        });
        if (res.ok) {
            allProducts = await res.json();
            document.getElementById("products-count").textContent = allProducts.length;
            renderProductsTable(allProducts);
        }
    } catch (e) {
        tbody.innerHTML = `<tr><td colspan="8" style="text-align:center; color: var(--danger);">Failed to load products</td></tr>`;
    }
}

function renderProductsTable(products) {
    const tbody = document.getElementById("products-table-body");
    if (!products.length) {
        tbody.innerHTML = `<tr><td colspan="8" style="text-align:center; color: var(--text-muted);">No products found</td></tr>`;
        return;
    }

    tbody.innerHTML = products.map(p => `
        <tr>
            <td><img src="../${p.image}" alt="${p.name}" style="width: 44px; height: 44px; object-fit: cover; border-radius: 8px; border: 1px solid var(--border-color);" onerror="this.src='../images/amla-powder-v3.jpg'"></td>
            <td><strong>${escapeHtml(p.name)}</strong><br><small style="color: var(--text-muted);">${escapeHtml(p.id)}</small></td>
            <td><span class="badge badge-info">${escapeHtml(p.category)}</span></td>
            <td><strong>₹${p.price}</strong></td>
            <td>⭐ ${p.rating} (${p.reviewsCount})</td>
            <td>${p.inStock ? '<span class="badge badge-success">In Stock</span>' : '<span class="badge badge-danger">Out of Stock</span>'}</td>
            <td>${p.featured ? '<span class="badge badge-purple">Yes</span>' : '<span style="color: var(--text-muted);">No</span>'}</td>
            <td>
                <div class="action-btns">
                    <button class="btn-icon edit" onclick="editProduct('${p.id}')" title="Edit Product">
                        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                    </button>
                    <button class="btn-icon delete" onclick="deleteProduct('${p.id}', '${escapeHtml(p.name)}')" title="Delete Product">
                        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                    </button>
                </div>
            </td>
        </tr>
    `).join("");
}

// Product Modal
function setupProductModal() {
    const modal = document.getElementById("product-modal");
    const btnOpen = document.getElementById("btn-open-add-product");
    const btnClose = document.getElementById("btn-close-modal");
    const btnCancel = document.getElementById("btn-cancel-modal");
    const form = document.getElementById("product-form");
    const imgInput = document.getElementById("prod-image");
    const imgPreview = document.getElementById("prod-img-preview");
    const btnChooseFile = document.getElementById("btn-choose-file");
    const fileInput = document.getElementById("prod-file-input");
    const imgHint = document.getElementById("image-filename-hint");
    const btnSave = document.getElementById("btn-save-modal-product");

    let isUploadingImage = false;

    // File picker click
    if (btnChooseFile && fileInput) {
        btnChooseFile.addEventListener("click", () => fileInput.click());

        fileInput.addEventListener("change", async (e) => {
            const file = e.target.files[0];
            if (!file) return;

            isUploadingImage = true;
            if (imgHint) imgHint.textContent = `Uploading ${file.name} (${Math.round(file.size / 1024)} KB)...`;

            // Read preview instantly
            const reader = new FileReader();
            reader.onload = function(evt) {
                if (imgPreview) imgPreview.src = evt.target.result;
            };
            reader.readAsDataURL(file);

            // Upload to backend
            try {
                const formData = new FormData();
                formData.append("file", file);
                const uploadHeaders = {};
                const token = localStorage.getItem("auth_token");
                if (token) uploadHeaders["Authorization"] = `Bearer ${token}`;

                const upRes = await fetch(`${backendUrl}/api/admin/upload-image`, {
                    method: "POST",
                    headers: uploadHeaders,
                    credentials: "include",
                    body: formData
                });
                const upData = await upRes.json();
                if (upRes.ok && upData.imageUrl) {
                    if (imgInput) imgInput.value = upData.imageUrl;
                    if (imgHint) imgHint.textContent = `Uploaded: ${file.name} ✔`;
                } else {
                    console.warn("Upload returned error, using fallback:", upData);
                    if (imgHint) imgHint.textContent = `Selected: ${file.name} (Ready)`;
                }
            } catch (err) {
                console.warn("Upload error:", err);
                if (imgHint) imgHint.textContent = `Selected: ${file.name}`;
            } finally {
                isUploadingImage = false;
            }
        });
    }

    if (btnOpen) btnOpen.addEventListener("click", () => openProductModal());
    if (btnClose) btnClose.addEventListener("click", () => modal.classList.remove("active"));
    if (btnCancel) btnCancel.addEventListener("click", () => modal.classList.remove("active"));

    if (form) {
        form.addEventListener("submit", async (e) => {
            e.preventDefault();
            const id = document.getElementById("prod-form-id").value;
            const name = document.getElementById("prod-name").value.trim();
            const category = document.getElementById("prod-category").value;
            const priceVal = document.getElementById("prod-price").value.trim();
            const price = parseFloat(priceVal);
            const rating = parseFloat(document.getElementById("prod-rating").value) || 5.0;
            const reviewsCount = parseInt(document.getElementById("prod-reviews").value) || 0;
            let image = document.getElementById("prod-image").value.trim();
            const description = document.getElementById("prod-desc").value.trim();
            const ingredients = document.getElementById("prod-ingredients").value.trim();
            const sizesRaw = document.getElementById("prod-sizes").value.trim();
            const inStock = document.getElementById("prod-stock").checked;
            const featured = document.getElementById("prod-featured").checked;

            if (!name) {
                showToast("Product name is required", "error");
                return;
            }

            if (!priceVal || isNaN(price) || price <= 0) {
                showToast("Please enter a valid base price in ₹", "error");
                return;
            }

            if (!image) {
                image = "images/healthy-mix.jpg";
            }

            // Smart sizes formatter
            let sizesJson = sizesRaw;
            if (sizesRaw) {
                if (!sizesRaw.startsWith("[")) {
                    const weights = sizesRaw.split(",").map(s => s.trim()).filter(Boolean);
                    if (weights.length) {
                        sizesJson = JSON.stringify(weights.map((w, idx) => ({
                            weight: w,
                            price: idx === 0 ? price : Math.round(price * (1 + idx * 0.85))
                        })));
                    } else {
                        sizesJson = JSON.stringify([{ weight: "Standard", price: price }]);
                    }
                }
            } else {
                sizesJson = JSON.stringify([
                    { weight: "250g", price: price },
                    { weight: "500g", price: Math.round(price * 1.85) }
                ]);
            }

            const productData = {
                name, category, price, rating, reviewsCount, image,
                description, ingredients, sizesJson, inStock, featured
            };

            if (btnSave) {
                btnSave.disabled = true;
                btnSave.innerHTML = `<span>Saving...</span>`;
            }

            try {
                let url = `${backendUrl}/api/admin/products`;
                let method = "POST";

                if (id) {
                    url = `${backendUrl}/api/admin/products/${encodeURIComponent(id)}`;
                    method = "PUT";
                    productData.id = id;
                }

                const res = await fetch(url, {
                    method: method,
                    headers: getAuthHeaders(true),
                    credentials: "include",
                    body: JSON.stringify(productData)
                });

                const resData = await res.json();

                if (res.ok && resData.success !== false) {
                    showToast(id ? "Product updated successfully!" : "Product created successfully!", "success");
                    modal.classList.remove("active");
                    await loadProducts();
                    await loadStats();
                } else {
                    showToast(resData.message || "Failed to save product", "error");
                }
            } catch (err) {
                console.error("Save product error", err);
                showToast("Network error saving product", "error");
            } finally {
                if (btnSave) {
                    btnSave.disabled = false;
                    btnSave.innerHTML = `<span>Save Product</span>`;
                }
            }
        });
    }
}

function openProductModal(prod = null) {
    const modal = document.getElementById("product-modal");
    const title = document.getElementById("modal-product-title");
    const form = document.getElementById("product-form");
    const imgPreview = document.getElementById("prod-img-preview");
    const imgHint = document.getElementById("image-filename-hint");
    const fileInput = document.getElementById("prod-file-input");
    form.reset();
    if (fileInput) fileInput.value = "";

    if (prod) {
        title.textContent = "Edit Product: " + prod.name;
        document.getElementById("prod-form-id").value = prod.id;
        document.getElementById("prod-name").value = prod.name;
        document.getElementById("prod-category").value = prod.category;
        document.getElementById("prod-price").value = prod.price;
        document.getElementById("prod-rating").value = prod.rating;
        document.getElementById("prod-reviews").value = prod.reviewsCount;
        document.getElementById("prod-image").value = prod.image;
        if (imgPreview) imgPreview.src = prod.image.startsWith("data:") ? prod.image : "../" + prod.image;
        if (imgHint) imgHint.textContent = "Current image loaded";
        document.getElementById("prod-desc").value = prod.description || "";
        document.getElementById("prod-ingredients").value = prod.ingredients || "";
        document.getElementById("prod-sizes").value = prod.sizesJson || "";
        document.getElementById("prod-stock").checked = prod.inStock !== false;
        document.getElementById("prod-featured").checked = prod.featured === true;
    } else {
        title.textContent = "Add New Product";
        document.getElementById("prod-form-id").value = "";
        document.getElementById("prod-price").value = "";
        document.getElementById("prod-rating").value = "5.0";
        document.getElementById("prod-reviews").value = "0";
        document.getElementById("prod-image").value = "images/healthy-mix.jpg";
        if (imgPreview) imgPreview.src = "../images/healthy-mix.jpg";
        if (imgHint) imgHint.textContent = "JPG, PNG, WebP supported";
        document.getElementById("prod-stock").checked = true;
        document.getElementById("prod-featured").checked = false;
    }

    modal.classList.add("active");
}

window.editProduct = function(id) {
    const prod = allProducts.find(p => p.id === id);
    if (prod) {
        openProductModal(prod);
    }
};

window.deleteProduct = async function(id, name) {
    if (!confirm(`Are you sure you want to delete the product "${name}"?`)) return;

    try {
        const res = await fetch(`${backendUrl}/api/admin/products/${encodeURIComponent(id)}`, {
            method: "DELETE",
            headers: getAuthHeaders(false),
            credentials: "include"
        });

        if (res.ok) {
            showToast("Product deleted successfully", "success");
            loadProducts();
            loadStats();
        } else {
            showToast("Failed to delete product", "error");
        }
    } catch (e) {
        showToast("Network error deleting product", "error");
    }
};

// 3. CUSTOMER ACCOUNTS MANAGEMENT
async function loadUsers() {
    const tbody = document.getElementById("users-table-body");
    try {
        const res = await fetch(`${backendUrl}/api/admin/users`, {
            headers: getAuthHeaders(false),
            credentials: "include"
        });
        if (res.ok) {
            allUsers = await res.json();
            // Filter to ensure only CUSTOMER role is listed
            allUsers = allUsers.filter(u => u.role === "CUSTOMER");
            document.getElementById("users-count").textContent = allUsers.length;
            renderUsersTable(allUsers);
        }
    } catch (e) {
        tbody.innerHTML = `<tr><td colspan="8" style="text-align:center; color: var(--danger);">Failed to load customers</td></tr>`;
    }
}

function renderUsersTable(users) {
    const tbody = document.getElementById("users-table-body");
    if (!users.length) {
        tbody.innerHTML = `<tr><td colspan="8" style="text-align:center; color: var(--text-muted);">No registered customer accounts found</td></tr>`;
        return;
    }

    tbody.innerHTML = users.map(u => `
        <tr>
            <td><strong>#${u.id}</strong></td>
            <td><strong>${escapeHtml(u.firstName)} ${escapeHtml(u.lastName)}</strong></td>
            <td><code>${escapeHtml(u.email)}</code></td>
            <td><span class="badge ${u.authProvider === 'GOOGLE' ? 'badge-info' : 'badge-purple'}">${u.authProvider}</span></td>
            <td>${u.emailVerified ? '<span class="badge badge-success">Verified</span>' : '<span class="badge badge-warning">Unverified</span>'}</td>
            <td><span class="badge badge-success">CUSTOMER</span></td>
            <td>${formatDate(u.createdAt)}</td>
            <td>
                <div class="action-btns">
                    <button class="btn-icon delete" onclick="deleteUser(${u.id}, '${escapeHtml(u.email)}')" title="Delete Customer Account">
                        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                    </button>
                </div>
            </td>
        </tr>
    `).join("");
}

window.deleteUser = async function(id, email) {
    if (!confirm(`Are you sure you want to delete customer account: ${email}?`)) return;

    try {
        const res = await fetch(`${backendUrl}/api/admin/users/${id}`, {
            method: "DELETE",
            headers: getAuthHeaders(false),
            credentials: "include"
        });
        const data = await res.json();
        if (res.ok && data.success !== false) {
            showToast(data.message || "Customer account deleted successfully", "success");
            await loadUsers();
            await loadStats();
        } else {
            showToast(data.message || "Failed to delete customer", "error");
        }
    } catch (e) {
        console.error("Delete customer error", e);
        showToast("Error deleting customer", "error");
    }
};

// 4. ENQUIRIES MANAGEMENT
async function loadEnquiries() {
    const tbody = document.getElementById("enquiries-table-body");
    try {
        const res = await fetch(`${backendUrl}/api/admin/enquiries`, {
            headers: getAuthHeaders(false),
            credentials: "include"
        });
        if (res.ok) {
            allEnquiries = await res.json();
            document.getElementById("enquiries-count").textContent = allEnquiries.length;
            renderEnquiriesTable(allEnquiries);
        }
    } catch (e) {
        tbody.innerHTML = `<tr><td colspan="8" style="text-align:center; color: var(--danger);">Failed to load enquiries</td></tr>`;
    }
}

function renderEnquiriesTable(enquiries) {
    const tbody = document.getElementById("enquiries-table-body");
    if (!enquiries.length) {
        tbody.innerHTML = `<tr><td colspan="8" style="text-align:center; color: var(--text-muted);">No enquiries found</td></tr>`;
        return;
    }

    tbody.innerHTML = enquiries.map(e => `
        <tr>
            <td><strong>#${e.id}</strong></td>
            <td><strong>${escapeHtml(e.name)}</strong></td>
            <td><a href="tel:${e.phone}" style="color: var(--primary-color); font-weight: 500;">${escapeHtml(e.phone)}</a></td>
            <td>${escapeHtml(e.email || '-')}</td>
            <td style="max-width: 250px; font-size: 12px;">${escapeHtml(e.message)}</td>
            <td>
                <select onchange="updateEnquiryStatus(${e.id}, this.value)" style="padding: 4px 8px; border-radius: 6px; border: 1px solid var(--border-color); font-size: 12px; font-weight: 600;">
                    <option value="NEW" ${e.status === 'NEW' ? 'selected' : ''}>NEW</option>
                    <option value="IN_PROGRESS" ${e.status === 'IN_PROGRESS' ? 'selected' : ''}>IN PROGRESS</option>
                    <option value="RESOLVED" ${e.status === 'RESOLVED' ? 'selected' : ''}>RESOLVED</option>
                </select>
            </td>
            <td>${formatDate(e.createdAt)}</td>
            <td>
                <div class="action-btns">
                    <button class="btn-icon delete" onclick="deleteEnquiry(${e.id})" title="Delete Enquiry">
                        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                    </button>
                </div>
            </td>
        </tr>
    `).join("");
}

window.updateEnquiryStatus = async function(id, status) {
    try {
        const res = await fetch(`${backendUrl}/api/admin/enquiries/${id}/status`, {
            method: "PUT",
            headers: getAuthHeaders(true),
            credentials: "include",
            body: JSON.stringify({ status })
        });
        if (res.ok) {
            showToast(`Enquiry #${id} marked as ${status}`, "success");
        } else {
            showToast("Failed to update status", "error");
        }
    } catch (e) {
        showToast("Error updating status", "error");
    }
};

window.deleteEnquiry = async function(id) {
    if (!confirm(`Delete enquiry #${id}?`)) return;

    try {
        const res = await fetch(`${backendUrl}/api/admin/enquiries/${id}`, {
            method: "DELETE",
            headers: getAuthHeaders(false),
            credentials: "include"
        });
        if (res.ok) {
            showToast("Enquiry deleted", "success");
            loadEnquiries();
            loadStats();
        } else {
            showToast("Failed to delete enquiry", "error");
        }
    } catch (e) {
        showToast("Error deleting enquiry", "error");
    }
};

// 5. FEEDBACKS / REVIEWS
async function loadFeedbacks() {
    const tbody = document.getElementById("feedbacks-table-body");
    try {
        const res = await fetch(`${backendUrl}/api/admin/feedbacks`, {
            headers: getAuthHeaders(false),
            credentials: "include"
        });
        if (res.ok) {
            const feedbacks = await res.json();
            document.getElementById("feedbacks-count").textContent = feedbacks.length;
            if (!feedbacks.length) {
                tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; color: var(--text-muted);">No reviews found</td></tr>`;
                return;
            }
            tbody.innerHTML = feedbacks.map(f => `
                <tr>
                    <td><strong>#${f.id}</strong></td>
                    <td><strong>${escapeHtml(f.name)}</strong></td>
                    <td><span class="badge badge-info">${escapeHtml(f.location || 'Verified Buyer')}</span></td>
                    <td>⭐ ${f.rating} / 5</td>
                    <td style="max-width: 300px;">"${escapeHtml(f.comment)}"</td>
                    <td>${formatDate(f.createdAt)}</td>
                    <td>
                        <div class="action-btns">
                            <button class="btn-icon delete" onclick="deleteFeedback(${f.id})" title="Delete Review">
                                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                            </button>
                        </div>
                    </td>
                </tr>
            `).join("");
        }
    } catch (e) {
        tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; color: var(--danger);">Failed to load feedbacks</td></tr>`;
    }
}

window.deleteFeedback = async function(id) {
    if (!confirm(`Delete review #${id}?`)) return;

    try {
        const res = await fetch(`${backendUrl}/api/admin/feedbacks/${id}`, {
            method: "DELETE",
            headers: getAuthHeaders(false),
            credentials: "include"
        });
        if (res.ok) {
            showToast("Review deleted", "success");
            loadFeedbacks();
            loadStats();
        } else {
            showToast("Failed to delete review", "error");
        }
    } catch (e) {
        showToast("Error deleting review", "error");
    }
};

// 6. NEWSLETTER
async function loadNewsletters() {
    const tbody = document.getElementById("newsletters-table-body");
    try {
        const res = await fetch(`${backendUrl}/api/admin/newsletters`, {
            headers: getAuthHeaders(false),
            credentials: "include"
        });
        if (res.ok) {
            const subs = await res.json();
            document.getElementById("newsletters-count").textContent = subs.length;
            if (!subs.length) {
                tbody.innerHTML = `<tr><td colspan="4" style="text-align:center; color: var(--text-muted);">No subscribers yet</td></tr>`;
                return;
            }
            tbody.innerHTML = subs.map(s => `
                <tr>
                    <td><strong>#${s.id}</strong></td>
                    <td><strong>${escapeHtml(s.email)}</strong></td>
                    <td>${formatDate(s.subscribedAt)}</td>
                    <td>
                        <div class="action-btns">
                            <button class="btn-icon delete" onclick="deleteNewsletter(${s.id}, '${escapeHtml(s.email)}')" title="Remove Subscriber">
                                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                            </button>
                        </div>
                    </td>
                </tr>
            `).join("");
        }
    } catch (e) {
        tbody.innerHTML = `<tr><td colspan="4" style="text-align:center; color: var(--danger);">Failed to load subscribers</td></tr>`;
    }
}

window.deleteNewsletter = async function(id, email) {
    if (!confirm(`Remove ${email} from newsletter list?`)) return;

    try {
        const res = await fetch(`${backendUrl}/api/admin/newsletters/${id}`, {
            method: "DELETE",
            headers: getAuthHeaders(false),
            credentials: "include"
        });
        if (res.ok) {
            showToast("Subscriber removed", "success");
            loadNewsletters();
            loadStats();
        } else {
            showToast("Failed to remove subscriber", "error");
        }
    } catch (e) {
        showToast("Error removing subscriber", "error");
    }
};

// 7. LOGIN LOGS
async function loadLogs() {
    const tbody = document.getElementById("logs-table-body");
    try {
        const res = await fetch(`${backendUrl}/api/admin/login-logs`, {
            headers: getAuthHeaders(false),
            credentials: "include"
        });
        if (res.ok) {
            const logs = await res.json();
            if (!logs.length) {
                tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; color: var(--text-muted);">No login activity logged yet</td></tr>`;
                return;
            }
            tbody.innerHTML = logs.slice(0, 50).map(l => `
                <tr>
                    <td>#${l.id}</td>
                    <td><strong>${escapeHtml(l.email)}</strong></td>
                    <td><span class="badge ${l.loginStatus === 'SUCCESS' ? 'badge-success' : 'badge-danger'}">${l.loginStatus}</span></td>
                    <td><span class="badge badge-info">${l.authProvider}</span></td>
                    <td><code>${escapeHtml(l.ipAddress || '127.0.0.1')}</code></td>
                    <td>${formatDate(l.loginTime)}</td>
                </tr>
            `).join("");
        }
    } catch (e) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; color: var(--danger);">Failed to load logs</td></tr>`;
    }
}

// Search Filters
function setupSearchFilters() {
    const searchProd = document.getElementById("search-products");
    if (searchProd) {
        searchProd.addEventListener("input", (e) => {
            const q = e.target.value.toLowerCase().trim();
            const filtered = allProducts.filter(p => p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q) || p.id.toLowerCase().includes(q));
            renderProductsTable(filtered);
        });
    }

    const searchUser = document.getElementById("search-users");
    if (searchUser) {
        searchUser.addEventListener("input", (e) => {
            const q = e.target.value.toLowerCase().trim();
            const filtered = allUsers.filter(u => u.email.toLowerCase().includes(q) || (u.firstName + " " + u.lastName).toLowerCase().includes(q));
            renderUsersTable(filtered);
        });
    }

    const searchEnq = document.getElementById("search-enquiries");
    if (searchEnq) {
        searchEnq.addEventListener("input", (e) => {
            const q = e.target.value.toLowerCase().trim();
            const filtered = allEnquiries.filter(en => en.name.toLowerCase().includes(q) || (en.email || '').toLowerCase().includes(q) || en.phone.includes(q) || en.message.toLowerCase().includes(q));
            renderEnquiriesTable(filtered);
        });
    }
}

// Toast
function showToast(message, type = "success") {
    const toast = document.getElementById("admin-toast");
    const msg = document.getElementById("toast-message");
    msg.textContent = message;
    toast.className = `admin-toast ${type}`;
    toast.style.display = "flex";
    setTimeout(() => {
        toast.style.display = "none";
    }, 3000);
}

// Logout
async function handleLogout() {
    try {
        await fetch(`${backendUrl}/api/auth/logout`, {
            method: "POST",
            headers: getAuthHeaders(false),
            credentials: "include"
        });
    } catch (e) {}

    localStorage.removeItem("auth_token");
    localStorage.removeItem("currentUser");
    window.location.href = "../login.html";
}

function escapeHtml(text) {
    if (!text) return "";
    return text.toString()
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function formatDate(dateStr) {
    if (!dateStr) return "-";
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-IN", {
        day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit"
    });
}
