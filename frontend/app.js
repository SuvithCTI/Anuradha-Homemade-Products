// State variables
let cart = JSON.parse(localStorage.getItem('aho_cart')) || [];
let wishlist = JSON.parse(localStorage.getItem('aho_wishlist')) || [];
let currentFilter = 'all';
let searchQuery = '';
let currentSort = 'default';
let activeReviewIndex = 0;
const BACKEND_API_URL = (window.location.port === "5000" || (window.location.protocol === "https:" && !window.location.port))
  ? window.location.origin
  : (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1" ? "http://localhost:5000" : window.location.origin);

let isAuthenticated = false;

// Default reviews if none exist in LocalStorage
const DEFAULT_REVIEWS = [
  {
    name: "Vijayalakshmi R.",
    location: "Chennai",
    rating: 5,
    text: "The Sprouted Healthy Mix (Sathu Maavu) is excellent. It reminds me of my grandmother's recipe. My toddler loves it every morning!"
  },
  {
    name: "Suresh Kumar",
    location: "Bangalore",
    rating: 5,
    text: "Absolutely pure and rich ghee. The graininess and aroma are superb. Highly recommend the Bilona cow ghee!"
  },
  {
    name: "Ananya Deshpande",
    location: "Hyderabad",
    rating: 4,
    text: "Bought the spicy Amla candy and the sprouted nuts powder. Both products are very clean and fresh. Perfect packaging."
  },
  {
    name: "Meera Patel",
    location: "Mumbai",
    rating: 5,
    text: "The Amla powder is very effective for hair care. I use it weekly and also drink it with warm water. Truly organic!"
  }
];

let reviews = JSON.parse(localStorage.getItem('aho_reviews')) || DEFAULT_REVIEWS;

// WhatsApp Contact Configuration
const WHATSAPP_NUMBER = '919876543210'; // Replace with business number

// Hero Slider State
let currentHeroSlide = 0;
let heroAutoplayTimer = null;

// DOM Elements
document.addEventListener('DOMContentLoaded', () => {
  initApp();
});

function checkAuthStatus() {
  let user = null;
  const token = localStorage.getItem('auth_token');
  try {
    const stored = localStorage.getItem('anuradha_current_user');
    if (stored) user = JSON.parse(stored);
  } catch (e) {}

  if (!user && window.StorageService) {
    user = window.StorageService.getCurrentUser();
  }

  const userBtn = document.getElementById('user-btn');
  if (!userBtn) return;

  // Ensure parent wrapper exists
  let wrapper = userBtn.closest('.user-menu-wrapper');
  if (!wrapper) {
    wrapper = document.createElement('div');
    wrapper.className = 'user-menu-wrapper';
    userBtn.parentNode.insertBefore(wrapper, userBtn);
    wrapper.appendChild(userBtn);
  }

  // Remove stale dropdown if any
  const existingDropdown = wrapper.querySelector('.user-dropdown-menu');
  if (existingDropdown) existingDropdown.remove();

  if (user && (token || user.email)) {
    isAuthenticated = true;
    const initial = (user.firstName ? user.firstName.charAt(0) : (user.email ? user.email.charAt(0) : 'U')).toUpperCase();
    const displayName = user.firstName ? user.firstName : (user.email ? user.email.split('@')[0] : 'User');
    const isAdmin = user.role === 'ADMIN';

    userBtn.className = 'user-profile-pill';
    userBtn.removeAttribute('href');
    userBtn.setAttribute('role', 'button');
    userBtn.setAttribute('aria-label', 'Open Profile Menu');
    userBtn.title = `Signed in as ${user.email}`;
    userBtn.innerHTML = `
      <div class="user-pill-avatar">${initial}</div>
      <span class="user-pill-name">${isAdmin ? 'Admin' : displayName}</span>
      <i class="fa-solid fa-chevron-down" style="font-size: 0.65rem; color: #166534; margin-left: 2px;"></i>
    `;

    // Create dropdown menu
    const dropdown = document.createElement('div');
    dropdown.className = 'user-dropdown-menu';
    dropdown.innerHTML = `
      <div class="user-dropdown-header">
        <strong>${user.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : user.email}</strong>
        <span>${user.email}</span>
      </div>
      ${isAdmin ? `
        <a href="admin/dashboard.html" class="user-dropdown-item">
          <i class="fa-solid fa-gauge-high"></i>
          <span>Admin Dashboard</span>
        </a>
      ` : `
        <a href="customer/dashboard.html" class="user-dropdown-item">
          <i class="fa-solid fa-user-gear"></i>
          <span>My Profile</span>
        </a>
        <button type="button" class="user-dropdown-item" id="menu-view-orders">
          <i class="fa-solid fa-box-open"></i>
          <span>My Orders</span>
        </button>
        <button type="button" class="user-dropdown-item" id="menu-view-cart">
          <i class="fa-solid fa-basket-shopping"></i>
          <span>My Cart</span>
        </button>
        <button type="button" class="user-dropdown-item" id="menu-view-wishlist">
          <i class="fa-solid fa-heart"></i>
          <span>My Wishlist</span>
        </button>
      `}
      <button type="button" class="user-dropdown-item text-danger" id="menu-btn-logout">
        <i class="fa-solid fa-arrow-right-from-bracket"></i>
        <span>Sign Out</span>
      </button>
    `;
    wrapper.appendChild(dropdown);

    // Dropdown toggle
    userBtn.onclick = (e) => {
      e.preventDefault();
      e.stopPropagation();
      dropdown.classList.toggle('active');
    };

    dropdown.querySelector('#menu-view-orders')?.addEventListener('click', (e) => {
      e.stopPropagation();
      dropdown.classList.remove('active');
      document.getElementById('orders-btn')?.click();
    });

    dropdown.querySelector('#menu-view-cart')?.addEventListener('click', (e) => {
      e.stopPropagation();
      dropdown.classList.remove('active');
      document.getElementById('cart-btn')?.click();
    });

    dropdown.querySelector('#menu-view-wishlist')?.addEventListener('click', (e) => {
      e.stopPropagation();
      dropdown.classList.remove('active');
      document.getElementById('wishlist-btn')?.click();
    });

    dropdown.querySelector('#menu-btn-logout')?.addEventListener('click', (e) => {
      e.stopPropagation();
      localStorage.removeItem('auth_token');
      localStorage.removeItem('anuradha_current_user');
      if (window.StorageService) window.StorageService.logout();
      showToast('Signed out successfully');
      setTimeout(() => {
        window.location.reload();
      }, 500);
    });

    document.addEventListener('click', (e) => {
      if (!wrapper.contains(e.target)) {
        dropdown.classList.remove('active');
      }
    });

  } else {
    isAuthenticated = false;
    userBtn.className = 'nav-action-btn';
    userBtn.href = 'login.html';
    userBtn.title = 'Sign In';
    userBtn.setAttribute('aria-label', 'Sign In');
    userBtn.innerHTML = `<i class="fa-regular fa-user"></i>`;
    userBtn.onclick = null;
  }

  // Update Mobile Navigation Drawer with User Profile / Login status
  const navMenu = document.querySelector('.nav-menu');
  if (navMenu) {
    const existingMobileUser = navMenu.querySelector('.mobile-user-section');
    if (existingMobileUser) existingMobileUser.remove();

    const mobileSection = document.createElement('li');
    mobileSection.className = 'mobile-user-section';

    if (user && (token || user.email)) {
      const initial = (user.firstName ? user.firstName.charAt(0) : (user.email ? user.email.charAt(0) : 'U')).toUpperCase();
      const displayName = user.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : (user.email ? user.email.split('@')[0] : 'User');
      const isAdmin = user.role === 'ADMIN';

      mobileSection.innerHTML = `
        <div class="mobile-user-card">
          <div class="mobile-user-avatar">${initial}</div>
          <div class="mobile-user-info">
            <div class="mobile-user-name">${displayName}</div>
            <div class="mobile-user-role">${isAdmin ? '🛡️ Administrator' : '🌿 Verified Customer'}</div>
          </div>
        </div>
        <div class="mobile-user-actions">
          <a href="${isAdmin ? 'admin/dashboard.html' : 'customer/dashboard.html'}" class="btn-mobile-nav-profile">
            <i class="fa-solid fa-${isAdmin ? 'gauge-high' : 'user-gear'}"></i>
            <span>${isAdmin ? 'Admin Panel' : 'My Profile'}</span>
          </a>
          <button type="button" class="btn-mobile-nav-logout" id="mobile-drawer-logout">
            <i class="fa-solid fa-arrow-right-from-bracket"></i>
            <span>Sign Out</span>
          </button>
        </div>
      `;
      navMenu.insertBefore(mobileSection, navMenu.firstChild);

      mobileSection.querySelector('#mobile-drawer-logout')?.addEventListener('click', () => {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('anuradha_current_user');
        if (window.StorageService) window.StorageService.logout();
        showToast('Signed out successfully');
        setTimeout(() => {
          window.location.reload();
        }, 500);
      });
    } else {
      mobileSection.innerHTML = `
        <a href="login.html" class="btn-mobile-nav-login">
          <i class="fa-regular fa-user"></i>
          <span>Sign In / Register</span>
        </a>
      `;
      navMenu.insertBefore(mobileSection, navMenu.firstChild);
    }
  }
}

function getCatalogProducts() {
  if (Array.isArray(window.PRODUCTS) && window.PRODUCTS.length > 0) {
    return window.PRODUCTS;
  }
  if (typeof PRODUCTS !== 'undefined' && Array.isArray(PRODUCTS) && PRODUCTS.length > 0) {
    window.PRODUCTS = PRODUCTS;
    return window.PRODUCTS;
  }
  if (window.StorageService) {
    const list = window.StorageService.getProducts();
    if (Array.isArray(list) && list.length > 0) {
      window.PRODUCTS = list;
      return window.PRODUCTS;
    }
  }
  return [];
}

function applyProductsList(rawList) {
  if (!rawList || !rawList.length) return;
  window.PRODUCTS = rawList.map(p => {
    let sizes = [];
    if (Array.isArray(p.sizes) && p.sizes.length > 0) {
      sizes = p.sizes;
    } else if (p.sizesJson) {
      try {
        sizes = typeof p.sizesJson === 'string' ? JSON.parse(p.sizesJson) : p.sizesJson;
      } catch (e) {
        sizes = [{ weight: "Standard", price: p.price }];
      }
    } else {
      sizes = [{ weight: "Standard", price: p.price }];
    }

    let benefits = [];
    if (Array.isArray(p.benefits)) {
      benefits = p.benefits;
    } else if (p.benefits) {
      try {
        benefits = typeof p.benefits === 'string' && p.benefits.startsWith('[') ? JSON.parse(p.benefits) : [p.benefits];
      } catch (e) {
        benefits = [p.benefits];
      }
    } else {
      benefits = ["100% pure, natural, and preservative-free."];
    }

    const basePrice = (sizes[0] && sizes[0].price) ? sizes[0].price : p.price;

    return {
      id: p.id,
      name: p.name,
      category: p.category,
      price: basePrice,
      rating: p.rating || 5.0,
      reviewsCount: p.reviewsCount || 0,
      image: p.image || 'images/healthy-mix.jpg',
      description: p.description || "",
      ingredients: p.ingredients || "",
      benefits: benefits,
      sizes: sizes,
      inStock: p.inStock !== false,
      featured: p.featured === true
    };
  });
  renderProducts();
  renderFeaturedProducts();
}

function loadProductsFromBackend() {
  try {
    let rawList = [];
    if (window.StorageService) {
      rawList = window.StorageService.getProducts();
    }
    if (!rawList || rawList.length === 0) {
      if (typeof PRODUCTS !== 'undefined' && Array.isArray(PRODUCTS)) {
        rawList = PRODUCTS;
      } else if (Array.isArray(window.PRODUCTS)) {
        rawList = window.PRODUCTS;
      }
    }
    if (rawList && rawList.length > 0) {
      applyProductsList(rawList);
    }

    // Connect to Node/Express SQLite API for live products
    fetch(`${BACKEND_API_URL}/api/products`)
      .then(res => res.json())
      .then(apiProducts => {
        if (Array.isArray(apiProducts) && apiProducts.length > 0) {
          applyProductsList(apiProducts);
          if (window.StorageService) {
            window.StorageService.saveProducts(apiProducts);
          }
        }
      })
      .catch(err => {
        console.log('Using local products cache:', err.message);
      });
  } catch (err) {
    console.warn("Products normalization error:", err);
  }
}

function initApp() {
  checkAuthStatus();
  loadProductsFromBackend();
  initCookieConsent();

  // Initialize dynamic theme and sound toggle
  injectLightLeaks();
  initTimeBasedTheme();
  injectSoundToggle();
  injectKolamTrail();
  injectCheckoutModal();

  // Render products and UI components
  initHeroSlider();
  injectHeroDecoLeaves();
  renderProducts();
  renderFeaturedProducts();
  
  // Inject floating cart button dynamically
  injectFloatingCartButton();
  
  updateCartUI();
  updateWishlistUI();
  updateOrdersCountBadge();
  renderReviews();

  // Initialize the drag-and-drop alchemy mixer
  initAlchemyMixer();
  initGalleryLoupe();

  // Setup Navigation active link on scroll
  setupScrollListener();

  // Set up all event listeners
  setupEventListeners();

  // Apply reveal classes and setup IntersectionObserver
  applyRevealClasses();
  initScrollReveal();

  // Check URL params for verified confirmation
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.has('verified')) {
    const userParam = urlParams.get('user');
    const msg = userParam 
      ? `🎉 Welcome, ${userParam}! Your account is verified and ready.` 
      : '🎉 Email verified successfully! Welcome to Anuradha Homemade Organics.';
    setTimeout(() => {
      showFloatingToast(msg);
    }, 800);
  }
}

function initCookieConsent() {
  const isHomePage = window.location.pathname.endsWith('/index.html') || window.location.pathname.endsWith('/');
  if (!isHomePage || localStorage.getItem('aho_cookie_consent') === 'accepted' || document.cookie.includes('aho_cookie_consent=accepted')) return;

  showCookieConsent(true);
}

