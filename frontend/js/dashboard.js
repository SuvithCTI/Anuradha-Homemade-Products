const backendUrl = (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1")
    ? (window.location.port === "8080" ? "" : "http://localhost:8080")
    : "https://anuradha-homemade-products.onrender.com";

document.addEventListener("DOMContentLoaded", () => {
    const userDisplayName = document.getElementById("user-display-name");
    const profileId = document.getElementById("profile-id");
    const profileFirst = document.getElementById("profile-first");
    const profileLast = document.getElementById("profile-last");
    const profileEmail = document.getElementById("profile-email");
    const profileRole = document.getElementById("profile-role");
    const profileVerified = document.getElementById("profile-verified");

    const btnLogout = document.getElementById("btn-logout");
    const alertBox = document.getElementById("alert-box");
    const alertText = document.getElementById("alert-text");

    // Fetch user details on page load to verify the active session
    async function loadUserProfile() {
        try {
            const response = await fetch(`${backendUrl}/api/auth/me`, {
                method: "GET",
                headers: {
                    "Accept": "application/json"
                },
                credentials: "include" // Send HttpOnly cookie
            });

            if (response.ok) {
                const data = await response.json();
                const user = data.user;

                // Populate UI
                userDisplayName.textContent = user.firstName;
                profileId.textContent = user.id;
                profileFirst.textContent = user.firstName;
                profileLast.textContent = user.lastName;
                profileEmail.textContent = user.email;
                profileRole.textContent = user.role;
                profileVerified.textContent = user.emailVerified ? "Yes (Verified)" : "No";
            } else {
                // If unauthorized, redirect to login page
                console.warn("Unauthorized access, redirecting to login...");
                window.location.href = "../login.html";
            }
        } catch (error) {
            console.error("Failed to load user profile", error);
            showAlert("error", "Failed to connect to the backend authentication server.");
            setTimeout(() => {
                window.location.href = "../login.html";
            }, 3000);
        }
    }

    // Logout function
    btnLogout.addEventListener("click", async () => {
        setLoading(true);
        hideAlert();

        try {
            const response = await fetch(`${backendUrl}/api/auth/logout`, {
                method: "POST",
                headers: {
                    "Accept": "application/json"
                },
                credentials: "include"
            });

            if (response.ok) {
                showAlert("success", "Logged out successfully. Redirecting...");
                setTimeout(() => {
                    window.location.href = "../index.html";
                }, 1000);
            } else {
                showAlert("error", "Logout failed. Please try again.");
                setLoading(false);
            }
        } catch (error) {
            console.error("Logout request failed", error);
            showAlert("error", "Network error. Failed to log out.");
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
        const btnText = btnLogout.querySelector(".btn-text");
        const spinner = btnLogout.querySelector(".spinner");

        if (isLoading) {
            btnLogout.disabled = true;
            btnText.textContent = "Signing out...";
            spinner.style.display = "inline-block";
        } else {
            btnLogout.disabled = false;
            btnText.textContent = "Sign Out";
            spinner.style.display = "none";
        }
    }

    // Initialize profile loading
    loadUserProfile();
});
