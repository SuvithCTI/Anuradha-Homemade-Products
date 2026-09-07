/**
 * Forgot Password Script - Standalone Client
 * Anuradha Homemade Organic Products
 */

document.addEventListener("DOMContentLoaded", () => {
    const forgotForm = document.getElementById("forgot-form");
    const emailInput = document.getElementById("email");
    const emailError = document.getElementById("email-error");
    const btnForgot = document.getElementById("btn-forgot");
    const alertBox = document.getElementById("alert-box");
    const alertText = document.getElementById("alert-text");

    if (forgotForm) {
        forgotForm.addEventListener("submit", (e) => {
            e.preventDefault();
            
            // Clear alerts
            hideAlert();
            if (emailError) emailError.style.display = "none";
            if (emailInput) emailInput.classList.remove("input-error");

            const email = emailInput.value.trim();

            if (!email) {
                if (emailInput) emailInput.classList.add("input-error");
                if (emailError) {
                    emailError.textContent = "Email is required.";
                    emailError.style.display = "block";
                }
                return;
            } else if (!validateEmail(email)) {
                if (emailInput) emailInput.classList.add("input-error");
                if (emailError) {
                    emailError.textContent = "Please enter a valid email address.";
                    emailError.style.display = "block";
                }
                return;
            }

            setLoading(true);

            setTimeout(() => {
                const token = "reset_" + Date.now();
                sessionStorage.setItem("reset_email", email);
                sessionStorage.setItem("reset_token", token);

                showAlert("success", `Password reset link generated! <br><a href="reset-password.html?token=${token}&email=${encodeURIComponent(email)}" style="color: #fff; font-weight: bold; text-decoration: underline; display: inline-block; margin-top: 6px;">Click here to Reset Your Password</a>`);
                forgotForm.reset();
                setLoading(false);
            }, 400);
        });
    }

    function validateEmail(email) {
        const re = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
        return re.test(email);
    }

    function showAlert(type, message) {
        if (!alertBox || !alertText) return;
        alertBox.className = `alert alert-${type}`;
        alertText.innerHTML = message;
        alertBox.style.display = "flex";
    }

    function hideAlert() {
        if (alertBox) alertBox.style.display = "none";
    }

    function setLoading(isLoading) {
        if (!btnForgot) return;
        const btnText = btnForgot.querySelector(".btn-text");
        const spinner = btnForgot.querySelector(".spinner");

        if (isLoading) {
            btnForgot.disabled = true;
            if (btnText) btnText.textContent = "Generating link...";
            if (spinner) spinner.style.display = "inline-block";
        } else {
            btnForgot.disabled = false;
            if (btnText) btnText.textContent = "Send Reset Link";
            if (spinner) spinner.style.display = "none";
        }
    }
});