function showCookieConsent(isRequired) {
  if (document.getElementById('cookie-consent')) return;

  if (isRequired) document.body.classList.add('cookie-consent-required');

  const consent = document.createElement('div');
  consent.id = 'cookie-consent';
  consent.setAttribute('role', 'dialog');
  consent.setAttribute('aria-modal', 'true');
  consent.setAttribute('aria-labelledby', 'cookie-consent-title');
  consent.innerHTML = `
    <div class="cookie-consent-card">
      <div class="cookie-consent-icon" aria-hidden="true"><i class="fa-solid fa-cookie-bite"></i></div>
      <div class="cookie-consent-copy">
        <h2 id="cookie-consent-title">Cookie consent</h2>
        <p>We use cookies to keep this website working smoothly.</p>
        <details class="cookie-consent-terms">
          <summary>View Terms &amp; Conditions</summary>
          <div class="cookie-consent-terms-content">
            <p>By using Anuradha Homemade Organics, you agree to these basic terms:</p>
            <ul>
              <li>Cookies and local storage may remember your consent, cart, wishlist, and preferences.</li>
              <li>Product availability, prices, delivery charges, and order details may change.</li>
              <li>Orders are confirmed only after we verify the details with you.</li>
              <li>Contact us if you have questions about products, orders, or privacy.</li>
            </ul>
          </div>
        </details>
      </div>
      <div class="cookie-consent-actions">
        <button type="button" class="cookie-reject">Reject</button>
        <button type="button" class="cookie-accept">Accept</button>
      </div>
    </div>
  `;
  document.body.appendChild(consent);

  const acceptButton = consent.querySelector('.cookie-accept');
  const rejectButton = consent.querySelector('.cookie-reject');

  acceptButton.addEventListener('click', () => {
    localStorage.setItem('aho_cookie_consent', 'accepted');
    document.cookie = 'aho_cookie_consent=accepted; max-age=31536000; path=/; SameSite=Lax';
    document.body.classList.remove('cookie-consent-required');
    consent.remove();
  });

  rejectButton.addEventListener('click', () => {
    localStorage.removeItem('aho_cookie_consent');
    document.cookie = 'aho_cookie_consent=; max-age=0; path=/';
    window.location.replace('about:blank');
  });
}

function setupEventListeners() {
  // Mobile Hamburger Toggle
  const menuToggle = document.querySelector('.menu-toggle');
  const navMenu = document.querySelector('.nav-menu');
  const overlay = document.getElementById('drawer-overlay');

  if (menuToggle && navMenu) {
    menuToggle.addEventListener('click', () => {
      const isOpen = navMenu.classList.toggle('active');
      if (overlay) {
        if (isOpen) {
          overlay.classList.add('active');
          document.body.style.overflow = 'hidden';
        } else {
          overlay.classList.remove('active');
          document.body.style.overflow = '';
        }
      }
      const icon = menuToggle.querySelector('i');
      if (icon) {
        if (isOpen) {
          icon.classList.remove('fa-bars');
          icon.classList.add('fa-xmark');
        } else {
          icon.classList.remove('fa-xmark');
          icon.classList.add('fa-bars');
        }
      }
    });

    // Close menu on click of nav items
    document.querySelectorAll('.nav-link, .btn-mobile-nav-profile, .btn-mobile-nav-login').forEach(link => {
      link.addEventListener('click', () => {
        navMenu.classList.remove('active');
        if (overlay) overlay.classList.remove('active');
        document.body.style.overflow = '';
        const icon = menuToggle.querySelector('i');
        if (icon) {
          icon.classList.add('fa-bars');
          icon.classList.remove('fa-xmark');
        }
      });
    });

    if (overlay) {
      overlay.addEventListener('click', () => {
        navMenu.classList.remove('active');
        document.querySelectorAll('.user-dropdown-menu').forEach(d => d.classList.remove('active'));
        document.body.style.overflow = '';
        const icon = menuToggle.querySelector('i');
        if (icon) {
          icon.classList.add('fa-bars');
          icon.classList.remove('fa-xmark');
        }
      });
    }
  }

  // Drawers Open/Close
  setupDrawerListeners('cart-btn', 'cart-drawer', 'cart-close');
  setupDrawerListeners('wishlist-btn', 'wishlist-drawer', 'wishlist-close');
  setupDrawerListeners('orders-btn', 'orders-drawer', 'orders-close');

  // Search Input
  const searchInput = document.getElementById('search-input');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      searchQuery = e.target.value.toLowerCase().trim();
      renderProducts();
    });
  }

  // Sorting
  const sortSelect = document.getElementById('sort-select');
  if (sortSelect) {
    sortSelect.addEventListener('change', (e) => {
      currentSort = e.target.value;
      renderProducts();
    });
  }

  // Category Filter Chips
  const filterChips = document.querySelectorAll('.filter-chip');
  filterChips.forEach(chip => {
    chip.addEventListener('click', () => {
      filterChips.forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      currentFilter = chip.dataset.category;
      renderProducts();
    });
  });

  // Modal Close
  const modal = document.getElementById('product-modal');
  const modalClose = document.querySelector('.modal-close');
  const modalBackdrop = document.querySelector('.modal-backdrop');
  if (modalClose && modalBackdrop && modal) {
    const closeModal = () => modal.classList.remove('open');
    modalClose.addEventListener('click', closeModal);
    modalBackdrop.addEventListener('click', closeModal);
  }

  // Review Slider Nav Buttons
  const nextReviewBtn = document.getElementById('review-next');
  const prevReviewBtn = document.getElementById('review-prev');
  if (nextReviewBtn && prevReviewBtn) {
    nextReviewBtn.addEventListener('click', () => slideReviews(1));
    prevReviewBtn.addEventListener('click', () => slideReviews(-1));
  }

  // Review Submission
  const reviewForm = document.getElementById('review-form');
  if (reviewForm) {
    reviewForm.addEventListener('submit', handleReviewSubmit);
  }

  // Contact Form Submission
  const contactForm = document.getElementById('contact-form');
  if (contactForm) {
    contactForm.addEventListener('submit', handleContactSubmit);
    
    // Quick Inquiry Chips Populate
    document.querySelectorAll('.enquiry-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        const messageInput = document.getElementById('contact-message');
        if (messageInput) {
          messageInput.value = chip.dataset.template || '';
          messageInput.focus();
        }
      });
    });
  }

  // Checkout Button
  const checkoutBtn = document.getElementById('checkout-btn');
  if (checkoutBtn) {
    checkoutBtn.addEventListener('click', openCheckoutModal);
  }

  // Newsletter Subscription Form
  document.querySelectorAll('.newsletter-form').forEach(form => {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const input = form.querySelector('input[type="email"]');
      if (!input || !input.value.trim()) return;
      const email = input.value.trim();

      // Submit to backend API
      fetch(`${BACKEND_API_URL}/api/newsletter`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      })
      .then(res => res.json())
      .then(data => {
        showFloatingToast(data.message || 'Subscribed to newsletter!');
      })
      .catch(() => {
        if (window.StorageService) {
          const res = window.StorageService.addNewsletter(email);
          showFloatingToast(res.message || 'Subscribed to newsletter!');
        } else {
          showFloatingToast('Subscribed to newsletter!');
        }
      });

      if (window.StorageService) {
        window.StorageService.addNewsletter(email);
      }
      form.reset();
    });
  });

  document.addEventListener('click', (e) => {
    if (e.target.closest('.btn-card-add, .btn-card-wishlist, #checkout-btn')) {
      burstKitchenSeeds(e.clientX, e.clientY);
    }
  });
}

// Drawer Trigger Helper
function setupDrawerListeners(triggerId, drawerId, closeId) {
  const trigger = document.getElementById(triggerId);
  const drawer = document.getElementById(drawerId);
  const close = document.getElementById(closeId);
  const overlay = document.getElementById('drawer-overlay');

  if (trigger && drawer && close && overlay) {
    const openDrawer = (e) => {
      if (e) e.preventDefault();

      // Trigger dynamic render for orders drawer
      if (drawerId === 'orders-drawer') {
        renderOrdersDrawer();
      }

      drawer.classList.add('open');
      overlay.classList.add('active');
      
      // Close all other drawers if open
      document.querySelectorAll('.drawer').forEach(d => {
        if (d.id !== drawerId) d.classList.remove('open');
      });
    };

    const closeDrawer = () => {
      drawer.classList.remove('open');
      overlay.classList.remove('active');
    };

    trigger.addEventListener('click', openDrawer);
    close.addEventListener('click', closeDrawer);
    overlay.addEventListener('click', closeDrawer);
  }
}

// Scroll Listener to highlight active Navbar items and make header sticky
function setupScrollListener() {
  const sections = document.querySelectorAll('section');
  const navLinks = document.querySelectorAll('.nav-link');

  window.addEventListener('scroll', () => {
    let current = '';
    const scrollPos = window.pageYOffset || document.documentElement.scrollTop;

    sections.forEach(section => {
      const sectionTop = section.offsetTop - 120;
      const sectionHeight = section.clientHeight;
      if (scrollPos >= sectionTop && scrollPos < sectionTop + sectionHeight) {
        current = section.getAttribute('id');
      }
    });

    navLinks.forEach(link => {
      const href = link.getAttribute('href');
      if (href && href.startsWith('#')) {
        link.classList.remove('active');
        if (href === `#${current}`) {
          link.classList.add('active');
        }
      }
    });

    // Toggle floating cart button visibility based on scroll depth
    handleFloatingCartScroll();

    // Trigger horizontal scrolling on the heritage section
    handleHeritageScroll();

    // Trigger 3D Zoom on background leaves during hero exit scroll
    handleLeafCanopyZoom();
  });
}

// Render Products Grid based on search, filter, and sort
function renderProducts() {
  const grid = document.getElementById('products-grid');
  if (!grid) return;

  const prods = getCatalogProducts();
  if (!prods || prods.length === 0) {
    grid.innerHTML = `
      <div class="no-results">
        <i class="fa-solid fa-seedling"></i>
        <p>Loading fresh organic products...</p>
      </div>
    `;
    return;
  }

  // Filter products
  let filtered = prods.filter(product => {
    const matchesCategory = currentFilter === 'all' || product.category === currentFilter;
    const q = (searchQuery || '').toLowerCase().trim();
    const matchesSearch = !q || 
                          (product.name && product.name.toLowerCase().includes(q)) || 
                          (product.description && product.description.toLowerCase().includes(q)) ||
                          (product.ingredients && product.ingredients.toLowerCase().includes(q));
    return matchesCategory && matchesSearch;
  });

  // Sort products
  if (currentSort === 'price-low') {
    filtered.sort((a, b) => a.price - b.price);
  } else if (currentSort === 'price-high') {
    filtered.sort((a, b) => b.price - a.price);
  } else if (currentSort === 'rating') {
    filtered.sort((a, b) => (b.rating || 5) - (a.rating || 5));
  }

  // Clear grid
  grid.innerHTML = '';

  if (filtered.length === 0) {
    grid.innerHTML = `
      <div class="no-results">
        <i class="fa-solid fa-seedling"></i>
        <p>No products found matching your criteria. Try searching for something else!</p>
      </div>
    `;
    return;
  }

  // Render cards
  filtered.forEach(product => {
    const isWishlisted = wishlist.includes(product.id);
    const defaultSize = product.sizes ? product.sizes[0] : { weight: product.weight, price: product.price };
    const priceText = `Rs. ${defaultSize.price}`;
    const categoryLabels = {
      'amla-products': 'Amla Products',
      'nuts-powders': 'Nuts Powders',
      'healthy-mixes': 'Healthy Mixes',
      'other-organics': 'Other Organics'
    };
    const badgeText = categoryLabels[product.category] || product.category.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

    const card = document.createElement('div');
    card.className = 'product-card';
    card.innerHTML = `
      <div class="product-image-container" onclick="openDetailsModal('${product.id}')" style="cursor: pointer;">
        <img class="product-card-img" src="${product.image}" alt="${product.name}" loading="lazy" onerror="this.onerror=null;this.src='images/healthy-mix.jpg'">
        <span class="product-card-badge">${badgeText}</span>
      </div>
      <div class="product-card-body">
        <div class="product-card-rating">
          <i class="fa-solid fa-star"></i>
          <span>${product.rating.toFixed(1)} (${product.reviewsCount} reviews)</span>
        </div>
        <h3 class="product-card-title" onclick="openDetailsModal('${product.id}')" style="cursor: pointer;">${product.name}</h3>
        <p class="product-card-desc">${product.description}</p>
        <div class="product-card-footer">
          <div class="product-card-price-row">
            <span class="product-card-price">${priceText}</span>
            <span class="product-card-weight">${defaultSize.weight || product.weight}</span>
          </div>
          <div class="product-card-actions">
            <button class="btn-card-add" onclick="addToCart('${product.id}', '${defaultSize.weight}', ${defaultSize.price})">
              <i class="fa-solid fa-cart-shopping"></i> Add
            </button>
            <button class="btn-card-wishlist ${isWishlisted ? 'active' : ''}" onclick="toggleWishlist('${product.id}')" title="Wishlist" aria-label="Add to Wishlist">
              <i class="${isWishlisted ? 'fa-solid' : 'fa-regular'} fa-heart"></i>
            </button>
            <button class="btn-card-detail" onclick="openDetailsModal('${product.id}')" title="View Details">
              <i class="fa-solid fa-eye"></i>
            </button>
          </div>
        </div>
      </div>
    `;
    grid.appendChild(card);
  });
}

// Open Product Details Modal
window.openDetailsModal = function(id) {
  const product = window.PRODUCTS.find(p => p.id === id);
  if (!product) return;

  const modal = document.getElementById('product-modal');
  if (!modal) return;

  // Render modal content
  const title = modal.querySelector('.modal-title');
  const ratingRow = modal.querySelector('.modal-rating-row');
  const price = modal.querySelector('.modal-price');
  const desc = modal.querySelector('.modal-desc');
  const specList = modal.querySelector('.modal-spec-list');
  const sizeSelector = modal.querySelector('.modal-size-selector');
  const modalImg = modal.querySelector('.modal-img');
  const actionRow = modal.querySelector('.modal-actions');

  title.textContent = product.name;
  modalImg.onerror = function() { this.onerror = null; this.src = 'images/healthy-mix.jpg'; };
  modalImg.src = product.image;
  modalImg.alt = product.name;
  desc.textContent = product.description;

  // Rating
  ratingRow.innerHTML = `
    <div class="modal-rating-stars">
      ${Array.from({ length: 5 }, (_, i) => 
        `<i class="${i < Math.floor(product.rating) ? 'fa-solid' : 'fa-regular'} fa-star"></i>`
      ).join('')}
    </div>
    <span class="modal-rating-text">${product.rating.toFixed(1)} (${product.reviewsCount} Verified Customer Reviews)</span>
  `;

  // Specs & Benefits
  specList.innerHTML = `
    <div class="modal-spec-item"><strong>Ingredients:</strong> ${product.ingredients}</div>
    <div class="modal-spec-item">
      <strong>Key Benefits:</strong>
      <ul class="modal-benefits-list">
        ${product.benefits.map(b => `<li>${b}</li>`).join('')}
      </ul>
    </div>
  `;

  // Sizes setup
  let selectedWeight = '';
  let selectedPrice = 0;

  if (product.sizes && product.sizes.length > 0) {
    selectedWeight = product.sizes[0].weight;
    selectedPrice = product.sizes[0].price;
    price.textContent = `Rs. ${selectedPrice}`;

    sizeSelector.style.display = 'block';
    const chipsContainer = sizeSelector.querySelector('.modal-size-chips');
    chipsContainer.innerHTML = '';
    
    product.sizes.forEach((size, idx) => {
      const chip = document.createElement('button');
      chip.className = `size-chip ${idx === 0 ? 'active' : ''}`;
      chip.textContent = size.weight;
      chip.addEventListener('click', () => {
        chipsContainer.querySelectorAll('.size-chip').forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        selectedWeight = size.weight;
        selectedPrice = size.price;
        price.textContent = `Rs. ${selectedPrice}`;
      });
      chipsContainer.appendChild(chip);
    });
  } else {
    // Single default size
    selectedWeight = product.weight;
    selectedPrice = product.price;
    price.textContent = `Rs. ${selectedPrice}`;
    sizeSelector.style.display = 'none';
  }

  // Dynamic Add buttons
  actionRow.innerHTML = `
    <button class="btn btn-primary" onclick="addToCartAndClose('${product.id}', () => getSelectedWeightAndPrice())">
      <i class="fa-solid fa-cart-plus"></i> Add To Cart
    </button>
    <button class="btn btn-secondary" onclick="toggleWishlistFromModal('${product.id}')">
      <i class="fa-solid fa-heart"></i> Wishlist
    </button>
  `;

  // Helper inside modal to grab currently selected values
  window.getSelectedWeightAndPrice = () => {
    return { weight: selectedWeight, price: selectedPrice };
  };

  modal.classList.add('open');
};

