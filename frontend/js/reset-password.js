const backendUrl = window.location.port === "8080" ? "" : "http://localhost:8080";

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

    if (token) {
        tokenInput.value = token;
        resetForm.style.display = "block";
    } else {
        invalidTokenState.style.display = "block";
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

    // Reset Password Submission
    resetForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        // Reset warnings
        hideAlert();
        passwordError.style.display = "none";
        confirmError.style.display = "none";
        passwordInput.classList.remove("input-error");
        confirmInput.classList.remove("input-error");

        let isValid = true;
        const tokenValue = tokenInput.value;
        const password = passwordInput.value;
        const confirmPassword = confirmInput.value;

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

        if (!isValid) return;

        // Loading
        setLoading(true);

        try {
            const response = await fetch(`${backendUrl}/api/auth/reset-password`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Accept": "application/json"
                },
                body: JSON.stringify({ token: tokenValue, password, confirmPassword })
            });

            const data = await response.json();

            if (response.ok) {
                showAlert("success", data.message || "Password has been reset successfully. Redirecting to login...");
                resetForm.reset();
                strengthMeter.style.display = "none";
                strengthText.style.display = "none";
                setTimeout(() => {
                    window.location.href = "login.html";
                }, 2000);
            } else {
                showAlert("error", data.message || "Password reset failed. Token may be expired.");
                setLoading(false);
            }
        } catch (error) {
            console.error("Reset password request error", error);
            showAlert("error", "Network connection failed. Please try again.");
            setLoading(false);
        }
    });

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
            color = "#f57c00";
            text = "Medium";
        } else if (score === 3) {
            width = "75%";
            color = "#fbc02d";
            text = "Good";
        } else if (score === 4) {
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
        input.classList.add("input-error");
        errorElement.textContent = message;
        errorElement.style.display = "block";
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
        const btnText = btnReset.querySelector(".btn-text");
        const spinner = btnReset.querySelector(".spinner");

        if (isLoading) {
            btnReset.disabled = true;
            btnText.textContent = "Resetting password...";
            spinner.style.display = "inline-block";
        } else {
            btnReset.disabled = false;
            btnText.textContent = "Reset Password";
            spinner.style.display = "none";
        }
    }
});
