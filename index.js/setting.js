const profileSettingsForm = document.getElementById("profileSettingsForm");
const securitySettingsForm = document.getElementById("securitySettingsForm");
const openDeleteAccountModalBtn = document.getElementById("openDeleteAccountModalBtn");
const confirmDeleteAccountBtn = document.getElementById("confirmDeleteAccountBtn");

if (profileSettingsForm) {
  profileSettingsForm.addEventListener("submit", (e) => {
    e.preventDefault();
    showToast("success", "Profile updated", "Your profile changes have been saved.");
  });
}

if (securitySettingsForm) {
  securitySettingsForm.addEventListener("submit", (e) => {
    e.preventDefault();
    showToast("success", "Security updated", "Your security settings have been saved.");
  });
}

if (openDeleteAccountModalBtn) {
  openDeleteAccountModalBtn.addEventListener("click", () => {
    openModal("deleteAccountModal");
  });
}

if (confirmDeleteAccountBtn) {
  confirmDeleteAccountBtn.addEventListener("click", () => {
    closeModal("deleteAccountModal");
    showToast("error", "Delete requested", "This demo does not actually delete the account.");
  });
}