window.addToCartAndClose = function(id, getDetailsFn) {
  const details = getDetailsFn();
  addToCart(id, details.weight, details.price);
  
  // Close modal
  const modal = document.getElementById('product-modal');
  if (modal) modal.classList.remove('open');
};

window.toggleWishlistFromModal = function(id) {
  toggleWishlist(id);
  // Close modal
  const modal = document.getElementById('product-modal');
  if (modal) modal.classList.remove('open');
};

// Helper to get active shopper info (Customer or Guest)
function getShopperInfo() {
  const user = window.StorageService ? window.StorageService.getCurrentUser() : null;
  const localEmail = localStorage.getItem('user_email');
  const localName = localStorage.getItem('user_name');
  const localPhone = localStorage.getItem('user_phone');
  
  if (user && user.email) {
    return {
      email: user.email,
      name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email.split('@')[0],
      phone: user.phone || ''
    };
  }
  if (localEmail) {
    return {
      email: localEmail,
      name: localName || 'Shopper',
      phone: localPhone || ''
    };
  }
  let guestId = localStorage.getItem('guest_shopper_id');
  if (!guestId) {
    guestId = 'guest_' + Math.random().toString(36).substring(2, 8);
    localStorage.setItem('guest_shopper_id', guestId);
  }
  return {
    email: `${guestId}@shopper.anuradhaorganics.com`,
    name: `Shopper (${guestId.slice(6)})`,
    phone: ''
  };
}

// Wishlist Logic with Backend API Sync
window.toggleWishlist = async function(id) {
  const shopper = getShopperInfo();
  const product = (window.PRODUCTS || []).find(p => p.id === id);
  const index = wishlist.indexOf(id);

  if (index === -1) {
    wishlist.push(id);
    showFloatingToast('Added to Wishlist!');

    if (product) {
      const defaultSize = (product.sizes && product.sizes.length) ? product.sizes[0] : { weight: product.weight || 'Standard', price: product.price };
      try {
        await fetch(`${BACKEND_API_URL}/api/wishlist`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            customerEmail: shopper.email,
            customerName: shopper.name,
            productId: product.id,
            productName: product.name,
            productPrice: defaultSize.price,
            productImage: product.image
          })
        });
      } catch (e) {
        console.warn('Backend wishlist sync error:', e);
      }
    }
  } else {
    wishlist.splice(index, 1);
    showFloatingToast('Removed from Wishlist');

    try {
      await fetch(`${BACKEND_API_URL}/api/wishlist?email=${encodeURIComponent(shopper.email)}&productId=${encodeURIComponent(id)}`, {
        method: 'DELETE'
      });
    } catch (e) {
      console.warn('Backend wishlist removal error:', e);
    }
  }

  localStorage.setItem('aho_wishlist', JSON.stringify(wishlist));
  updateWishlistUI();
  renderProducts(); // Refresh active state on grid cards
};

function updateWishlistUI() {
  const badge = document.getElementById('wishlist-count');
  const drawerContent = document.getElementById('wishlist-items-container');

  if (badge) {
    badge.textContent = wishlist.length;
    badge.style.display = wishlist.length > 0 ? 'flex' : 'none';
  }

  if (!drawerContent) return;
  drawerContent.innerHTML = '';

  if (wishlist.length === 0) {
    drawerContent.innerHTML = `
      <div class="empty-cart-message">
        <i class="fa-regular fa-heart"></i>
        <p>Your wishlist is currently empty. Fill it with handcrafted goodness!</p>
      </div>
    `;
    return;
  }

  wishlist.forEach(id => {
    const product = (window.PRODUCTS || []).find(p => p.id === id);
    if (!product) return;

    const defaultSize = product.sizes ? product.sizes[0] : { weight: product.weight, price: product.price };

    const itemEl = document.createElement('div');
    itemEl.className = 'wishlist-item';
    itemEl.innerHTML = `
      <img class="wishlist-item-img" src="${product.image}" alt="${product.name}" onerror="this.onerror=null;this.src='images/healthy-mix.jpg'">
      <div class="wishlist-item-info">
        <h4 class="wishlist-item-name">${product.name}</h4>
        <span class="wishlist-item-price">Rs. ${defaultSize.price}</span>
      </div>
      <div class="wishlist-item-actions">
        <button class="btn-wishlist-cart" onclick="moveWishlistToCart('${product.id}', '${defaultSize.weight}', ${defaultSize.price})">
          <i class="fa-solid fa-cart-shopping"></i> + Cart
        </button>
        <button class="btn-wishlist-remove" onclick="toggleWishlist('${product.id}')" title="Remove">
          <i class="fa-regular fa-trash-can"></i> Remove
        </button>
      </div>
    `;
    drawerContent.appendChild(itemEl);
  });
}

// Fetch Customer Orders (Backend API + Local Storage Sync)
async function fetchCustomerOrders() {
  const shopper = getShopperInfo();
  let orders = [];

  // 1. Try fetching from Backend API
  if (shopper && (shopper.email || shopper.phone)) {
    try {
      const query = shopper.email ? `email=${encodeURIComponent(shopper.email)}` : `phone=${encodeURIComponent(shopper.phone)}`;
      const res = await fetch(`${BACKEND_API_URL}/api/orders?${query}`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          orders = data;
        } else if (data && Array.isArray(data.orders)) {
          orders = data.orders;
        }
      }
    } catch (e) {
      console.warn('Backend orders fetch notice:', e);
    }
  }

  // 2. Merge with locally cached orders
  try {
    const local = JSON.parse(localStorage.getItem('aho_customer_orders') || '[]');
    if (Array.isArray(local) && local.length > 0) {
      const existingIds = new Set(orders.map(o => String(o.orderNumber || o.id)));
      local.forEach(lo => {
        const key = String(lo.orderNumber || lo.id);
        if (!existingIds.has(key)) {
          orders.push(lo);
          existingIds.add(key);
        }
      });
    }
  } catch (e) {}

  // Sort descending by date
  orders.sort((a, b) => new Date(b.createdAt || b.date || 0) - new Date(a.createdAt || a.date || 0));

  return orders;
}

// Update Orders Count Badge in Header Navigation
async function updateOrdersCountBadge() {
  const badge = document.getElementById('orders-count');
  if (!badge) return;

  try {
    const orders = await fetchCustomerOrders();
    const count = orders.length;
    badge.textContent = count;
    badge.style.display = count > 0 ? 'flex' : 'none';
  } catch (e) {
    badge.style.display = 'none';
  }
}

