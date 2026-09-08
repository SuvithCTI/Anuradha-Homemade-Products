/**
 * Login Script - Standalone Client Authentication
 * Anuradha Homemade Organic Products
 */

document.addEventListener("DOMContentLoaded", () => {
    const loginForm = document.getElementById("login-form");
    const emailInput = document.getElementById("email");
    const passwordInput = document.getElementById("password");
    
    const emailError = document.getElementById("email-error");
    const passwordError = document.getElementById("password-error");
    
    const togglePasswordBtn = document.getElementById("toggle-password");
    const btnLogin = document.getElementById("btn-login");
    const btnGoogleLogin = document.getElementById("btn-google-login");
    const alertBox = document.getElementById("alert-box");
    const alertText = document.getElementById("alert-text");

    // Check query params
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has("verified")) {
        showAlert("success", "Email verified successfully. You can now sign in.");
    } else if (urlParams.has("info")) {
        showAlert("info", urlParams.get("info"));
    } else if (urlParams.has("registered")) {
        showAlert("success", "Account created successfully! Please sign in.");
    } else if (urlParams.has("error")) {
        showAlert("error", urlParams.get("error"));
    }

    const eyeSvg = `
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
            <circle cx="12" cy="12" r="3"></circle>
        </svg>
    `;
    const eyeOffSvg = `
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
            <line x1="1" y1="1" x2="23" y2="23"></line>
        </svg>
    `;

    // Toggle Password Visibility
    if (togglePasswordBtn && passwordInput) {
        togglePasswordBtn.addEventListener("click", () => {
            if (passwordInput.type === "password") {
                passwordInput.type = "text";
                togglePasswordBtn.innerHTML = eyeOffSvg;
            } else {
                passwordInput.type = "password";
                togglePasswordBtn.innerHTML = eyeSvg;
            }
        });
    }

    // Form submission
    if (loginForm) {
        loginForm.addEventListener("submit", (e) => {
            e.preventDefault();
            
            // Hide messages
            hideAlert();
            if (emailError) emailError.style.display = "none";
            if (passwordError) passwordError.style.display = "none";
            if (emailInput) emailInput.classList.remove("input-error");
            if (passwordInput) passwordInput.classList.remove("input-error");

            // Validate
            let isValid = true;
            const email = emailInput.value.trim();
            const password = passwordInput.value;

            if (!email) {
                if (emailError) {
                    emailError.textContent = "Email is required.";
                    emailError.style.display = "block";
                }
                emailInput.classList.add("input-error");
                isValid = false;
            } else if (!validateEmail(email)) {
                if (emailError) {
                    emailError.textContent = "Please enter a valid email address.";
                    emailError.style.display = "block";
                }
                emailInput.classList.add("input-error");
                isValid = false;
            }

            if (!password) {
                if (passwordError) {
                    passwordError.textContent = "Password is required.";
                    passwordError.style.display = "block";
                }
                passwordInput.classList.add("input-error");
                isValid = false;
            }

            if (!isValid) return;

            setLoading(true);

            const API_BASE = (window.location.port === '5000' || (window.location.protocol === 'https:' && !window.location.port))
                ? window.location.origin
                : (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' ? 'http://localhost:5000' : window.location.origin);

            // 1. Try Backend API login
            fetch(`${API_BASE}/api/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            })
            .then(res => res.json())
            .then(data => {
                if (data.success && data.token) {
                    localStorage.setItem('auth_token', data.token);
                    localStorage.setItem('anuradha_current_user', JSON.stringify(data.user));
                    if (window.StorageService) {
                        window.StorageService.setCurrentUser(data.user);
                    }
                    showAlert("success", "Login successful. Welcome back!");
                    setTimeout(() => {
                        if (data.user.role === 'ADMIN') {
                            window.location.href = "admin/dashboard.html";
                        } else {
                            window.location.href = "index.html";
                        }
                    }, 600);
                } else {
                    // Fallback to local storage engine
                    handleLocalFallback(email, password);
                }
            })
            .catch(() => {
                // Network/offline fallback
                handleLocalFallback(email, password);
            });

            function handleLocalFallback(email, password) {
                const res = window.StorageService ? window.StorageService.login(email, password) : { success: false, message: 'Invalid email or password.' };
                if (res.success) {
                    showAlert("success", "Login successful. Welcome back!");
                    setTimeout(() => {
                        const currentUser = window.StorageService.getCurrentUser();
                        if (currentUser && currentUser.role === 'ADMIN') {
                            window.location.href = "admin/dashboard.html";
                        } else {
                            window.location.href = "index.html";
                        }
                    }, 600);
                } else {
                    showAlert("error", res.message || "Invalid email or password.");
                    setLoading(false);
                }
            }
        });
    }

    // Google Sign-In Simulation
    if (btnGoogleLogin) {
        btnGoogleLogin.addEventListener("click", () => {
            setLoading(true);
            setTimeout(() => {
                // Register/Login Demo Google Account
                const googleUser = {
                    firstName: "Google",
                    lastName: "User",
                    email: "customer@gmail.com",
                    password: "GoogleAuth@123",
                    authProvider: "GOOGLE",
                    role: "CUSTOMER"
                };
                if (window.StorageService) {
                    window.StorageService.register(googleUser);
                    window.StorageService.login(googleUser.email, googleUser.password);
                }
                showAlert("success", "Google Sign-In successful! Redirecting...");
                setTimeout(() => {
                    window.location.href = "index.html";
                }, 700);
            }, 500);
        });
    }

    function validateEmail(email) {
        if (!email) return false;
        const clean = email.trim().toLowerCase();
        if (clean === 'admin' || clean === 'admin@anuradhaorganics.com') return true;
        const re = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
        return re.test(clean);
    }

    function showAlert(type, message) {
        if (!alertBox || !alertText) return;
        alertBox.className = `alert alert-${type}`;
        alertText.textContent = message;
        alertBox.style.display = "flex";
    }

    function hideAlert() {
        if (alertBox) alertBox.style.display = "none";
    }

    function setLoading(isLoading) {
        if (!btnLogin) return;
        const btnText = btnLogin.querySelector(".btn-text");
        const spinner = btnLogin.querySelector(".spinner");

        if (isLoading) {
            btnLogin.disabled = true;
            if (btnGoogleLogin) btnGoogleLogin.disabled = true;
            if (btnText) btnText.textContent = "Signing in...";
            if (spinner) spinner.style.display = "inline-block";
        } else {
            btnLogin.disabled = false;
            if (btnGoogleLogin) btnGoogleLogin.disabled = false;
            if (btnText) btnText.textContent = "Sign In";
            if (spinner) spinner.style.display = "none";
        }
    }
});
