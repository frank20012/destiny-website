const adminBrandingForm = document.getElementById("adminBrandingForm");
const adminSecurityForm = document.getElementById("adminSecurityForm");
const saveAdminSettingsBtn = document.getElementById("saveAdminSettingsBtn");
const restartSystemBtn = document.getElementById("restartSystemBtn");
const shutdownPublicAccessBtn = document.getElementById("shutdownPublicAccessBtn");

adminBrandingForm?.addEventListener("submit", (e) => {
  e.preventDefault();
  showToast("success", "Branding saved", "Platform branding settings updated.");
});

adminSecurityForm?.addEventListener("submit", (e) => {
  e.preventDefault();
  showToast("success", "Security saved", "Admin security settings updated.");
});

saveAdminSettingsBtn?.addEventListener("click", () => {
  showToast("success", "All settings saved", "Platform settings have been saved.");
});

restartSystemBtn?.addEventListener("click", () => {
  showToast("info", "Restart requested", "System restart simulation started.");
});

shutdownPublicAccessBtn?.addEventListener("click", () => {
  showToast("error", "Public access disabled", "This is a demo action only.");
});