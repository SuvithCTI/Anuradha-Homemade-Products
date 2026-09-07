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

    // Fetch user details from StorageService
    function loadUserProfile() {
        const user = window.StorageService ? window.StorageService.getCurrentUser() : null;

        if (user) {
            if (userDisplayName) userDisplayName.textContent = user.firstName || "Customer";
            if (profileFirst) profileFirst.value = user.firstName || "";
            if (profileLast) profileLast.value = user.lastName || "";
            if (profileEmail) profileEmail.value = user.email || "";
        } else {
            // If unauthorized, redirect to login page
            console.warn("Unauthenticated session, redirecting to login...");
            window.location.href = "../login.html";
        }
    }

    // Profile form submission (Edit Name)
    if (profileForm) {
        profileForm.addEventListener("submit", (e) => {
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

            setTimeout(() => {
                const res = window.StorageService ? window.StorageService.updateProfile(firstName, lastName) : { success: false, message: 'Storage unavailable' };

                if (res.success) {
                    if (userDisplayName) userDisplayName.textContent = res.user.firstName;
                    showAlert("success", "Name updated successfully!");
                } else {
                    showAlert("error", res.message || "Failed to update profile.");
                }
                setSaveLoading(false);
            }, 300);
        });
    }

    // Logout function
    if (btnLogout) {
        btnLogout.addEventListener("click", () => {
            setLogoutLoading(true);
            hideAlert();

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