// Render Orders in Orders Drawer
async function renderOrdersDrawer() {
  const container = document.getElementById('orders-items-container');
  if (!container) return;

  container.innerHTML = `
    <div style="text-align: center; padding: 40px 10px; color: var(--text-muted);">
      <i class="fa-solid fa-circle-notch fa-spin" style="font-size: 2rem; color: var(--primary); margin-bottom: 12px; display: block;"></i>
      <p style="font-size: 0.9rem;">Fetching your orders...</p>
    </div>
  `;

  const orders = await fetchCustomerOrders();
  
  // Refresh badge as well
  const badge = document.getElementById('orders-count');
  if (badge) {
    badge.textContent = orders.length;
    badge.style.display = orders.length > 0 ? 'flex' : 'none';
  }

  if (!orders || orders.length === 0) {
    container.innerHTML = `
      <div class="empty-cart-message" style="padding: 30px 10px; text-align: center;">
        <i class="fa-solid fa-box-open" style="color: #cbd5e1; font-size: 3.5rem; margin-bottom: 16px; display: block;"></i>
        <h4 style="color: var(--text-dark); margin-bottom: 6px; font-size: 1.1rem; font-family: 'Playfair Display', serif;">No Orders Placed Yet</h4>
        <p style="font-size: 0.85rem; color: var(--text-muted); max-width: 250px; margin: 0 auto 18px; line-height: 1.4;">Your handcrafted organic favorites will appear right here once placed.</p>
        <a href="shop.html" class="btn btn-primary" onclick="const d = document.getElementById('orders-drawer'); if(d) d.classList.remove('open'); const o = document.getElementById('drawer-overlay'); if(o) o.classList.remove('active');" style="padding: 10px 20px; font-size: 0.88rem; text-decoration: none; border-radius: 8px; display: inline-flex; align-items: center; gap: 8px;">
          <i class="fa-solid fa-cart-shopping"></i> Start Shopping
        </a>
      </div>
    `;
    return;
  }

  let html = '<div class="orders-drawer-list">';
  orders.forEach(order => {
    const orderNum = order.orderNumber || `#AHO-${order.id || 'ORDER'}`;
    const dateStr = order.createdAt 
      ? new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) 
      : 'Recently placed';
    
    const status = (order.status || 'CONFIRMED').toUpperCase();
    let statusClass = 'orders-status-confirmed';
    let statusIcon = '🟢';
    if (status === 'SHIPPED') {
      statusClass = 'orders-status-shipped';
      statusIcon = '🚚';
    } else if (status === 'DELIVERED') {
      statusClass = 'orders-status-delivered';
      statusIcon = '📦';
    }

    let items = order.items;
    if (typeof items === 'string') {
      try { items = JSON.parse(items); } catch (e) { items = []; }
    }
    if (!Array.isArray(items)) items = [];

    const itemsHtml = items.map(item => {
      let img = item.image || item.productImage || 'images/healthy-mix.jpg';
      const weight = item.weight ? `(${item.weight})` : '';
      const qty = item.quantity || 1;
      const lineTotal = (parseFloat(item.price) || 0) * qty;
      const itemName = item.name || item.productName || 'Organic Product';
      return `
        <div class="orders-drawer-item">
          <img src="${img}" class="orders-drawer-item-img" alt="${itemName}" onerror="this.src='images/healthy-mix.jpg'">
          <div class="orders-drawer-item-info">
            <div class="orders-drawer-item-name" title="${itemName}">${itemName}</div>
            <div class="orders-drawer-item-sub">Qty: <strong>${qty}</strong> ${weight}</div>
          </div>
          <div class="orders-drawer-item-price">Rs. ${lineTotal}</div>
        </div>
      `;
    }).join('');

    const total = order.totalAmount || order.total || 0;
    const address = order.shippingAddress || '';
    const whatsappEnquiryUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(`Hello Anuradha Homemade Organics, I would like an update regarding my Order #${orderNum}`)}`;

    html += `
      <div class="orders-drawer-card">
        <div class="orders-drawer-header">
          <div>
            <div class="orders-drawer-id"><i class="fa-solid fa-receipt" style="color: var(--primary); margin-right: 5px;"></i> ${orderNum}</div>
            <div class="orders-drawer-date">${dateStr}</div>
          </div>
          <span class="orders-drawer-status ${statusClass}">${statusIcon} ${status}</span>
        </div>
        <div class="orders-drawer-items">
          ${itemsHtml || '<div style="font-size:0.8rem; color:#64748b;">No item details available</div>'}
        </div>
        ${address ? `<div style="font-size: 0.74rem; color: var(--text-muted); margin-bottom: 8px; display: flex; align-items: flex-start; gap: 6px;"><i class="fa-solid fa-location-dot" style="margin-top: 2px; color: var(--primary);"></i> <span>${address}</span></div>` : ''}
        <div class="orders-drawer-footer-row">
          <a href="${whatsappEnquiryUrl}" target="_blank" style="font-size: 0.78rem; color: #16a34a; font-weight: 600; text-decoration: none; display: inline-flex; align-items: center; gap: 4px;">
            <i class="fa-brands fa-whatsapp"></i> Order Support
          </a>
          <div style="text-align: right;">
            <span style="font-size: 0.78rem; color: var(--text-muted); margin-right: 4px;">Total:</span>
            <span class="orders-drawer-total">Rs. ${total}</span>
          </div>
        </div>
      </div>
    `;
  });
  html += '</div>';

  container.innerHTML = html;
}

window.fetchCustomerOrders = fetchCustomerOrders;
window.updateOrdersCountBadge = updateOrdersCountBadge;
window.renderOrdersDrawer = renderOrdersDrawer;

window.moveWishlistToCart = async function(id, weight, price) {
  await addToCart(id, weight, price);
  // Remove from wishlist
  await toggleWishlist(id);
};

// Cart Logic with Backend API Sync
window.addToCart = async function(id, weight, price) {
  const product = (window.PRODUCTS || []).find(p => p.id === id);
  if (!product) return;

  const shopper = getShopperInfo();
  const cartKey = `${id}-${weight}`;
  const existingItem = cart.find(item => item.cartKey === cartKey);

  if (existingItem) {
    existingItem.quantity += 1;
  } else {
    cart.push({
      cartKey: cartKey,
      id: id,
      name: product.name,
      image: product.image,
      weight: weight,
      price: price,
      quantity: 1
    });
  }

  localStorage.setItem('aho_cart', JSON.stringify(cart));
  updateCartUI();
  showFloatingToast('Added to Cart!');

  try {
    await fetch(`${BACKEND_API_URL}/api/cart`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customerEmail: shopper.email,
        customerName: shopper.name,
        customerPhone: shopper.phone,
        productId: product.id,
        productName: product.name,
        productImage: product.image,
        weight: weight,
        price: price,
        quantity: 1
      })
    });
  } catch (e) {
    console.warn('Backend cart sync error:', e);
  }
};

function updateCartUI() {
  const badge = document.getElementById('cart-count');
  const floatBadge = document.getElementById('floating-cart-count');
  const drawerContent = document.getElementById('cart-items-container');

  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  if (badge) {
    badge.textContent = totalItems;
    badge.style.display = totalItems > 0 ? 'flex' : 'none';
  }
  if (floatBadge) {
    floatBadge.textContent = totalItems;
    floatBadge.style.display = totalItems > 0 ? 'flex' : 'none';
  }

  if (!drawerContent) return;
  drawerContent.innerHTML = '';

  if (cart.length === 0) {
    drawerContent.innerHTML = `
      <div class="empty-cart-message">
        <i class="fa-solid fa-cart-shopping"></i>
        <p>Your cart is empty. Explore our homemade organic treats!</p>
      </div>
    `;
    updateSummary(0);
    return;
  }

  cart.forEach(item => {
    const itemEl = document.createElement('div');
    itemEl.className = 'cart-item';
    itemEl.innerHTML = `
      <img class="cart-item-img" src="${item.image}" alt="${item.name}" onerror="this.onerror=null;this.src='images/healthy-mix.jpg'">
      <div class="cart-item-info">
        <h4 class="cart-item-name">${item.name}</h4>
        <div class="cart-item-weight">${item.weight}</div>
        <span class="cart-item-price">Rs. ${item.price}</span>
        <div class="cart-item-actions">
          <div class="qty-selector">
            <button class="qty-btn" onclick="updateQty('${item.cartKey}', -1)">-</button>
            <span class="qty-val">${item.quantity}</span>
            <button class="qty-btn" onclick="updateQty('${item.cartKey}', 1)">+</button>
          </div>
          <button class="btn-remove-item" onclick="removeCartItem('${item.cartKey}')">
            <i class="fa-regular fa-trash-can"></i> Remove
          </button>
        </div>
      </div>
    `;
    drawerContent.appendChild(itemEl);
  });

  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  updateSummary(subtotal);
}

window.updateQty = async function(cartKey, change) {
  const item = cart.find(item => item.cartKey === cartKey);
  if (!item) return;

  item.quantity += change;
  const newQty = item.quantity;
  if (item.quantity <= 0) {
    cart = cart.filter(i => i.cartKey !== cartKey);
  }

  localStorage.setItem('aho_cart', JSON.stringify(cart));
  updateCartUI();

  const shopper = getShopperInfo();
  try {
    if (newQty > 0) {
      await fetch(`${BACKEND_API_URL}/api/cart`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerEmail: shopper.email,
          customerName: shopper.name,
          customerPhone: shopper.phone,
          productId: item.id,
          productName: item.name,
          productImage: item.image,
          weight: item.weight,
          price: item.price,
          quantity: change
        })
      });
    } else {
      await fetch(`${BACKEND_API_URL}/api/cart?email=${encodeURIComponent(shopper.email)}&productId=${encodeURIComponent(item.id)}`, {
        method: 'DELETE'
      });
    }
  } catch (e) {
    console.warn('Backend updateQty sync error:', e);
  }
};

window.removeCartItem = async function(cartKey) {
  const item = cart.find(item => item.cartKey === cartKey);
  cart = cart.filter(item => item.cartKey !== cartKey);
  localStorage.setItem('aho_cart', JSON.stringify(cart));
  updateCartUI();
  showFloatingToast('Removed from Cart');

  if (item) {
    const shopper = getShopperInfo();
    try {
      await fetch(`${BACKEND_API_URL}/api/cart?email=${encodeURIComponent(shopper.email)}&productId=${encodeURIComponent(item.id)}`, {
        method: 'DELETE'
      });
    } catch (e) {
      console.warn('Backend removeCartItem sync error:', e);
    }
  }
};

function updateSummary(subtotal) {
  const subtotalEl = document.getElementById('cart-subtotal');
  const deliveryEl = document.getElementById('cart-delivery');
  const totalEl = document.getElementById('cart-total');

  if (!subtotalEl || !deliveryEl || !totalEl) return;

  subtotalEl.textContent = `Rs. ${subtotal}`;
  
  let delivery = 0;
  if (subtotal > 0) {
    delivery = subtotal >= 500 ? 0 : 50; // Free delivery for orders above 500 INR
  }
  deliveryEl.textContent = delivery === 0 ? (subtotal === 0 ? 'Rs. 0' : 'FREE') : `Rs. ${delivery}`;
  
  const grandTotal = subtotal + delivery;
  totalEl.textContent = `Rs. ${grandTotal}`;
}

// Toast Notifications Helper
function showFloatingToast(message) {
  // Check if toast already exists
  let toast = document.getElementById('toast-notification');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'toast-notification';
    toast.style.cssText = `
      position: fixed;
      bottom: 110px;
      right: 30px;
      background-color: var(--primary);
      color: var(--white);
      padding: 12px 24px;
      border-radius: var(--radius-md);
      box-shadow: var(--shadow-lg);
      z-index: 999;
      font-size: 0.9rem;
      font-weight: 600;
      opacity: 0;
      transform: translateY(20px);
      transition: all 0.3s ease;
      display: flex;
      align-items: center;
      gap: 10px;
    `;
    document.body.appendChild(toast);
  }

  toast.innerHTML = `<i class="fa-solid fa-circle-check"></i> ${message}`;
  toast.style.opacity = '1';
  toast.style.transform = 'translateY(0)';

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(20px)';
  }, 2500);
}

// Generate WhatsApp Order Message
// Open Checkout Modal
function openCheckoutModal() {
  if (cart.length === 0) {
    showFloatingToast('Please add items to your cart first.');
    return;
  }
  
  // Close the cart drawer first
  const cartDrawer = document.getElementById('cart-drawer');
  const drawerOverlay = document.getElementById('drawer-overlay');
  if (cartDrawer && drawerOverlay) {
    cartDrawer.classList.remove('open');
    drawerOverlay.classList.remove('active');
  }

  const modal = document.getElementById('checkout-modal');
  if (modal) {
    modal.classList.add('active');
    
    // RESET to Page 1 (Address Page) on opening
    const pageAddress = document.getElementById('checkout-page-address');
    const pagePayment = document.getElementById('checkout-page-payment');
    const modalTitle = document.getElementById('checkout-modal-title');
    if (pageAddress) pageAddress.style.display = 'block';
    if (pagePayment) pagePayment.style.display = 'none';
    if (modalTitle) modalTitle.innerHTML = `<i class="fa-solid fa-location-dot" style="margin-right: 8px;"></i> Shipping Details`;

    // RESET payment radio and subform states
    const upiRadio = document.querySelector('input[name="payment-method"][value="UPI"]');
    if (upiRadio) upiRadio.checked = true;
    
    modal.querySelectorAll('.payment-sub-form').forEach(subForm => {
      subForm.style.display = 'none';
      subForm.querySelectorAll('input, select').forEach(input => {
        input.required = false;
      });
    });
    
    const upiSubForm = document.getElementById('sub-form-UPI');
    if (upiSubForm) {
      upiSubForm.style.display = 'block';
      const upiInput = document.getElementById('chk-upi-id');
      if (upiInput) upiInput.required = true;
    }

    // Pre-fill fields if saved in localStorage
    const saved = JSON.parse(localStorage.getItem('aho_checkout_details'));
    if (saved) {
      if (document.getElementById('chk-name')) document.getElementById('chk-name').value = saved.name || '';
      if (document.getElementById('chk-phone')) document.getElementById('chk-phone').value = saved.phone || '';
      if (document.getElementById('chk-address')) document.getElementById('chk-address').value = saved.address || '';
      if (document.getElementById('chk-city')) document.getElementById('chk-city').value = saved.city || '';
      if (document.getElementById('chk-pincode')) document.getElementById('chk-pincode').value = saved.pincode || '';
      if (saved.payment) {
        const radio = document.querySelector(`input[name="payment-method"][value="${saved.payment}"]`);
        if (radio) radio.checked = true;
      }
    }
    
    // Highlight active payment card option
    updatePaymentCardHighlights();
  }
}

// Close Checkout Modal
function closeCheckoutModal() {
  const modal = document.getElementById('checkout-modal');
  if (modal) {
    modal.classList.remove('active');
  }
}

// Handle Checkout Form Submit (Compiles final WhatsApp Invoice)
function handleCheckoutSubmit(e) {
  e.preventDefault();

  const name = document.getElementById('chk-name').value.trim();
  const phone = document.getElementById('chk-phone').value.trim();
  const address = document.getElementById('chk-address').value.trim();
  const city = document.getElementById('chk-city').value.trim();
  const pincode = document.getElementById('chk-pincode').value.trim();
  const payment = document.querySelector('input[name="payment-method"]:checked').value;

  // Save basic shipping info to localStorage for convenience next time
  localStorage.setItem('aho_checkout_details', JSON.stringify({ name, phone, address, city, pincode, payment }));

  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const delivery = subtotal >= 500 ? 0 : 50;
  const total = subtotal + delivery;

  let itemsText = '';
  cart.forEach((item, index) => {
    itemsText += `${index + 1}. *${item.name}* (${item.weight}) - Qty: ${item.quantity} x Rs. ${item.price} = Rs. ${item.price * item.quantity}\n`;
  });

  let paymentText = '';
  let paymentDetails = '';
  
  if (payment === 'UPI') {
    const upiId = document.getElementById('chk-upi-id').value.trim();
    paymentText = 'Online UPI (GPay/PhonePe/Paytm)';
    paymentDetails = `\n*UPI ID / VPA:* ${upiId}`;
  } else if (payment === 'CARD') {
    const cardNumber = document.getElementById('chk-card-number').value.trim();
    const cardName = document.getElementById('chk-card-name').value.trim();
    const cardExpiry = document.getElementById('chk-card-expiry').value.trim();
    const maskedCard = '************' + cardNumber.slice(-4);
    paymentText = 'Credit / Debit Card';
    paymentDetails = `\n*Name on Card:* ${cardName}\n*Card Number:* ${maskedCard}\n*Card Expiry:* ${cardExpiry}`;
  } else if (payment === 'NETBANKING') {
    const bankSelect = document.getElementById('chk-bank-select');
    const bankName = bankSelect.options[bankSelect.selectedIndex].text;
    paymentText = 'Net Banking';
    paymentDetails = `\n*Selected Bank:* ${bankName}`;
  } else {
    paymentText = 'Cash on Delivery (COD)';
    paymentDetails = `\n*Note:* Cash will be paid upon delivery.`;
  }

  const message = `Hello Anuradha Homemade Organics,\n\nI would like to place an order for the following organic products:\n\n${itemsText}\n*Subtotal:* Rs. ${subtotal}\n*Delivery Charge:* ${delivery === 0 ? 'FREE' : 'Rs. ' + delivery}\n*Grand Total:* Rs. ${total}\n\n*Delivery Address:*\n*Name:* ${name}\n*Phone:* ${phone}\n*Address:* ${address}, ${city} - ${pincode}\n\n*Payment Method Selected:*\n*${paymentText}*${paymentDetails}\n\nThank you!`;

  const encodedText = encodeURIComponent(message);
  const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodedText}`;

  // Sync order and address to backend database
  const shopper = getShopperInfo();
  const customerEmail = shopper.email.includes('guest_') ? `${phone || 'customer'}@shopper.anuradhaorganics.com` : shopper.email;
  const orderedCart = [...cart]; // Preserve snapshot of ordered cart
  
  let orderNumber = 'AHO-' + Math.floor(100000 + Math.random() * 900000);
  let backendOrder = null;

  (async () => {
    try {
      // 1. Submit Order
      const res = await fetch(`${BACKEND_API_URL}/api/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName: name,
          customerEmail: customerEmail,
          customerPhone: phone,
          items: orderedCart,
          totalAmount: total,
          shippingAddress: `${address}, ${city} - ${pincode}`
        })
      });
      const data = await res.json();
      if (data.success) {
        if (data.orderNumber) orderNumber = data.orderNumber;
        if (data.order) backendOrder = data.order;
      }

      // 2. Submit Delivery Address
      await fetch(`${BACKEND_API_URL}/api/addresses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName: name,
          customerEmail: customerEmail,
          customerPhone: phone,
          streetAddress: address,
          city: city,
          state: 'Tamil Nadu',
          pincode: pincode,
          addressType: 'Home'
        })
      });

      // 3. Clear active cart in backend
      await fetch(`${BACKEND_API_URL}/api/cart?email=${encodeURIComponent(shopper.email)}`, {
        method: 'DELETE'
      });

      // 4. Remove ordered items from backend wishlist if present
      for (const item of orderedCart) {
        if (item.id) {
          await fetch(`${BACKEND_API_URL}/api/wishlist?email=${encodeURIComponent(shopper.email)}&productId=${encodeURIComponent(item.id)}`, {
            method: 'DELETE'
          });
        }
      }
    } catch (err) {
      console.warn('Backend order placement sync error:', err);
    }

    // Save to local placed orders cache for immediate visibility in Customer Dashboard
    try {
      const localPlaced = JSON.parse(localStorage.getItem('aho_customer_orders') || '[]');
      const newPlacedItem = backendOrder || {
        orderNumber: orderNumber,
        customerName: name,
        customerEmail: customerEmail,
        customerPhone: phone,
        items: orderedCart,
        totalAmount: total,
        shippingAddress: `${address}, ${city} - ${pincode}`,
        status: 'CONFIRMED',
        createdAt: new Date().toISOString()
      };
      localPlaced.unshift(newPlacedItem);
      localStorage.setItem('aho_customer_orders', JSON.stringify(localPlaced));
    } catch (e) {}
  })();

  // Remove ordered products from local wishlist as well
  const orderedIds = cart.map(i => i.id);
  wishlist = wishlist.filter(id => !orderedIds.includes(id));
  localStorage.setItem('aho_wishlist', JSON.stringify(wishlist));
  updateWishlistUI();
  renderProducts();

  // Close checkout modal and clear cart
  closeCheckoutModal();
  cart = [];
  localStorage.setItem('aho_cart', JSON.stringify(cart));
  updateCartUI();
  updateOrdersCountBadge();

  // Show rich Order Placed Success Confirmation Modal
  showOrderPlacedSuccessModal({
    orderNumber: orderNumber,
    customerName: name,
    customerPhone: phone,
    items: orderedCart,
    total: total,
    shippingAddress: `${address}, ${city} - ${pincode}`,
    paymentMethod: paymentText,
    whatsappUrl: whatsappUrl
  });
}

