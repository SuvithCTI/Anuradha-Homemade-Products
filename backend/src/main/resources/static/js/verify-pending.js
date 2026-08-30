const backendUrl = (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1")
    ? (window.location.port === "8080" ? "" : "http://localhost:8080")
    : "https://anuradha-homemade-products.onrender.com";

document.addEventListener("DOMContentLoaded", () => {
    const emailDisplay = document.getElementById("registered-email");
    const statusMessage = document.getElementById("status-message");
    const btnResend = document.getElementById("btn-resend");
    const alertBox = document.getElementById("alert-box");
    const alertText = document.getElementById("alert-text");

    // Fetch the pending registration email from session storage
    const email = sessionStorage.getItem("pendingEmail");

    if (!email) {
        // If no email is in session storage, go back to signup
        window.location.href = "signup.html";
        return;
    }

    emailDisplay.textContent = email;

    // Polling function to check verification status on server
    async function checkVerificationStatus() {
        try {
            const response = await fetch(`${backendUrl}/api/auth/check-verification?email=${encodeURIComponent(email)}`, {
                method: "GET",
                headers: {
                    "Accept": "application/json"
                }
            });

            if (response.ok) {
                const data = await response.json();
                
                if (data.verified) {
                    // Stop polling
                    clearInterval(pollingInterval);
                    
                    // Show success status
                    statusMessage.textContent = "Email confirmed! Redirecting to Home Page...";
                    statusMessage.style.color = "var(--primary-color)";
                    showAlert("success", "Email verified successfully! Welcome to Anuradha Homemade Organics.");
                    
                    // Redirect to home page after 1.5 seconds
                    setTimeout(() => {
                        window.location.href = "index.html?verified=true";
                    }, 1500);
                }
            }
        } catch (error) {
            console.error("Error polling verification status:", error);
        }
    }

    // Poll the status every 3 seconds (3000 milliseconds)
    const pollingInterval = setInterval(checkVerificationStatus, 3000);

    // Resend verification email click handler
    btnResend.addEventListener("click", async () => {
        setLoading(true);
        hideAlert();

        try {
            const response = await fetch(`${backendUrl}/api/auth/resend-verification`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Accept": "application/json"
                },
                body: JSON.stringify({ email })
            });

            const data = await response.json();

            if (response.ok) {
                showAlert("success", data.message || "A new verification link has been sent!");
            } else {
                showAlert("error", data.message || "Failed to resend verification email.");
            }
        } catch (error) {
            console.error("Resend error:", error);
            showAlert("error", "Network connection failed. Please try again.");
        } finally {
            setLoading(false);
        }
    });

    function showAlert(type, message) {
        alertBox.className = `alert alert-${type}`;
        alertText.textContent = message;
        alertBox.style.display = "flex";
    }

    function hideAlert() {
        alertBox.style.display = "none";
    }

    function setLoading(isLoading) {
        const btnText = btnResend.querySelector(".btn-text");
        const spinner = btnResend.querySelector(".spinner");

        if (isLoading) {
            btnResend.disabled = true;
            btnText.textContent = "Resending link...";
            spinner.style.display = "inline-block";
        } else {
            btnResend.disabled = false;
            btnText.textContent = "Resend Verification Email";
            spinner.style.display = "none";
        }
    }
});
