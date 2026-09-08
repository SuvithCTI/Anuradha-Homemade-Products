/**
 * Customer Dashboard Script - Standalone Frontend
 * Anuradha Homemade Organic Products
 */

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

    const profilePhone = document.getElementById("profile-phone");

    const API_BASE = (window.location.port === '5000' || (window.location.protocol === 'https:' && !window.location.port))
        ? window.location.origin
        : (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' ? 'http://localhost:5000' : window.location.origin);
    const authToken = localStorage.getItem('auth_token');

    // Fetch user details from API / StorageService
    async function loadUserProfile() {
        let user = null;

        if (authToken) {
            try {
                const res = await fetch(`${API_BASE}/api/auth/me`, {
                    headers: { 'Authorization': 'Bearer ' + authToken }
                });
                const data = await res.json();
                if (data.success && data.user) {
                    user = data.user;
                    localStorage.setItem('anuradha_current_user', JSON.stringify(user));
                }
            } catch (err) {
                console.warn('API profile fetch error:', err);
            }
        }

        if (!user) {
            user = window.StorageService ? window.StorageService.getCurrentUser() : null;
            if (!user) {
                try {
                    const stored = localStorage.getItem('anuradha_current_user');
                    if (stored) user = JSON.parse(stored);
                } catch (e) {}
            }
        }

        if (user) {
            if (userDisplayName) userDisplayName.textContent = user.firstName || "Customer";
            if (profileFirst) profileFirst.value = user.firstName || "";
            if (profileLast) profileLast.value = user.lastName || "";
            if (profilePhone) profilePhone.value = user.phone || "";
            if (profileEmail) profileEmail.value = user.email || "";
        } else {
            console.warn("Unauthenticated session, redirecting to login...");
            window.location.href = "../login.html";
        }
    }

    // Profile form submission (Edit Name & Phone)
    if (profileForm) {
        profileForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            hideAlert();
            if (firstNameError) firstNameError.style.display = "none";
            if (profileFirst) profileFirst.classList.remove("input-error");

            const firstName = profileFirst ? profileFirst.value.trim() : "";
            const lastName = profileLast ? profileLast.value.trim() : "";
            const phone = profilePhone ? profilePhone.value.trim() : "";

            if (!firstName) {
                if (firstNameError) {
                    firstNameError.textContent = "First name is required.";
                    firstNameError.style.display = "block";
                }
                if (profileFirst) profileFirst.classList.add("input-error");
                return;
            }

            setSaveLoading(true);

            if (authToken) {
                try {
                    const res = await fetch(`${API_BASE}/api/auth/profile`, {
                        method: 'PUT',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': 'Bearer ' + authToken
                        },
                        body: JSON.stringify({ firstName, lastName, phone })
                    });
                    const data = await res.json();
                    if (data.success && data.user) {
                        localStorage.setItem('anuradha_current_user', JSON.stringify(data.user));
                        if (window.StorageService) window.StorageService.updateProfile(firstName, lastName);
                        if (userDisplayName) userDisplayName.textContent = data.user.firstName;
                        showAlert("success", "Profile updated successfully!");
                        setSaveLoading(false);
                        return;
                    }
                } catch (err) {
                    console.warn('API update failed, trying local storage:', err);
                }
            }

            const res = window.StorageService ? window.StorageService.updateProfile(firstName, lastName) : { success: false, message: 'Storage unavailable' };
            if (res.success) {
                if (userDisplayName) userDisplayName.textContent = res.user.firstName;
                showAlert("success", "Profile updated successfully!");
            } else {
                showAlert("error", res.message || "Failed to update profile.");
            }
            setSaveLoading(false);
        });
    }

    // Logout function
    if (btnLogout) {
        btnLogout.addEventListener("click", () => {
            setLogoutLoading(true);
            hideAlert();

            localStorage.removeItem('auth_token');
            localStorage.removeItem('anuradha_current_user');
            if (window.StorageService) {
                window.StorageService.logout();
            }

            showAlert("success", "Logged out successfully. Redirecting...");
            setTimeout(() => {
                window.location.href = "../index.html";
            }, 600);
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

    function setSaveLoading(isLoading) {
        if (!btnSaveProfile) return;
        const btnText = btnSaveProfile.querySelector(".btn-text");
        const spinner = btnSaveProfile.querySelector(".spinner");

        if (isLoading) {
            btnSaveProfile.disabled = true;
            if (btnText) btnText.textContent = "Saving...";
            if (spinner) spinner.style.display = "inline-block";
        } else {
            btnSaveProfile.disabled = false;
            if (btnText) btnText.textContent = "Save Changes";
            if (spinner) spinner.style.display = "none";
        }
    }

    function setLogoutLoading(isLoading) {
        if (!btnLogout) return;
        const btnText = btnLogout.querySelector(".btn-text");
        const spinner = btnLogout.querySelector(".spinner");

        if (isLoading) {
            btnLogout.disabled = true;
            if (btnText) btnText.textContent = "Signing out...";
            if (spinner) spinner.style.display = "inline-block";
        } else {
            btnLogout.disabled = false;
            if (btnText) btnText.textContent = "Sign Out";
            if (spinner) spinner.style.display = "none";
        }
    }

    // Initialize profile loading
    loadUserProfile();
});