// Order Placed Success Modal
function showOrderPlacedSuccessModal(orderData) {
  let modal = document.getElementById('order-success-modal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'order-success-modal';
    modal.className = 'modal';
    document.body.appendChild(modal);
  }

  const itemsHtml = orderData.items.map(it => {
    let img = it.image || 'images/healthy-mix.jpg';
    if (!img.startsWith('http') && !img.startsWith('../') && !img.startsWith('/')) {
      img = img;
    }
    const weight = it.weight ? `(${it.weight})` : '';
    const itemTotal = (parseFloat(it.price) || 0) * (parseInt(it.quantity) || 1);
    return `
      <div style="display: flex; align-items: center; gap: 10px; padding: 6px 0; border-bottom: 1px solid #f1f5f9;">
        <img src="${img}" alt="${it.name}" style="width: 38px; height: 38px; border-radius: 6px; object-fit: cover; background: #f8fafc; border: 1px solid #e2e8f0;" onerror="this.src='images/healthy-mix.jpg'">
        <div style="flex: 1; min-width: 0;">
          <div style="font-size: 0.84rem; font-weight: 600; color: #1e293b; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${it.name}</div>
          <div style="font-size: 0.74rem; color: #64748b;">Qty: <strong>${it.quantity || 1}</strong> ${weight}</div>
        </div>
        <div style="font-size: 0.86rem; font-weight: 700; color: #2d6a4f;">Rs. ${itemTotal}</div>
      </div>
    `;
  }).join('');

  modal.innerHTML = `
    <div class="modal-wrapper" style="max-width: 480px; padding: 24px; border-radius: 18px; text-align: center; box-shadow: 0 20px 40px rgba(0,0,0,0.18);">
      <div style="width: 64px; height: 64px; background: linear-gradient(135deg, #22c55e, #16a34a); color: #ffffff; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; font-size: 2rem; margin-bottom: 14px; box-shadow: 0 8px 20px rgba(34, 197, 94, 0.35); animation: popScale 0.4s ease-out;">
        <i class="fa-solid fa-check"></i>
      </div>
      
      <h2 style="font-size: 1.45rem; color: #1e293b; margin-bottom: 6px; font-family: 'Playfair Display', serif;">Order Placed Successfully!</h2>
      <p style="font-size: 0.86rem; color: #64748b; margin-bottom: 16px;">Thank you for ordering with Anuradha Homemade Organics. Your handcrafted order has been received and confirmed.</p>
      
      <!-- Order Summary Card -->
      <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 14px; text-align: left; margin-bottom: 18px;">
        <div style="display: flex; justify-content: space-between; align-items: center; padding-bottom: 8px; margin-bottom: 8px; border-bottom: 1px dashed #cbd5e1;">
          <div>
            <span style="font-size: 0.75rem; color: #64748b; display: block;">Order Reference:</span>
            <strong style="font-size: 0.95rem; color: #1e293b;">#${orderData.orderNumber}</strong>
          </div>
          <span style="background: #dcfce7; color: #166534; padding: 3px 8px; border-radius: 12px; font-size: 0.72rem; font-weight: 700;">🟢 CONFIRMED</span>
        </div>

        <div style="max-height: 160px; overflow-y: auto; margin-bottom: 8px;">
          ${itemsHtml}
        </div>

        <div style="display: flex; justify-content: space-between; align-items: center; padding-top: 8px; border-top: 1px solid #e2e8f0;">
          <div style="font-size: 0.78rem; color: #64748b;"><i class="fa-solid fa-truck"></i> ${orderData.shippingAddress}</div>
          <div style="font-size: 1.1rem; font-weight: 800; color: #2d6a4f;">Rs. ${orderData.total}</div>
        </div>
      </div>

      <!-- Action Buttons -->
      <div style="display: flex; flex-direction: column; gap: 8px;">
        <button type="button" class="btn btn-primary" onclick="document.getElementById('order-success-modal').classList.remove('open'); const ob = document.getElementById('orders-btn'); if(ob){ ob.click(); } else { window.location.href='customer/dashboard.html?tab=orders'; }" style="display: flex; align-items: center; justify-content: center; gap: 8px; padding: 12px; border-radius: 10px; font-size: 0.92rem; font-weight: 600; width: 100%; border: none; cursor: pointer;">
          <i class="fa-solid fa-box-open"></i> View My Placed Orders
        </button>
        
        <div style="display: flex; gap: 8px;">
          <button type="button" class="btn btn-secondary" onclick="document.getElementById('order-success-modal').classList.remove('open'); if(document.getElementById('drawer-overlay')) document.getElementById('drawer-overlay').classList.remove('active');" style="flex: 1; padding: 10px; font-size: 0.85rem; border-radius: 10px; background: #f1f5f9; color: #334155; border: 1px solid #cbd5e1;">
            Continue Shopping
          </button>
          <a href="${orderData.whatsappUrl}" target="_blank" class="btn" style="flex: 1; display: inline-flex; align-items: center; justify-content: center; gap: 6px; padding: 10px; font-size: 0.85rem; border-radius: 10px; background: #25d366; color: #ffffff; text-decoration: none; font-weight: 600;">
            <i class="fa-brands fa-whatsapp"></i> WhatsApp
          </a>
        </div>
      </div>
    </div>
  `;

  modal.classList.add('open');
  const overlay = document.getElementById('drawer-overlay');
  if (overlay) overlay.classList.add('active');
  showFloatingToast('🎉 Order placed successfully! Order ID #' + orderData.orderNumber);
}

// Inject Checkout Modal HTML dynamically
function injectCheckoutModal() {
  if (document.getElementById('checkout-modal')) return;

  const modal = document.createElement('div');
  modal.id = 'checkout-modal';
  modal.className = 'modal';
  modal.innerHTML = `
    <div class="modal-wrapper" style="max-width: 500px; padding: 0; overflow: hidden; border-radius: var(--radius-lg);">
      <!-- Modal Header -->
      <div class="modal-header" style="padding: 20px 24px; background-color: var(--white); border-bottom: 1px solid var(--border); display: flex; justify-content: space-between; align-items: center;">
        <h3 id="checkout-modal-title" style="font-size: 1.3rem; margin: 0; color: var(--primary); font-family: 'Playfair Display', serif;"><i class="fa-solid fa-location-dot" style="margin-right: 8px;"></i> Shipping Details</h3>
        <button id="checkout-close" class="modal-close" style="background: none; border: none; font-size: 1.4rem; color: var(--text-muted); cursor: pointer;"><i class="fa-solid fa-xmark"></i></button>
      </div>
      <div class="modal-body" style="padding: 24px; max-height: calc(85vh - 70px); overflow-y: auto;">
        <form id="checkout-form">
          <!-- PAGE 1: ADDRESS -->
          <div id="checkout-page-address">
            <div class="form-group" style="margin-bottom: 16px;">
              <label style="display: block; font-size: 0.85rem; font-weight: 600; margin-bottom: 6px; color: var(--text-dark);">Full Name *</label>
              <input type="text" id="chk-name" class="form-control" style="width: 100%; padding: 10px 14px; border: 1px solid var(--border); border-radius: var(--radius-sm); font-size: 0.95rem;" placeholder="E.g., Anjali Sharma" required>
            </div>
            
            <div class="form-group" style="margin-bottom: 16px;">
              <label style="display: block; font-size: 0.85rem; font-weight: 600; margin-bottom: 6px; color: var(--text-dark);">Phone Number *</label>
              <input type="tel" id="chk-phone" class="form-control" style="width: 100%; padding: 10px 14px; border: 1px solid var(--border); border-radius: var(--radius-sm); font-size: 0.95rem;" placeholder="E.g., +91 9876543210" required>
            </div>

            <div class="form-group" style="margin-bottom: 16px;">
              <label style="display: block; font-size: 0.85rem; font-weight: 600; margin-bottom: 6px; color: var(--text-dark);">Complete Shipping Address *</label>
              <input type="text" id="chk-address" class="form-control" style="width: 100%; padding: 10px 14px; border: 1px solid var(--border); border-radius: var(--radius-sm); font-size: 0.95rem;" placeholder="House/Flat No, Street, Landmark" required>
            </div>

            <div class="form-row" style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 24px;">
              <div class="form-group" style="margin-bottom: 0;">
                <label style="display: block; font-size: 0.85rem; font-weight: 600; margin-bottom: 6px; color: var(--text-dark);">City & State *</label>
                <input type="text" id="chk-city" class="form-control" style="width: 100%; padding: 10px 14px; border: 1px solid var(--border); border-radius: var(--radius-sm); font-size: 0.95rem;" placeholder="E.g., Bangalore, KA" required>
              </div>
              <div class="form-group" style="margin-bottom: 0;">
                <label style="display: block; font-size: 0.85rem; font-weight: 600; margin-bottom: 6px; color: var(--text-dark);">Pincode *</label>
                <input type="text" id="chk-pincode" class="form-control" style="width: 100%; padding: 10px 14px; border: 1px solid var(--border); border-radius: var(--radius-sm); font-size: 0.95rem;" pattern="[0-9]{6}" placeholder="6-digit Pincode" required>
              </div>
            </div>

            <button type="button" id="checkout-to-payment-btn" class="btn btn-primary" style="width: 100%; padding: 14px; font-weight: 600; font-size: 1rem; display: flex; align-items: center; justify-content: center; gap: 10px; border-radius: var(--radius-md);">
              Continue to Payment <i class="fa-solid fa-arrow-right"></i>
            </button>
          </div>

          <!-- PAGE 2: PAYMENT METHOD (Initially Hidden) -->
          <div id="checkout-page-payment" style="display: none;">
            <div class="payment-options" style="display: flex; flex-direction: column; gap: 12px; margin-bottom: 24px;">
              <!-- UPI -->
              <label class="payment-label" style="cursor: pointer; width: 100%;">
                <input type="radio" name="payment-method" value="UPI" checked style="display: none;">
                <div class="payment-card" style="display: flex; align-items: center; gap: 16px; padding: 14px 18px; border: 1px solid var(--border); border-radius: var(--radius-md); background: var(--white); transition: var(--transition);">
                  <i class="fa-solid fa-mobile-screen payment-icon" style="font-size: 1.8rem; color: var(--primary);"></i>
                  <div class="payment-text" style="display: flex; flex-direction: column; width: 100%;">
                    <strong style="font-size: 0.92rem; color: var(--text-dark);">UPI (GPay / PhonePe / Paytm)</strong>
                    <span style="font-size: 0.75rem; color: var(--text-muted); margin-top: 2px;">Instant checkout via QR code or payment request link</span>
                    
                    <!-- UPI Subform -->
                    <div id="sub-form-UPI" class="payment-sub-form" style="margin-top: 12px; padding: 12px; border-left: 3px solid var(--primary); background: #f9fbf9; border-radius: var(--radius-sm);">
                      <label style="display: block; font-size: 0.8rem; font-weight: 600; margin-bottom: 4px; color: var(--text-dark);">Enter UPI ID / VPA *</label>
                      <input type="text" id="chk-upi-id" class="form-control" style="width: 100%; padding: 8px 12px; border: 1px solid var(--border); border-radius: var(--radius-sm); font-size: 0.9rem;" placeholder="E.g., name@okaxis" required>
                    </div>
                  </div>
                </div>
              </label>

              <!-- Cards -->
              <label class="payment-label" style="cursor: pointer; width: 100%;">
                <input type="radio" name="payment-method" value="CARD" style="display: none;">
                <div class="payment-card" style="display: flex; align-items: center; gap: 16px; padding: 14px 18px; border: 1px solid var(--border); border-radius: var(--radius-md); background: var(--white); transition: var(--transition);">
                  <i class="fa-solid fa-credit-card payment-icon" style="font-size: 1.8rem; color: var(--primary);"></i>
                  <div class="payment-text" style="display: flex; flex-direction: column; width: 100%;">
                    <strong style="font-size: 0.92rem; color: var(--text-dark);">Credit Card / Debit Card</strong>
                    <span style="font-size: 0.75rem; color: var(--text-muted); margin-top: 2px;">RuPay, Visa, Mastercard, Maestro cards accepted</span>
                    
                    <!-- Card Subform -->
                    <div id="sub-form-CARD" class="payment-sub-form" style="display: none; margin-top: 12px; padding: 12px; border-left: 3px solid var(--primary); background: #f9fbf9; border-radius: var(--radius-sm);">
                      <div class="form-group" style="margin-bottom: 10px;">
                        <label style="display: block; font-size: 0.8rem; font-weight: 600; margin-bottom: 4px; color: var(--text-dark);">Card Number *</label>
                        <input type="text" id="chk-card-number" class="form-control" style="width: 100%; padding: 8px 12px; border: 1px solid var(--border); border-radius: var(--radius-sm); font-size: 0.9rem;" placeholder="16-digit Card Number" pattern="[0-9]{16}">
                      </div>
                      <div class="form-group" style="margin-bottom: 10px;">
                        <label style="display: block; font-size: 0.8rem; font-weight: 600; margin-bottom: 4px; color: var(--text-dark);">Name on Card *</label>
                        <input type="text" id="chk-card-name" class="form-control" style="width: 100%; padding: 8px 12px; border: 1px solid var(--border); border-radius: var(--radius-sm); font-size: 0.9rem;" placeholder="E.g., Anjali Sharma">
                      </div>
                      <div class="form-row" style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                        <div class="form-group" style="margin-bottom: 0;">
                          <label style="display: block; font-size: 0.8rem; font-weight: 600; margin-bottom: 4px; color: var(--text-dark);">Expiry *</label>
                          <input type="text" id="chk-card-expiry" class="form-control" style="width: 100%; padding: 8px 12px; border: 1px solid var(--border); border-radius: var(--radius-sm); font-size: 0.9rem;" placeholder="MM/YY" pattern="(0[1-9]|1[0-2])\\/[0-9]{2}">
                        </div>
                        <div class="form-group" style="margin-bottom: 0;">
                          <label style="display: block; font-size: 0.8rem; font-weight: 600; margin-bottom: 4px; color: var(--text-dark);">CVV *</label>
                          <input type="password" id="chk-card-cvv" class="form-control" style="width: 100%; padding: 8px 12px; border: 1px solid var(--border); border-radius: var(--radius-sm); font-size: 0.9rem;" placeholder="3 Digits" pattern="[0-9]{3}">
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </label>

              <!-- Net Banking -->
              <label class="payment-label" style="cursor: pointer; width: 100%;">
                <input type="radio" name="payment-method" value="NETBANKING" style="display: none;">
                <div class="payment-card" style="display: flex; align-items: center; gap: 16px; padding: 14px 18px; border: 1px solid var(--border); border-radius: var(--radius-md); background: var(--white); transition: var(--transition);">
                  <i class="fa-solid fa-building-columns payment-icon" style="font-size: 1.8rem; color: var(--primary);"></i>
                  <div class="payment-text" style="display: flex; flex-direction: column; width: 100%;">
                    <strong style="font-size: 0.92rem; color: var(--text-dark);">Net Banking</strong>
                    <span style="font-size: 0.75rem; color: var(--text-muted); margin-top: 2px;">All major Indian banks supported</span>
                    
                    <!-- Netbanking Subform -->
                    <div id="sub-form-NETBANKING" class="payment-sub-form" style="display: none; margin-top: 12px; padding: 12px; border-left: 3px solid var(--primary); background: #f9fbf9; border-radius: var(--radius-sm);">
                      <label style="display: block; font-size: 0.8rem; font-weight: 600; margin-bottom: 6px; color: var(--text-dark);">Select Bank *</label>
                      <select id="chk-bank-select" class="form-control" style="width: 100%; padding: 8px 12px; border: 1px solid var(--border); border-radius: var(--radius-sm); font-size: 0.9rem; background: var(--white);">
                        <option value="">-- Choose Your Bank --</option>
                        <option value="SBI">State Bank of India (SBI)</option>
                        <option value="HDFC">HDFC Bank</option>
                        <option value="ICICI">ICICI Bank</option>
                        <option value="AXIS">Axis Bank</option>
                        <option value="KOTAK">Kotak Mahindra Bank</option>
                        <option value="OTHER">Other Bank</option>
                      </select>
                    </div>
                  </div>
                </div>
              </label>

              <!-- COD -->
              <label class="payment-label" style="cursor: pointer; width: 100%;">
                <input type="radio" name="payment-method" value="COD" style="display: none;">
                <div class="payment-card" style="display: flex; align-items: center; gap: 16px; padding: 14px 18px; border: 1px solid var(--border); border-radius: var(--radius-md); background: var(--white); transition: var(--transition);">
                  <i class="fa-solid fa-hand-holding-dollar payment-icon" style="font-size: 1.8rem; color: var(--primary);"></i>
                  <div class="payment-text" style="display: flex; flex-direction: column; width: 100%;">
                    <strong style="font-size: 0.92rem; color: var(--text-dark);">Cash on Delivery (COD)</strong>
                    <span style="font-size: 0.75rem; color: var(--text-muted); margin-top: 2px;">Pay with cash at your doorstep when delivered</span>
                    
                    <!-- COD Notice -->
                    <div id="sub-form-COD" class="payment-sub-form" style="display: none; margin-top: 12px; padding: 12px; border-left: 3px solid var(--primary); background: #f9fbf9; border-radius: var(--radius-sm);">
                      <span style="font-size: 0.82rem; color: var(--text-muted); line-height: 1.5; display: block;">
                        <i class="fa-solid fa-circle-info" style="color: var(--primary); margin-right: 6px;"></i> Cash will be collected during delivery.
                      </span>
                    </div>
                  </div>
                </div>
              </label>
            </div>

            <div style="display: grid; grid-template-columns: 1fr; gap: 12px;">
              <button type="submit" class="btn btn-primary checkout-submit-btn" style="width: 100%; padding: 14px; font-weight: 600; font-size: 1rem; display: flex; align-items: center; justify-content: center; gap: 10px; border-radius: var(--radius-md);">
                <i class="fa-solid fa-circle-check" style="font-size: 1.15rem;"></i> Place Order
              </button>
              <button type="button" id="checkout-back-btn" class="btn btn-secondary" style="width: 100%; padding: 12px; font-weight: 600; font-size: 0.9rem; border-radius: var(--radius-md); text-align: center;">
                <i class="fa-solid fa-arrow-left" style="margin-right: 6px;"></i> Back to Delivery Address
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  `;
  document.body.appendChild(modal);

  // Setup Close Listener
  const closeBtn = document.getElementById('checkout-close');
  if (closeBtn) closeBtn.addEventListener('click', closeCheckoutModal);

  // Setup Form Submit Listener
  const form = document.getElementById('checkout-form');
  if (form) form.addEventListener('submit', handleCheckoutSubmit);

  // Setup Wizard Nav Transition (Address -> Payment)
  const toPaymentBtn = document.getElementById('checkout-to-payment-btn');
  if (toPaymentBtn) {
    toPaymentBtn.addEventListener('click', () => {
      const name = document.getElementById('chk-name');
      const phone = document.getElementById('chk-phone');
      const address = document.getElementById('chk-address');
      const city = document.getElementById('chk-city');
      const pincode = document.getElementById('chk-pincode');
      
      if (!name.checkValidity() || !phone.checkValidity() || !address.checkValidity() || !city.checkValidity() || !pincode.checkValidity()) {
        form.reportValidity();
        return;
      }

      document.getElementById('checkout-page-address').style.display = 'none';
      document.getElementById('checkout-page-payment').style.display = 'block';
      document.getElementById('checkout-modal-title').innerHTML = `<i class="fa-solid fa-credit-card" style="margin-right: 8px;"></i> Payment Options`;
    });
  }

  // Setup Wizard Nav Transition (Payment -> Address)
  const backBtn = document.getElementById('checkout-back-btn');
  if (backBtn) {
    backBtn.addEventListener('click', () => {
      document.getElementById('checkout-page-payment').style.display = 'none';
      document.getElementById('checkout-page-address').style.display = 'block';
      document.getElementById('checkout-modal-title').innerHTML = `<i class="fa-solid fa-location-dot" style="margin-right: 8px;"></i> Shipping Details`;
    });
  }

  // Setup Toggling Radio Button Subforms
  const radios = modal.querySelectorAll('input[name="payment-method"]');
  radios.forEach(radio => {
    radio.addEventListener('change', (e) => {
      const selectedValue = e.target.value;
      
      // Hide all subforms and clear required flags
      modal.querySelectorAll('.payment-sub-form').forEach(subForm => {
        subForm.style.display = 'none';
        subForm.querySelectorAll('input, select').forEach(input => {
          input.required = false;
        });
      });
      
      // Show active subform and activate required inputs
      const activeSubForm = document.getElementById(`sub-form-${selectedValue}`);
      if (activeSubForm) {
        activeSubForm.style.display = 'block';
        activeSubForm.querySelectorAll('input, select').forEach(input => {
          if (selectedValue !== 'COD') {
            input.required = true;
          }
        });
      }

      // Highlight selected radio card option
      updatePaymentCardHighlights();
    });
  });

  // Click outside modal wrapper closes it
  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeCheckoutModal();
  });
}

