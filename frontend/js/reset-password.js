/**
 * Reset Password Script - Standalone Client
 * Anuradha Homemade Organic Products
 */

document.addEventListener("DOMContentLoaded", () => {
    const resetForm = document.getElementById("reset-form");
    const tokenInput = document.getElementById("token");
    const passwordInput = document.getElementById("password");
    const confirmInput = document.getElementById("confirmPassword");
    
    const passwordError = document.getElementById("password-error");
    const confirmError = document.getElementById("confirm-error");
    
    const strengthMeter = document.getElementById("strength-meter");
    const strengthBar = document.getElementById("strength-bar");
    const strengthText = document.getElementById("strength-text");

    const togglePasswordBtn = document.getElementById("toggle-password");
    const toggleConfirmBtn = document.getElementById("toggle-confirm-password");
    const btnReset = document.getElementById("btn-reset");
    const alertBox = document.getElementById("alert-box");
    const alertText = document.getElementById("alert-text");
    const invalidTokenState = document.getElementById("invalid-token-state");

    // Extract token from URL query parameters
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get("token");
    const emailParam = urlParams.get("email");

    if (token) {
        if (tokenInput) tokenInput.value = token;
        if (resetForm) resetForm.style.display = "block";
    } else {
        if (invalidTokenState) invalidTokenState.style.display = "block";
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

    // Toggle Confirm Password Visibility
    if (toggleConfirmBtn && confirmInput) {
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
    if (passwordInput) {
        passwordInput.addEventListener("input", () => {
            const password = passwordInput.value;
            if (!password) {
                if (strengthMeter) strengthMeter.style.display = "none";
                if (strengthText) strengthText.style.display = "none";
                return;
            }

            if (strengthMeter) strengthMeter.style.display = "block";
            if (strengthText) strengthText.style.display = "block";

            const strength = checkPasswordStrength(password);
            updateStrengthUI(strength);
        });
    }

    // Reset Password Submission
    if (resetForm) {
        resetForm.addEventListener("submit", (e) => {
            e.preventDefault();

            // Reset warnings
            hideAlert();
            if (passwordError) passwordError.style.display = "none";
            if (confirmError) confirmError.style.display = "none";
            if (passwordInput) passwordInput.classList.remove("input-error");
            if (confirmInput) confirmInput.classList.remove("input-error");

            let isValid = true;
            const password = passwordInput.value;
            const confirmPassword = confirmInput ? confirmInput.value : "";

            if (!password) {
                showInputError(passwordInput, passwordError, "Password is required.");
                isValid = false;
            } else if (password.length < 6) {
                showInputError(passwordInput, passwordError, "Password must be at least 6 characters long.");
                isValid = false;
            }

            if (confirmInput && password !== confirmPassword) {
                showInputError(confirmInput, confirmError, "Passwords do not match.");
                isValid = false;
            }

            if (!isValid) return;

            setLoading(true);

            setTimeout(() => {
                const emailToReset = emailParam || sessionStorage.getItem("reset_email");
                if (emailToReset && window.StorageService) {
                    const users = window.StorageService.getUsers();
                    const user = users.find(u => u.email.toLowerCase() === emailToReset.toLowerCase());
                    if (user) {
                        user.password = password;
                        localStorage.setItem('anuradha_users', JSON.stringify(users));
                    }
                }

                showAlert("success", "Password has been reset successfully! Redirecting to Home Page...");
                resetForm.reset();
                if (strengthMeter) strengthMeter.style.display = "none";
                if (strengthText) strengthText.style.display = "none";
                setTimeout(() => {
                    window.location.href = "index.html";
                }, 1200);
            }, 400);
        });
    }

    function checkPasswordStrength(password) {
        let score = 0;
        if (password.length >= 6) score++;
        if (password.length >= 8) score++;
        if (/[0-9]/.test(password)) score++;
        if (/[^A-Za-z0-9]/.test(password)) score++;
        return score;
    }

    function updateStrengthUI(score) {
        if (!strengthBar || !strengthText) return;
        let width = "0%";
        let color = "var(--error-color)";
        let text = "Weak";

        if (score === 1) {
            width = "25%";
            color = "var(--error-color)";
            text = "Weak";
        } else if (score === 2) {
            width = "50%";
            color = "#f57c00";
            text = "Medium";
        } else if (score === 3) {
            width = "75%";
            color = "#fbc02d";
            text = "Good";
        } else if (score >= 4) {
            width = "100%";
            color = "var(--primary-color)";
            text = "Strong";
        }

        strengthBar.style.width = width;
        strengthBar.style.backgroundColor = color;
        strengthText.textContent = `Password strength: ${text}`;
        strengthText.style.color = color;
    }

    function showInputError(input, errorElement, message) {
        if (input) input.classList.add("input-error");
        if (errorElement) {
            errorElement.textContent = message;
            errorElement.style.display = "block";
        }
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
        if (!btnReset) return;
        const btnText = btnReset.querySelector(".btn-text");
        const spinner = btnReset.querySelector(".spinner");

        if (isLoading) {
            btnReset.disabled = true;
            if (btnText) btnText.textContent = "Resetting password...";
            if (spinner) spinner.style.display = "inline-block";
        } else {
            btnReset.disabled = false;
            if (btnText) btnText.textContent = "Reset Password";
            if (spinner) spinner.style.display = "none";
        }
    }
});
