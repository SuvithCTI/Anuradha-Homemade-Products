const backendUrl = (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1")
    ? (window.location.port === "8080" ? "" : "http://localhost:8080")
    : "https://anuradha-homemade-products.onrender.com";

document.addEventListener("DOMContentLoaded", () => {
    const userDisplayName = document.getElementById("user-display-name");
    const profileFirst = document.getElementById("profile-first");
    const profileLast = document.getElementById("profile-last");
    const profileEmail = document.getElementById("profile-email");
    const firstNameError = document.getElementById("first-name-error");

    const profileForm = document.getElementById("profile-form");
    const btnSaveProfile = document.getElementById("btn-save-profile");
    const btnLogout = document.getElementById("btn-logout");
    const alertBox = document.getElementById("alert-box");
    const alertText = document.getElementById("alert-text");

    // Check for token in URL query parameter (from Google OAuth or redirect)
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has("token")) {
        localStorage.setItem("auth_token", urlParams.get("token"));
        // Clean URL without reloading
        window.history.replaceState({}, document.title, window.location.pathname);
    }

    // Fetch user details on page load to verify the active session
    async function loadUserProfile() {
        const token = localStorage.getItem("auth_token");
        const headers = {
            "Accept": "application/json"
        };
        if (token) {
            headers["Authorization"] = `Bearer ${token}`;
        }

        try {
            const response = await fetch(`${backendUrl}/api/auth/me`, {
                method: "GET",
                headers: headers,
                credentials: "include" // Send HttpOnly cookie
            });

            if (response.ok) {
                const data = await response.json();
                const user = data.user;
                if (user) {
                    localStorage.setItem("currentUser", JSON.stringify(user));
                    // Populate UI
                    userDisplayName.textContent = user.firstName || "Customer";
                    if (profileFirst) profileFirst.value = user.firstName || "";
                    if (profileLast) profileLast.value = user.lastName || "";
                    if (profileEmail) profileEmail.value = user.email || "";
                }
            } else {
                // If unauthorized, clear tokens and redirect to login page
                console.warn("Unauthorized access, redirecting to login...");
                localStorage.removeItem("auth_token");
                localStorage.removeItem("currentUser");
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

    // Profile form submission (Edit Name)
    if (profileForm) {
        profileForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            hideAlert();
            if (firstNameError) firstNameError.style.display = "none";
            if (profileFirst) profileFirst.classList.remove("input-error");

            const firstName = profileFirst ? profileFirst.value.trim() : "";
            const lastName = profileLast ? profileLast.value.trim() : "";

            if (!firstName) {
                if (firstNameError) {
                    firstNameError.textContent = "First name is required.";
                    firstNameError.style.display = "block";
                }
                if (profileFirst) profileFirst.classList.add("input-error");
                return;
            }

            setSaveLoading(true);

            const token = localStorage.getItem("auth_token");
            const headers = {
                "Content-Type": "application/json",
                "Accept": "application/json"
            };
            if (token) {
                headers["Authorization"] = `Bearer ${token}`;
            }

            try {
                const response = await fetch(`${backendUrl}/api/auth/profile`, {
                    method: "PUT",
                    headers: headers,
                    credentials: "include",
                    body: JSON.stringify({ firstName, lastName })
                });

                const data = await response.json();

                if (response.ok) {
                    const user = data.user;
                    if (user) {
                        localStorage.setItem("currentUser", JSON.stringify(user));
                        userDisplayName.textContent = user.firstName;
                    }
                    showAlert("success", "Name updated successfully!");
                } else {
                    showAlert("error", data.message || "Failed to update profile.");
                }
            } catch (error) {
                console.error("Profile update error:", error);
                showAlert("error", "Network error. Failed to save changes.");
            } finally {
                setSaveLoading(false);
            }
        });
    }

    // Logout function
    btnLogout.addEventListener("click", async () => {
        setLogoutLoading(true);
        hideAlert();

        const token = localStorage.getItem("auth_token");
        const headers = {
            "Accept": "application/json"
        };
        if (token) {
            headers["Authorization"] = `Bearer ${token}`;
        }

        try {
            await fetch(`${backendUrl}/api/auth/logout`, {
                method: "POST",
                headers: headers,
                credentials: "include"
            });
        } catch (error) {
            console.warn("Logout request error", error);
        } finally {
            localStorage.removeItem("auth_token");
            localStorage.removeItem("currentUser");
            showAlert("success", "Logged out successfully. Redirecting...");
            setTimeout(() => {
                window.location.href = "../index.html";
            }, 1000);
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

    function setSaveLoading(isLoading) {
        if (!btnSaveProfile) return;
        const btnText = btnSaveProfile.querySelector(".btn-text");
        const spinner = btnSaveProfile.querySelector(".spinner");

        if (isLoading) {
            btnSaveProfile.disabled = true;
            btnText.textContent = "Saving...";
            if (spinner) spinner.style.display = "inline-block";
        } else {
            btnSaveProfile.disabled = false;
            btnText.textContent = "Save Changes";
            if (spinner) spinner.style.display = "none";
        }
    }

    function setLogoutLoading(isLoading) {
        const btnText = btnLogout.querySelector(".btn-text");
        const spinner = btnLogout.querySelector(".spinner");

        if (isLoading) {
            btnLogout.disabled = true;
            btnText.textContent = "Signing out...";
            if (spinner) spinner.style.display = "inline-block";
        } else {
            btnLogout.disabled = false;
            btnText.textContent = "Sign Out";
            if (spinner) spinner.style.display = "none";
        }
    }

    // Initialize profile loading
    loadUserProfile();
});