// Highlight payment method cards in checkout modal
function updatePaymentCardHighlights() {
  const modal = document.getElementById('checkout-modal');
  if (!modal) return;
  modal.querySelectorAll('input[name="payment-method"]').forEach(radio => {
    const card = radio.nextElementSibling;
    if (card && card.classList.contains('payment-card')) {
      if (radio.checked) {
        card.style.borderColor = 'var(--primary)';
        card.style.background = '#f4f9ee';
      } else {
        card.style.borderColor = 'var(--border)';
        card.style.background = 'var(--white)';
      }
    }
  });
}

// Render Customer Reviews Carousel
function renderReviews() {
  const slider = document.getElementById('reviews-slider');
  if (!slider) return;

  slider.innerHTML = '';
  
  reviews.forEach(review => {
    const initials = review.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
    const stars = Array.from({ length: 5 }, (_, i) => 
      `<i class="${i < review.rating ? 'fa-solid' : 'fa-regular'} fa-star"></i>`
    ).join('');

    const reviewCard = document.createElement('div');
    reviewCard.className = 'review-card';
    reviewCard.innerHTML = `
      <div class="review-stars">${stars}</div>
      <p class="review-text">"${review.text}"</p>
      <div class="review-user">
        <div class="review-user-avatar">${initials}</div>
        <div class="review-user-info">
          <h4>${review.name}</h4>
          <span>${review.location || 'Verified Buyer'}</span>
        </div>
      </div>
    `;
    slider.appendChild(reviewCard);
  });

  // Reset slider positions
  activeReviewIndex = 0;
  slider.style.transform = `translateX(0px)`;
}

// Slide Reviews Carousel
function slideReviews(direction) {
  const slider = document.getElementById('reviews-slider');
  if (!slider) return;

  const card = slider.querySelector('.review-card');
  if (!card) return;

  const cardWidth = card.offsetWidth + 30; // card width + gap
  const maxSlides = reviews.length;
  
  // Responsive check for items visible
  let itemsVisible = 3;
  if (window.innerWidth <= 768) itemsVisible = 1;
  else if (window.innerWidth <= 1024) itemsVisible = 2;

  const maxIndex = maxSlides - itemsVisible;

  activeReviewIndex += direction;

  if (activeReviewIndex < 0) {
    activeReviewIndex = Math.max(0, maxIndex);
  } else if (activeReviewIndex > maxIndex) {
    activeReviewIndex = 0;
  }

  slider.style.transform = `translateX(-${activeReviewIndex * cardWidth}px)`;
}

// Handle Form Submission for adding reviews & saving to MySQL
async function handleReviewSubmit(e) {
  e.preventDefault();
  
  if (!isAuthenticated) {
    showFloatingToast('Please sign in to submit feedback!');
    sessionStorage.setItem('redirectAfterLogin', window.location.href);
    setTimeout(() => {
      window.location.href = 'login.html';
    }, 1500);
    return;
  }
  
  const nameInput = document.getElementById('rev-name');
  const locInput = document.getElementById('rev-location');
  const ratingInput = document.querySelector('input[name="rev-rating"]:checked');
  const textInput = document.getElementById('rev-text');

  if (!nameInput || !textInput) return;

  const name = nameInput.value.trim();
  const location = locInput ? locInput.value.trim() : 'Verified Buyer';
  const rating = ratingInput ? parseInt(ratingInput.value) : 5;
  const text = textInput.value.trim();

  if (!name || !text) {
    alert('Please enter your name and review comments.');
    return;
  }

  // Push new review locally
  const newReview = { name, location, rating, text };
  reviews.unshift(newReview);
  localStorage.setItem('aho_reviews', JSON.stringify(reviews));
  renderReviews();

  // Save review in StorageService & Backend API
  if (window.StorageService) {
    window.StorageService.addFeedback({ name, email: '', rating, comment: text });
  }

  fetch(`${BACKEND_API_URL}/api/feedback`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, rating, comment: text })
  }).catch(err => console.log('Stored review locally'));

  // Reset form
  e.target.reset();
  showFloatingToast('Thank you! Your feedback has been saved.');
}

// Contact Form validation and submit
function handleContactSubmit(e) {
  e.preventDefault();

  const nameInput = document.getElementById('contact-name');
  const phoneInput = document.getElementById('contact-phone');
  const emailInput = document.getElementById('contact-email');
  const messageInput = document.getElementById('contact-message');
  
  const successAlert = document.getElementById('contact-success');
  const dangerAlert = document.getElementById('contact-danger');

  if (!nameInput || !phoneInput || !messageInput || !successAlert || !dangerAlert) return;

  // Reset alerts
  successAlert.style.display = 'none';
  dangerAlert.style.display = 'none';

  const name = nameInput.value.trim();
  const phone = phoneInput.value.trim();
  const email = emailInput ? emailInput.value.trim() : '';
  const message = messageInput.value.trim();

  // Validation
  if (name.length < 3) {
    dangerAlert.textContent = 'Please enter a valid name (at least 3 characters).';
    dangerAlert.style.display = 'block';
    return;
  }

  if (phone.length < 10 || !/^\d+$/.test(phone)) {
    dangerAlert.textContent = 'Please enter a valid 10-digit mobile number.';
    dangerAlert.style.display = 'block';
    return;
  }

  if (message.length < 5) {
    dangerAlert.textContent = 'Please describe your request in more detail.';
    dangerAlert.style.display = 'block';
    return;
  }

  if (window.StorageService) {
    window.StorageService.addEnquiry({ name, phone, email, subject: 'Website Contact Inquiry', message });
  }

  fetch(`${BACKEND_API_URL}/api/enquiries`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, phone, email, message })
  }).catch(err => console.log('Enquiry stored locally'));

  successAlert.textContent = 'Thank you! Your enquiry has been submitted. We will contact you soon.';
  successAlert.style.display = 'block';
  e.target.reset();
}

// Hero Slider Initialization and Logic
function initHeroSlider() {
  const slider = document.getElementById('hero-slider');
  const dotsContainer = document.getElementById('hero-dots');

  if (!slider || !dotsContainer) return;

  slider.innerHTML = '';
  dotsContainer.innerHTML = '';

  const categoryTags = {
    'amla-products': 'Artisanal Amla Range',
    'nuts-powders': 'Sprouted Nuts & Seeds',
    'healthy-mixes': 'Traditional Health Mixes',
    'other-organics': 'Pure Organic Essentials'
  };

  window.PRODUCTS.forEach((product, idx) => {
    // Create Slide
    const slide = document.createElement('div');
    slide.className = `hero-slide ${idx === 0 ? 'active' : ''}`;
    slide.innerHTML = `
      <div class="hero-content">
        <span class="hero-tagline">${categoryTags[product.category] || 'Organic Goodness'}</span>
        <h1>Handcrafted ${product.name}</h1>
        <p>${product.description}</p>
        <div class="hero-btns">
          <button class="btn btn-primary" onclick="openDetailsModal('${product.id}')">
            <i class="fa-solid fa-eye"></i> View Details
          </button>
          <a href="shop.html" class="btn btn-secondary">Browse Shop</a>
        </div>
      </div>
      <div class="hero-image-wrapper">
        <div class="hero-image-circle"></div>
        <img class="hero-img" src="${product.image}" alt="${product.name}">
      </div>
    `;
    slider.appendChild(slide);

    // Create Dot
    const dot = document.createElement('button');
    dot.className = `hero-dot ${idx === 0 ? 'active' : ''}`;
    dot.setAttribute('aria-label', `Go to slide ${idx + 1}`);
    dot.addEventListener('click', () => {
      showHeroSlide(idx);
      startHeroAutoplay(); // Reset timer on manual click
    });
    dotsContainer.appendChild(dot);
  });

  // Start Autoplay
  startHeroAutoplay();
}

function showHeroSlide(idx) {
  const slides = document.querySelectorAll('.hero-slide');
  const dots = document.querySelectorAll('.hero-dot');

  if (slides.length === 0 || dots.length === 0) return;

  // Bound index
  if (idx >= slides.length) currentHeroSlide = 0;
  else if (idx < 0) currentHeroSlide = slides.length - 1;
  else currentHeroSlide = idx;

  slides.forEach((slide, i) => {
    slide.classList.toggle('active', i === currentHeroSlide);
  });

  dots.forEach((dot, i) => {
    dot.classList.toggle('active', i === currentHeroSlide);
  });
}

function startHeroAutoplay() {
  if (heroAutoplayTimer) {
    clearInterval(heroAutoplayTimer);
  }
  heroAutoplayTimer = setInterval(() => {
    showHeroSlide(currentHeroSlide + 1);
  }, 5000); // Change slide every 5 seconds
}

