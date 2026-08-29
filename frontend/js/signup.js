const backendUrl = (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1")
    ? (window.location.port === "8080" ? "" : "http://localhost:8080")
    : "https://anuradha-homemade-products.onrender.com";

document.addEventListener("DOMContentLoaded", () => {
    const signupForm = document.getElementById("signup-form");
    
    const firstNameInput = document.getElementById("firstName");
    const lastNameInput = document.getElementById("lastName");
    const emailInput = document.getElementById("email");
    const passwordInput = document.getElementById("password");
    const confirmInput = document.getElementById("confirmPassword");
    const termsCheckbox = document.getElementById("terms");

    const firstNameError = document.getElementById("first-name-error");
    const lastNameError = document.getElementById("last-name-error");
    const emailError = document.getElementById("email-error");
    const passwordError = document.getElementById("password-error");
    const confirmError = document.getElementById("confirm-error");
    const termsError = document.getElementById("terms-error");

    const strengthMeter = document.getElementById("strength-meter");
    const strengthBar = document.getElementById("strength-bar");
    const strengthText = document.getElementById("strength-text");

    const togglePasswordBtn = document.getElementById("toggle-password");
    const toggleConfirmBtn = document.getElementById("toggle-confirm-password");
    const btnSignup = document.getElementById("btn-signup");
    const btnGoogleSignup = document.getElementById("btn-google-signup");
    const alertBox = document.getElementById("alert-box");
    const alertText = document.getElementById("alert-text");

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

    // Toggle Confirm Password Visibility
    if (toggleConfirmBtn) {
        toggleConfirmBtn.addEventListener("click", () => {
            if (confirmInput.type === "password") {
                confirmInput.type = "text";
                toggleConfirmBtn.innerHTML = eyeOffSvg;
            } else {
                confirmInput.type = "password";
                toggleConfirmBtn.innerHTML = eyeSvg;
            }
        });
    }

    // Password Strength Checker
    passwordInput.addEventListener("input", () => {
        const password = passwordInput.value;
        if (!password) {
            strengthMeter.style.display = "none";
            strengthText.style.display = "none";
            return;
        }

        strengthMeter.style.display = "block";
        strengthText.style.display = "block";

        const strength = checkPasswordStrength(password);
        updateStrengthUI(strength);
    });

    // Form submission
    signupForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        
        // Reset warnings
        hideAlert();
        resetValidationErrors();

        // Validation checks
        let isValid = true;
        const firstName = firstNameInput.value.trim();
        const lastName = lastNameInput.value.trim();
        const email = emailInput.value.trim();
        const password = passwordInput.value;
        const confirmPassword = confirmInput.value;
        const termsAccepted = termsCheckbox.checked;

        if (!firstName) {
            showInputError(firstNameInput, firstNameError, "First name is required.");
            isValid = false;
        }

        if (!lastName) {
            showInputError(lastNameInput, lastNameError, "Last name is required.");
            isValid = false;
        }

        if (!email) {
            showInputError(emailInput, emailError, "Email is required.");
            isValid = false;
        } else if (!validateEmail(email)) {
            showInputError(emailInput, emailError, "Please enter a valid email address.");
            isValid = false;
        }

        if (!password) {
            showInputError(passwordInput, passwordError, "Password is required.");
            isValid = false;
        } else if (password.length < 8) {
            showInputError(passwordInput, passwordError, "Password must be at least 8 characters long.");
            isValid = false;
        }

        if (!confirmPassword) {
            showInputError(confirmInput, confirmError, "Please confirm your password.");
            isValid = false;
        } else if (password !== confirmPassword) {
            showInputError(confirmInput, confirmError, "Passwords do not match.");
            isValid = false;
        }

        if (!termsAccepted) {
            termsError.style.display = "block";
            isValid = false;
        }

        if (!isValid) return;

        // Loading State
        setLoading(true);

        try {
            const response = await fetch(`${backendUrl}/api/auth/signup`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Accept": "application/json"
                },
                body: JSON.stringify({ firstName, lastName, email, password })
            });

            const data = await response.json();

            if (response.ok) {
                sessionStorage.setItem("pendingEmail", email);
                showAlert("success", "Registration successful! Redirecting to verification page...");
                setTimeout(() => {
                    window.location.href = "verify-pending.html";
                }, 1500);
            } else {
                showAlert("error", data.message || "Registration failed. Please try again.");
            }
        } catch (error) {
            console.error("Signup request error", error);
            showAlert("error", "Network connection failed. Please try again.");
        } finally {
            setLoading(false);
        }
    });

    // Google Sign-In redirect
    btnGoogleSignup.addEventListener("click", () => {
        window.location.href = `${backendUrl}/oauth2/authorization/google`;
    });

    function validateEmail(email) {
        const re = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
        return re.test(email);
    }

    // Password strength check criteria
    function checkPasswordStrength(password) {
        let score = 0;
        if (password.length >= 8) score++;
        if (/[A-Z]/.test(password)) score++;
        if (/[0-9]/.test(password)) score++;
        if (/[^A-Za-z0-9]/.test(password)) score++;
        return score;
    }

    function updateStrengthUI(score) {
        let width = "0%";
        let color = "var(--error-color)";
        let text = "Weak";

        if (score === 1) {
            width = "25%";
            color = "var(--error-color)";
            text = "Weak";
        } else if (score === 2) {
            width = "50%";
            color = "#f57c00"; // Orange
            text = "Medium";
        } else if (score === 3) {
            width = "75%";
            color = "#fbc02d"; // Yellow
            text = "Good";
        } else if (score === 4) {
            width = "100%";
            color = "var(--primary-color)"; // Green
            text = "Strong";
        }

        strengthBar.style.width = width;
        strengthBar.style.backgroundColor = color;
        strengthText.textContent = `Password strength: ${text}`;
        strengthText.style.color = color;
    }

    function showInputError(input, errorElement, message) {
        input.classList.add("input-error");
        errorElement.textContent = message;
        errorElement.style.display = "block";
    }

    function resetValidationErrors() {
        const inputs = [firstNameInput, lastNameInput, emailInput, passwordInput, confirmInput];
        inputs.forEach(input => input.classList.remove("input-error"));

        const errors = [firstNameError, lastNameError, emailError, passwordError, confirmError, termsError];
        errors.forEach(err => err.style.display = "none");
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
        const btnText = btnSignup.querySelector(".btn-text");
        const spinner = btnSignup.querySelector(".spinner");

        if (isLoading) {
            btnSignup.disabled = true;
            btnGoogleSignup.disabled = true;
            btnText.textContent = "Creating account...";
            spinner.style.display = "inline-block";
        } else {
            btnSignup.disabled = false;
            btnGoogleSignup.disabled = false;
            btnText.textContent = "Create Account";
            spinner.style.display = "none";
        }
    }
});
