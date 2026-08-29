const backendUrl = window.location.port === "8080" ? "" : "http://localhost:8080";

document.addEventListener("DOMContentLoaded", () => {
    const forgotForm = document.getElementById("forgot-form");
    const emailInput = document.getElementById("email");
    const emailError = document.getElementById("email-error");
    const btnForgot = document.getElementById("btn-forgot");
    const alertBox = document.getElementById("alert-box");
    const alertText = document.getElementById("alert-text");

    forgotForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        
        // Clear alerts
        hideAlert();
        emailError.style.display = "none";
        emailInput.classList.remove("input-error");

        const email = emailInput.value.trim();

        if (!email) {
            emailInput.classList.add("input-error");
            emailError.textContent = "Email is required.";
            emailError.style.display = "block";
            return;
        } else if (!validateEmail(email)) {
            emailInput.classList.add("input-error");
            emailError.textContent = "Please enter a valid email address.";
            emailError.style.display = "block";
            return;
        }

        // Loading
        setLoading(true);

        try {
            const response = await fetch(`${backendUrl}/api/auth/forgot-password`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Accept": "application/json"
                },
                body: JSON.stringify({ email })
            });

            const data = await response.json();

            // Showing success regardless of email existence (standard security practice)
            showAlert("success", data.message || "If an account exists with this email, a password reset link has been sent.");
            forgotForm.reset();
        } catch (error) {
            console.error("Forgot password request error", error);
            showAlert("error", "Network connection failed. Please try again.");
        } finally {
            setLoading(false);
        }
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
        const btnText = btnForgot.querySelector(".btn-text");
        const spinner = btnForgot.querySelector(".spinner");

        if (isLoading) {
            btnForgot.disabled = true;
            btnText.textContent = "Sending reset email...";
            spinner.style.display = "inline-block";
        } else {
            btnForgot.disabled = false;
            btnText.textContent = "Send Reset Link";
            spinner.style.display = "none";
        }
    }
});
