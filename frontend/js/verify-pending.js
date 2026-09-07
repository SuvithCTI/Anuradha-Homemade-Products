/**
 * Verify Pending Script - Standalone Client
 * Anuradha Homemade Organic Products
 */

document.addEventListener("DOMContentLoaded", () => {
    const emailDisplay = document.getElementById("registered-email");
    const statusMessage = document.getElementById("status-message");
    const btnResend = document.getElementById("btn-resend");
    const alertBox = document.getElementById("alert-box");
    const alertText = document.getElementById("alert-text");
    const btnInstantVerify = document.getElementById("btn-instant-verify");

    // Fetch the pending registration email from session storage
    const email = sessionStorage.getItem("pendingEmail") || "customer@example.com";
    if (emailDisplay) emailDisplay.textContent = email;

    // Instant verify click handler
    if (btnInstantVerify) {
        btnInstantVerify.addEventListener("click", () => {
            setInstantLoading(true);
            hideAlert();

            setTimeout(() => {
                if (statusMessage) {
                    statusMessage.textContent = "Account activated successfully! Redirecting...";
                    statusMessage.style.color = "var(--primary-color)";
                }
                showAlert("success", "Your account has been activated! Redirecting to Sign In...");
                setTimeout(() => {
                    window.location.href = "login.html?verified=true";
                }, 1000);
            }, 500);
        });
    }

    // Resend verification email click handler
    if (btnResend) {
        btnResend.addEventListener("click", () => {
            setLoading(true);
            hideAlert();

            setTimeout(() => {
                showAlert("success", "A new verification link has been sent to your email!");
                setLoading(false);
            }, 500);
        });
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
        if (!btnResend) return;
        const btnText = btnResend.querySelector(".btn-text");
        const spinner = btnResend.querySelector(".spinner");

        if (isLoading) {
            btnResend.disabled = true;
            if (btnText) btnText.textContent = "Resending link...";
            if (spinner) spinner.style.display = "inline-block";
        } else {
            btnResend.disabled = false;
            if (btnText) btnText.textContent = "Resend Verification Email";
            if (spinner) spinner.style.display = "none";
        }
    }

    function setInstantLoading(isLoading) {
        if (!btnInstantVerify) return;
        const btnText = btnInstantVerify.querySelector(".btn-text");
        const spinner = btnInstantVerify.querySelector(".spinner");

        if (isLoading) {
            btnInstantVerify.disabled = true;
            if (btnText) btnText.textContent = "Activating...";
            if (spinner) spinner.style.display = "inline-block";
        } else {
            btnInstantVerify.disabled = false;
            if (btnText) btnText.textContent = "Activate Account Now";
            if (spinner) spinner.style.display = "none";
        }
    }
});
