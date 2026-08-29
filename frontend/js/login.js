const backendUrl = window.location.port === "8080" ? "" : "http://localhost:8080";

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

    // Check query params for verification success/error redirects
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has("verified")) {
        showAlert("success", "Email verified successfully. You can now sign in.");
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
    togglePasswordBtn.addEventListener("click", () => {
        if (passwordInput.type === "password") {
            passwordInput.type = "text";
            togglePasswordBtn.innerHTML = eyeOffSvg;
        } else {
            passwordInput.type = "password";
            togglePasswordBtn.innerHTML = eyeSvg;
        }
    });

    // Form submission
    loginForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        
        // Hide messages
        hideAlert();
        emailError.style.display = "none";
        passwordError.style.display = "none";
        emailInput.classList.remove("input-error");
        passwordInput.classList.remove("input-error");

        // Validate
        let isValid = true;
        const email = emailInput.value.trim();
        const password = passwordInput.value;

        if (!email) {
            emailError.textContent = "Email is required.";
            emailError.style.display = "block";
            emailInput.classList.add("input-error");
            isValid = false;
        } else if (!validateEmail(email)) {
            emailError.textContent = "Please enter a valid email address.";
            emailError.style.display = "block";
            emailInput.classList.add("input-error");
            isValid = false;
        }

        if (!password) {
            passwordError.textContent = "Password is required.";
            passwordError.style.display = "block";
            passwordInput.classList.add("input-error");
            isValid = false;
        }

        if (!isValid) return;

        // Loading state
        setLoading(true);

        try {
            const response = await fetch(`${backendUrl}/api/auth/login`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Accept": "application/json"
                },
                body: JSON.stringify({ email, password }),
                credentials: "include" // crucial for HttpOnly cookies
            });

            const data = await response.json();

            if (response.ok) {
                showAlert("success", "Login successful. Redirecting...");
                setTimeout(() => {
                    const redirectUrl = sessionStorage.getItem('redirectAfterLogin');
                    if (redirectUrl) {
                        sessionStorage.removeItem('redirectAfterLogin');
                        window.location.href = redirectUrl;
                    } else {
                        window.location.href = "customer/dashboard.html";
                    }
                }, 1500);
            } else {
                showAlert("error", data.message || "Invalid email or password.");
                setLoading(false);
            }
        } catch (error) {
            console.error("Login request error", error);
            showAlert("error", "Network connection failed. Please try again.");
            setLoading(false);
        }
    });

    // Google Sign-In redirect
    btnGoogleLogin.addEventListener("click", () => {
        // Redirect browser directly to backend Google OAuth initiation endpoint
        window.location.href = `${backendUrl}/oauth2/authorization/google`;
    });

    function validateEmail(email) {
        const re = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
        return re.test(email);
    }

    function showAlert(type, message) {
        alertBox.className = `alert alert-${type}`;
        alertText.textContent = message;
        alertBox.style.display = "flex";
    }

    function hideAlert() {
        alertBox.style.display = "none";
    }

    function setLoading(isLoading) {
        const btnText = btnLogin.querySelector(".btn-text");
        const spinner = btnLogin.querySelector(".spinner");

        if (isLoading) {
            btnLogin.disabled = true;
            btnGoogleLogin.disabled = true;
            btnText.textContent = "Signing in...";
            spinner.style.display = "inline-block";
        } else {
            btnLogin.disabled = false;
            btnGoogleLogin.disabled = false;
            btnText.textContent = "Sign In";
            spinner.style.display = "none";
        }
    }
});