function renderFeaturedProducts() {
  const grid = document.getElementById('featured-products-grid');
  if (!grid) return;

  grid.innerHTML = '';
  const prods = getCatalogProducts();
  const featured = prods.slice(0, 4); // Display first 4 popular items

  const categoryLabels = {
    'amla-products': 'Amla Products',
    'nuts-powders': 'Nuts Powders',
    'healthy-mixes': 'Healthy Mixes',
    'other-organics': 'Other Organics'
  };

  featured.forEach(product => {
    const isWishlisted = wishlist.includes(product.id);
    const defaultSize = (product.sizes && product.sizes[0]) 
      ? product.sizes[0] 
      : { weight: product.weight || "Standard", price: product.price };
    const priceText = `Rs. ${defaultSize.price}`;
    const badgeText = categoryLabels[product.category] || (product.category || '').split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

    const card = document.createElement('div');
    card.className = 'product-card';
    card.innerHTML = `
      <div class="product-image-container" onclick="openDetailsModal('${product.id}')" style="cursor: pointer;">
        <img class="product-card-img" src="${product.image}" alt="${product.name}" loading="lazy" onerror="this.src='images/healthy-mix.jpg'">
        <span class="product-card-badge">${badgeText}</span>
      </div>
      <div class="product-card-body">
        <div class="product-card-rating">
          <i class="fa-solid fa-star"></i>
          <span>${(product.rating || 5.0).toFixed(1)} (${product.reviewsCount || 0} reviews)</span>
        </div>
        <h3 class="product-card-title" onclick="openDetailsModal('${product.id}')" style="cursor: pointer;">${product.name}</h3>
        <p class="product-card-desc">${product.description || ''}</p>
        <div class="product-card-footer">
          <div class="product-card-price-row">
            <span class="product-card-price">${priceText}</span>
            <span class="product-card-weight">${defaultSize.weight || product.weight || 'Standard'}</span>
          </div>
          <div class="product-card-actions">
            <button class="btn-card-add" onclick="addToCart('${product.id}', '${defaultSize.weight}', ${defaultSize.price})">
              <i class="fa-solid fa-cart-shopping"></i> Add
            </button>
            <button class="btn-card-wishlist ${isWishlisted ? 'active' : ''}" onclick="toggleWishlist('${product.id}')" title="Wishlist" aria-label="Add to Wishlist">
              <i class="${isWishlisted ? 'fa-solid' : 'fa-regular'} fa-heart"></i>
            </button>
            <button class="btn-card-detail" onclick="openDetailsModal('${product.id}')" title="View Details">
              <i class="fa-solid fa-eye"></i>
            </button>
          </div>
        </div>
      </div>
    `;
    grid.appendChild(card);
  });
}

// Automatically add reveal classes to elements dynamically
function applyRevealClasses() {
  const selectors = [
    '.product-card',
    '.gallery-item',
    '.feature-card',
    '.about-content',
    '.about-img-wrapper',
    '.contact-card',
    '.contact-form-col',
    '.section-title'
  ];
  
  selectors.forEach(selector => {
    document.querySelectorAll(selector).forEach(el => {
      el.classList.add('reveal');
    });
  });
}

// Scroll Reveal Animations
function initScrollReveal() {
  const revealElements = document.querySelectorAll('.reveal');
  
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('active');
          observer.unobserve(entry.target);
        }
      });
    }, {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    });
    
    revealElements.forEach(element => {
      observer.observe(element);
    });
  } else {
    // Fallback if IntersectionObserver is not supported
    revealElements.forEach(element => {
      element.classList.add('active');
    });
  }
}

// Inject Floating Cart Button
function injectFloatingCartButton() {
  if (document.getElementById('floating-cart-btn')) return;
  
  const btn = document.createElement('button');
  btn.id = 'floating-cart-btn';
  btn.className = 'floating-cart';
  btn.setAttribute('aria-label', 'Open Floating Cart');
  btn.innerHTML = `
    <i class="fa-solid fa-cart-shopping"></i>
    <span id="floating-cart-count" class="floating-cart-badge" style="display: none;">0</span>
  `;
  document.body.appendChild(btn);
  
  // Bind click event to trigger the main cart button
  btn.addEventListener('click', (e) => {
    e.preventDefault();
    const cartBtn = document.getElementById('cart-btn');
    if (cartBtn) cartBtn.click();
  });
}

// Toggle floating cart button visibility on scroll
function handleFloatingCartScroll() {
  const floatBtn = document.getElementById('floating-cart-btn');
  if (!floatBtn) return;
  
  if (window.scrollY > 300) {
    floatBtn.classList.add('active');
  } else {
    floatBtn.classList.remove('active');
  }
}

// Inject floating decorative vector leaves and wave divider behind hero elements
function injectHeroDecoLeaves() {
  const hero = document.querySelector('.hero');
  if (!hero) return;
  
  if (document.querySelector('.hero-deco-leaf-1')) return;
  
  const leaf1 = document.createElement('div');
  leaf1.className = 'hero-deco-leaf hero-deco-leaf-1';
  
  const leaf2 = document.createElement('div');
  leaf2.className = 'hero-deco-leaf hero-deco-leaf-2';
  
  hero.appendChild(leaf1);
  hero.appendChild(leaf2);

  // Inject bottom wave divider curve
  if (!document.querySelector('.hero-wave-divider')) {
    const wave = document.createElement('div');
    wave.className = 'hero-wave-divider';
    wave.innerHTML = `
      <svg viewBox="0 0 1200 120" preserveAspectRatio="none">
        <path d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V0H0V27.35A600.21,600.21,0,0,0,321.39,56.44Z" style="fill: var(--bg-main);"></path>
      </svg>
    `;
    hero.appendChild(wave);
  }
}

// Track and translate horizontal scroll layout for heritage steps
function handleHeritageScroll() {
  const wrapper = document.querySelector('.heritage-scroll-wrapper');
  const track = document.getElementById('heritage-track');
  if (!wrapper || !track) return;

  const rect = wrapper.getBoundingClientRect();
  const wrapperTop = rect.top;
  const wrapperHeight = rect.height;
  const viewportHeight = window.innerHeight;

  // Verify elements are active and we are in screen scope
  if (wrapperTop <= 0 && Math.abs(wrapperTop) <= wrapperHeight - viewportHeight) {
    const scrollPercent = Math.abs(wrapperTop) / (wrapperHeight - viewportHeight);
    const maxTranslate = track.scrollWidth - window.innerWidth + 200; // Account for margins
    track.style.transform = `translateX(-${scrollPercent * maxTranslate}px)`;

    const steps = track.querySelectorAll('.heritage-step');
    const kindleIndex = Math.min(steps.length - 1, Math.floor(scrollPercent * steps.length));
    steps.forEach((step, i) => {
      step.classList.toggle('kindled', i === kindleIndex);
    });
  }
}

// Interactive Ingredient Alchemy Mixer
function initAlchemyMixer() {
  const ingredients = document.querySelectorAll('.alchemy-ingredient');
  const pot = document.getElementById('alchemy-pot');
  const resultCard = document.getElementById('alchemy-result');
  const particlesContainer = document.getElementById('alchemy-particles');

  if (!pot || !resultCard) return;

  const alchemyData = {
    'ragi-almond-powder': {
      name: "Sprouted Ragi & Almond Mix",
      ingredients: "Sprouted Finger Millet (Ragi), Premium Almonds, Cardamom",
      benefit: "Extremely rich in calcium and bioavailable iron. Supports bone structure, weight gain, and is very gentle on the stomach.",
      process: "Sprouted for 24 hours, slow sun-dried, iron pan roasted, stone-ground",
      icon: "fa-solid fa-wheat-awn"
    },
    'nuts-powder': {
      name: "Sprouted Nuts Powder",
      ingredients: "Sprouted Almonds, Sprouted Walnuts, Sprouted Cashews, Pistachios, Pumpkin Seeds, Melon Seeds",
      benefit: "Packed with clean plant proteins, brain-healthy Omega-3 fats, and trace minerals. Excellent for building immunity and memory.",
      process: "Dry roasted traditionally in heavy iron pans, ground to a fine textured mix",
      icon: "fa-solid fa-seedling"
    },
    'cow-ghee': {
      name: "Pure Homemade Cow Ghee",
      ingredients: "100% Grass-Fed A2 Cow Milk Curd Butter",
      benefit: "Lubricates joints, enhances fat-soluble vitamin absorption, strengthens digestion (agni), and boosts brain function.",
      process: "Woodfire-clarified butter prepared using the ancient Vedic Bilona method",
      icon: "fa-solid fa-cheese"
    },
    'sweet-amla-candy': {
      name: "Wild Honey Soaked Amla Candy",
      ingredients: "Wild Forest Gooseberries (Amla), Raw Wild Forest Honey",
      benefit: "High-density natural Vitamin C source. Enhances immune cell function, skin brightness, hair thickness, and digestion.",
      process: "Steamed, sun-dried, cured naturally in raw forest honey for 60 days",
      icon: "fa-solid fa-leaf"
    },
    'amla-powder': {
      name: "Pure Organic Amla Powder",
      ingredients: "100% Sun-Dried Organic Indian Gooseberry (Amla)",
      benefit: "Powerful antioxidant blend. Purifies blood, strengthens natural immune defenses, and acts as a traditional hair tonic.",
      process: "Sun-dried in clean sheets, ground traditionally at low speed",
      icon: "fa-solid fa-mortar-pestle"
    },
    'forest-honey': {
      name: "Raw Wild Forest Honey",
      ingredients: "100% Raw Wild Forest Honey (Unprocessed, Single-Origin)",
      benefit: "Fights throat irritation, acts as a natural prebiotic, packed with wild forest pollens, and works as an instant energy booster.",
      process: "Hand-harvested from wild forest hives, cold-filtered directly",
      icon: "fa-solid fa-droplet"
    }
  };

  ingredients.forEach(ing => {
    ing.addEventListener('dragstart', (e) => {
      e.dataTransfer.setData('text/plain', ing.dataset.id);
      ing.classList.add('dragging');
      
      const soundActive = localStorage.getItem('soundActive') === 'true';
      if (soundActive) {
        playDragTone();
      }
    });

    ing.addEventListener('dragend', () => {
      ing.classList.remove('dragging');
    });

    let pointerDragging = false;
    ing.addEventListener('pointerdown', (e) => {
      if (e.pointerType === 'mouse') return;
      pointerDragging = true;
      ing.classList.add('dragging');
      ing.setPointerCapture(e.pointerId);
    });

    ing.addEventListener('pointermove', (e) => {
      if (!pointerDragging) return;
      const potRect = pot.getBoundingClientRect();
      const overPot = e.clientX >= potRect.left && e.clientX <= potRect.right &&
        e.clientY >= potRect.top && e.clientY <= potRect.bottom;
      pot.classList.toggle('dragover', overPot);
    });

    const endPointerDrag = (e) => {
      if (!pointerDragging) return;
      pointerDragging = false;
      ing.classList.remove('dragging');
      const potRect = pot.getBoundingClientRect();
      const overPot = e.clientX >= potRect.left && e.clientX <= potRect.right &&
        e.clientY >= potRect.top && e.clientY <= potRect.bottom;
      pot.classList.remove('dragover');
      if (overPot) triggerAlchemy(ing.dataset.id);
    };

    ing.addEventListener('pointerup', endPointerDrag);
    ing.addEventListener('pointercancel', endPointerDrag);

    ing.addEventListener('click', () => {
      triggerAlchemy(ing.dataset.id);
    });
  });

  pot.addEventListener('dragover', (e) => {
    e.preventDefault();
    pot.classList.add('dragover');
  });

  pot.addEventListener('dragleave', () => {
    pot.classList.remove('dragover');
  });

  pot.addEventListener('drop', (e) => {
    e.preventDefault();
    pot.classList.remove('dragover');
    const id = e.dataTransfer.getData('text/plain');
    triggerAlchemy(id);
  });

  let grinding = false;
  let grindMoved = false;
  let lastGrindAngle = 0;
  let grindAccum = 0;
  let lastGrindSteam = 0;

  const potAngleFromEvent = (e) => {
    const rect = pot.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    return Math.atan2(e.clientY - cy, e.clientX - cx);
  };

  pot.addEventListener('pointerdown', (e) => {
    if (e.button !== 0) return;
    grinding = true;
    grindMoved = false;
    grindAccum = 0;
    lastGrindAngle = potAngleFromEvent(e);
    pot.setPointerCapture(e.pointerId);
  });

  pot.addEventListener('pointermove', (e) => {
    if (!grinding) return;
    const angle = potAngleFromEvent(e);
    let delta = angle - lastGrindAngle;
    if (delta > Math.PI) delta -= Math.PI * 2;
    if (delta < -Math.PI) delta += Math.PI * 2;
    if (Math.abs(delta) > 0.08) grindMoved = true;
    grindAccum += Math.abs(delta);
    lastGrindAngle = angle;
    pot.classList.add('grinding');
    pot.style.transform = `scale(1.08) rotate(${grindAccum * 55}deg)`;
    const now = performance.now();
    if (grindAccum > 0.35 && now - lastGrindSteam > 80) {
      lastGrindSteam = now;
      spawnSteamBubble(pot.querySelector('.pot-steam'), 'default');
    }
  });

  const endGrind = () => {
    if (!grinding) return;
    grinding = false;
    pot.classList.remove('grinding');
    pot.style.transform = '';
    if (grindAccum > Math.PI * 1.6) {
      createPuffAnimation();
      showFloatingToast('Stone-ground in the iron pan');
      const soundActive = localStorage.getItem('soundActive') === 'true';
      if (soundActive) playDropTone();
    }
  };

  pot.addEventListener('pointerup', endGrind);
  pot.addEventListener('pointercancel', endGrind);

  pot.addEventListener('click', () => {
    if (grindMoved) {
      grindMoved = false;
      return;
    }
    // Pick a random ingredient if pot clicked
    const keys = Object.keys(alchemyData);
    const randomKey = keys[Math.floor(Math.random() * keys.length)];
    triggerAlchemy(randomKey);
  });

  // Spawn constant gentle steam particles inside the pot
  const steamContainer = document.createElement('div');
  steamContainer.className = 'pot-steam';
  pot.appendChild(steamContainer);

  setInterval(() => {
    spawnSteamBubble(steamContainer, 'default');
  }, 450);

  function spawnSteamBubble(container, type) {
    if (!container) return;
    const bubble = document.createElement('div');
    bubble.className = 'steam-bubble';
    
    const drift = (Math.random() * 80 - 40) + 'px';
    bubble.style.setProperty('--drift', drift);
    
    const leftOffset = 40 + Math.random() * 20;
    bubble.style.left = leftOffset + '%';
    
    if (type === 'ghee') {
      bubble.style.background = 'radial-gradient(circle, rgba(255,224,130,0.5) 0%, rgba(255,183,77,0.1) 60%, transparent 100%)';
    } else if (type === 'amla' || type === 'ragi') {
      bubble.style.background = 'radial-gradient(circle, rgba(200,230,201,0.5) 0%, rgba(129,199,132,0.1) 60%, transparent 100%)';
    } else if (type === 'honey') {
      bubble.style.background = 'radial-gradient(circle, rgba(255,224,178,0.5) 0%, rgba(255,152,0,0.1) 60%, transparent 100%)';
    }
    
    const duration = 2.0 + Math.random() * 0.8;
    bubble.style.animationDuration = duration + 's';
    
    container.appendChild(bubble);
    
    setTimeout(() => {
      bubble.remove();
    }, duration * 1000);
  }

  function triggerAlchemy(id) {
    const data = alchemyData[id];
    if (!data) return;

    // Run custom puff animation particles
    createPuffAnimation();

    // Trigger colored steam surge
    let steamType = 'default';
    if (id === 'cow-ghee') steamType = 'ghee';
    else if (id === 'amla-powder' || id === 'sweet-amla-candy' || id === 'ragi-almond-powder' || id === 'nuts-powder') steamType = 'ragi';
    else if (id === 'forest-honey') steamType = 'honey';

    const currentSteamContainer = pot.querySelector('.pot-steam');
    if (currentSteamContainer) {
      for (let i = 0; i < 15; i++) {
        setTimeout(() => {
          spawnSteamBubble(currentSteamContainer, steamType);
        }, i * 35);
      }
    }

    const soundActive = localStorage.getItem('soundActive') === 'true';
    if (soundActive) {
      playDropTone();
    }

    // Render magic recipe card details
    resultCard.style.opacity = '0';
    setTimeout(() => {
      resultCard.innerHTML = `
        <div class="result-active-content">
          <div class="result-header">
            <i class="${data.icon} result-icon"></i>
            <h4>${data.name}</h4>
          </div>
          <div class="result-details-box" style="display: flex; flex-direction: column; gap: 10px; margin-bottom: 20px; text-align: left;">
            <p style="font-size: 0.88rem; line-height: 1.6; color: var(--text-dark); margin: 0;"><strong>Ingredients:</strong> ${data.ingredients}</p>
            <p style="font-size: 0.88rem; line-height: 1.6; color: var(--text-dark); margin: 0;"><strong>Process:</strong> ${data.process}</p>
            <p style="font-size: 0.88rem; line-height: 1.6; color: var(--text-dark); margin: 0;"><strong>Health Value:</strong> ${data.benefit}</p>
          </div>
          <div class="result-product-box" style="padding: 0; background: transparent; border: none;">
            <button class="btn btn-primary" onclick="openDetailsModal('${id}')" style="width: 100%;">
              <i class="fa-solid fa-eye"></i> Quick View & Order
            </button>
          </div>
        </div>
      `;
      resultCard.style.opacity = '1';
    }, 200);
  }

  function createPuffAnimation() {
    if (!particlesContainer) return;
    particlesContainer.innerHTML = '';

    for (let i = 0; i < 12; i++) {
      const p = document.createElement('div');
      p.className = 'puff-particle';
      
      const angle = Math.random() * Math.PI * 2;
      const velocity = 25 + Math.random() * 45;
      const x = Math.cos(angle) * velocity;
      const y = Math.sin(angle) * velocity - 15; // upward pull
      
      p.style.setProperty('--tx', `${x}px`);
      p.style.setProperty('--ty', `${y}px`);
      p.style.left = '50%';
      p.style.top = '40%';
      
      particlesContainer.appendChild(p);
    }
  }
}

// Dynamic Time-of-Day Lighting Theme
function applyKitchenHour(hour) {
  const body = document.body;
  body.classList.remove('theme-morning', 'theme-afternoon', 'theme-sunset', 'theme-night');

  if (hour >= 6 && hour < 12) {
    body.classList.add('theme-morning');
  } else if (hour >= 12 && hour < 17) {
    body.classList.add('theme-afternoon');
  } else if (hour >= 17 && hour < 20) {
    body.classList.add('theme-sunset');
  } else {
    body.classList.add('theme-night');
  }
}

function initTimeBasedTheme() {
  const hour = new Date().getHours();
  applyKitchenHour(hour);
}

// Global variables for Web Audio API
let ambientAudioNode = null;
let audioCtx = null;

// Dynamically Inject Sound Toggle in Header Controls
function injectSoundToggle() {
  const container = document.querySelector('.nav-actions');
  if (!container) return;
  if (document.getElementById('sound-toggle')) return;
  
  const btn = document.createElement('button');
  btn.id = 'sound-toggle';
  btn.className = 'sound-toggle nav-action-btn';
  btn.setAttribute('aria-label', 'Toggle Soundscape');
  btn.innerHTML = `<i class="fa-solid fa-volume-xmark"></i>`;
  
  const wishlistBtn = document.getElementById('wishlist-btn');
  if (wishlistBtn) {
    container.insertBefore(btn, wishlistBtn);
  } else {
    container.appendChild(btn);
  }
  
  let soundActive = localStorage.getItem('soundActive') === 'true';
  updateSoundButtonUI(btn, soundActive);
  
  btn.addEventListener('click', () => {
    soundActive = !soundActive;
    localStorage.setItem('soundActive', soundActive);
    updateSoundButtonUI(btn, soundActive);
    
    if (soundActive) {
      startAmbientSound();
      playSynthChime(); // Warm arpeggio chime on click
    } else {
      stopAmbientSound();
    }
  });

  // Automatically start loop if user had it enabled (needs interaction first, so we wait for window interaction)
  window.addEventListener('click', () => {
    if (localStorage.getItem('soundActive') === 'true' && !ambientAudioNode) {
      startAmbientSound();
    }
  }, { once: true });
}

function updateSoundButtonUI(btn, active) {
  if (active) {
    btn.classList.add('active');
    btn.innerHTML = `<i class="fa-solid fa-volume-high"></i>`;
  } else {
    btn.classList.remove('active');
    btn.innerHTML = `<i class="fa-solid fa-volume-xmark"></i>`;
  }
}

// Synthesize organic hollow wooden block chime
// Helper to get/create and resume a single global AudioContext
function getAudioContext() {
  try {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    return audioCtx;
  } catch (e) {
    return null;
  }
}

// Synthesize organic hollow wooden block chime
function playWoodTap() {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();
    
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(650, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(320, ctx.currentTime + 0.12);
    
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(650, ctx.currentTime);
    filter.Q.setValueAtTime(4, ctx.currentTime);
    
    gain.gain.setValueAtTime(0.18, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);
    
    osc.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    
    osc.start();
    osc.stop(ctx.currentTime + 0.13);
  } catch (e) {}
}

// Synthesize luxury startup arpeggio chime
function playSynthChime() {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.50]; // C5 - E5 - G5 - C6 arpeggio
    
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.08);
      
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.05, now + idx * 0.08 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.35);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.start(now + idx * 0.08);
      osc.stop(now + idx * 0.08 + 0.4);
    });
  } catch (e) {}
}

// Synthesize soft rising lift tone on drag start
function playDragTone() {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(320, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(580, ctx.currentTime + 0.14); // rising pitch
    
    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.14);
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.start();
    osc.stop(ctx.currentTime + 0.15);
  } catch (e) {}
}

// Synthesize deep satisfying pot plop & sparkle chime on drop
function playDropTone() {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    
    // Deeper triangle pot drop base
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    
    osc1.type = 'triangle';
    osc1.frequency.setValueAtTime(190, now);
    osc1.frequency.exponentialRampToValueAtTime(95, now + 0.18); // falling pitch
    
    gain1.gain.setValueAtTime(0.2, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
    
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.2);
    
    // Sparkle high sine chimes representing steam/flour particles
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(880, now + 0.05); // A5 note
    osc2.frequency.setValueAtTime(1320, now + 0.11); // E6 note
    
    gain2.gain.setValueAtTime(0, now);
    gain2.gain.linearRampToValueAtTime(0.08, now + 0.06);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.28);
    
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.05);
    osc2.stop(now + 0.3);
  } catch (e) {}
}

// Synthesize relaxing wind/breeze ambient soundscape (looping noise buffer)
function startAmbientSound() {
  if (ambientAudioNode) return;
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    
    const bufferSize = 2 * ctx.sampleRate;
    const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    
    // Fill buffer with random noise values
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }
    
    const whiteNoise = ctx.createBufferSource();
    whiteNoise.buffer = noiseBuffer;
    whiteNoise.loop = true;
    
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(450, ctx.currentTime);
    filter.Q.setValueAtTime(2.5, ctx.currentTime);
    
    // Slow sweep LFO (low frequency oscillator) to modulate lowpass filter (simulates soft wind swells)
    const lfo = ctx.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.setValueAtTime(0.12, ctx.currentTime); // Slow 0.12Hz cycle
    
    const lfoGain = ctx.createGain();
    lfoGain.gain.setValueAtTime(220, ctx.currentTime); // Modulate lowpass up/down by 220Hz
    
    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(0.03, ctx.currentTime); // Very subtle backdrop volume
    
    lfo.connect(lfoGain);
    lfoGain.connect(filter.frequency);
    whiteNoise.connect(filter);
    filter.connect(masterGain);
    masterGain.connect(ctx.destination);
    
    lfo.start();
    whiteNoise.start();
    
    ambientAudioNode = {
      osc: lfo,
      source: whiteNoise,
      gain: masterGain
    };
  } catch (e) {}
}

function stopAmbientSound() {
  if (!ambientAudioNode) return;
  try {
    ambientAudioNode.osc.stop();
    ambientAudioNode.source.stop();
  } catch (e) {}
  ambientAudioNode = null;
}

// Global click event to play wood tap micro-chime on interactive elements
document.addEventListener('click', (e) => {
  const soundActive = localStorage.getItem('soundActive') === 'true';
  if (!soundActive) return;
  
  const target = e.target;
  if (
    target.closest('button') || 
    target.closest('a') || 
    target.closest('.alchemy-ingredient') || 
    target.closest('.product-card') ||
    target.closest('.hero-dot')
  ) {
    playWoodTap();
  }
});

// Dynamic 3D depth parallax zoom on background leaves when scrolling past hero
function handleLeafCanopyZoom() {
  const leaf1 = document.querySelector('.hero-deco-leaf-1');
  const leaf2 = document.querySelector('.hero-deco-leaf-2');
  if (!leaf1 && !leaf2) return;
  
  const scrollY = window.scrollY;
  const maxScroll = 650; // Transition finishes at 650px scroll depth
  
  if (scrollY <= maxScroll) {
    const progress = scrollY / maxScroll;
    
    if (leaf1) {
      const scale = 1 + progress * 2.0; // zoom up to 3x size
      const opacity = 0.12 * (1 - progress);
      const rotation = -15 + progress * -20;
      leaf1.style.transform = `scale(${scale}) rotate(${rotation}deg) translate(${progress * 60}px, ${progress * -60}px)`;
      leaf1.style.opacity = opacity;
    }
    
    if (leaf2) {
      const scale = 1 + progress * 2.5; // zoom up to 3.5x size
      const opacity = 0.12 * (1 - progress);
      const rotation = 45 + progress * 25;
      leaf2.style.transform = `scale(${scale}) rotate(${rotation}deg) translate(${progress * -80}px, ${progress * 80}px)`;
      leaf2.style.opacity = opacity;
    }
  } else {
    // Hide completely once scrolled past the threshold
    if (leaf1) leaf1.style.opacity = 0;
    if (leaf2) leaf2.style.opacity = 0;
  }
}

function injectLightLeaks() {
  if (document.querySelector('.light-leak')) return;
  ['leak-green', 'leak-gold', 'leak-cream'].forEach((cls) => {
    const leak = document.createElement('div');
    leak.className = `light-leak ${cls}`;
    document.body.prepend(leak);
  });
}

function injectKolamTrail() {
  if (document.getElementById('kolam-canvas')) return;
  if (window.matchMedia('(pointer: coarse)').matches) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const canvas = document.createElement('canvas');
  canvas.id = 'kolam-canvas';
  canvas.setAttribute('aria-hidden', 'true');
  document.body.appendChild(canvas);

  const ctx = canvas.getContext('2d');
  const dots = [];
  let lastX = 0;
  let lastY = 0;
  let lastStamp = 0;

  const resize = () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  };
  resize();
  window.addEventListener('resize', resize);

  const stampKolam = (x, y, life) => {
    const size = 7;
    ctx.save();
    ctx.globalAlpha = Math.max(0, life);
    ctx.strokeStyle = 'rgba(46, 125, 50, 0.45)';
    ctx.fillStyle = 'rgba(245, 124, 0, 0.55)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x, y - size);
    ctx.lineTo(x + size, y);
    ctx.lineTo(x, y + size);
    ctx.lineTo(x - size, y);
    ctx.closePath();
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(x, y, 1.6, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  };

  window.addEventListener('mousemove', (e) => {
    const dx = e.clientX - lastX;
    const dy = e.clientY - lastY;
    const dist = Math.hypot(dx, dy);
    if (dist < 18) return;
    lastX = e.clientX;
    lastY = e.clientY;
    lastStamp = performance.now();
    dots.push({ x: e.clientX, y: e.clientY, born: lastStamp });
    if (dots.length > 40) dots.shift();
  });

  const tick = (now) => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (let i = dots.length - 1; i >= 0; i--) {
      const age = (now - dots[i].born) / 900;
      if (age >= 1) {
        dots.splice(i, 1);
        continue;
      }
      stampKolam(dots[i].x, dots[i].y, 1 - age);
    }
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}

function initGalleryLoupe() {
  document.querySelectorAll('.gallery-item').forEach((item) => {
    const img = item.querySelector('img');
    if (!img) return;

    const selectItem = () => {
      document.querySelectorAll('.gallery-item.is-selected').forEach((selectedItem) => {
        if (selectedItem !== item) {
          selectedItem.classList.remove('is-selected');
          selectedItem.setAttribute('aria-expanded', 'false');
        }
      });
      const isSelected = item.classList.toggle('is-selected');
      item.setAttribute('aria-expanded', String(isSelected));
    };

    item.addEventListener('click', selectItem);
    item.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        selectItem();
      }
    });

    if (window.matchMedia('(pointer: coarse)').matches) return;

    const loupe = document.createElement('div');
    loupe.className = 'gallery-loupe';
    item.appendChild(loupe);

    const move = (e) => {
      const rect = item.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const px = (x / rect.width) * 100;
      const py = (y / rect.height) * 100;
      loupe.style.left = `${x - 75}px`;
      loupe.style.top = `${y - 75}px`;
      loupe.style.backgroundImage = `url('${img.src}')`;
      loupe.style.backgroundSize = `${rect.width * 2.2}px ${rect.height * 2.2}px`;
      loupe.style.backgroundPosition = `${px}% ${py}%`;
    };

    item.addEventListener('mousemove', move);
  });
}

function burstKitchenSeeds(x, y) {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  for (let i = 0; i < 14; i++) {
    const seed = document.createElement('span');
    seed.className = 'kitchen-seed';
    const angle = Math.random() * Math.PI * 2;
    const dist = 40 + Math.random() * 70;
    seed.style.left = `${x}px`;
    seed.style.top = `${y}px`;
    seed.style.setProperty('--sx', `${Math.cos(angle) * dist}px`);
    seed.style.setProperty('--sy', `${Math.sin(angle) * dist}px`);
    document.body.appendChild(seed);
    setTimeout(() => seed.remove(), 900);
  }
}


