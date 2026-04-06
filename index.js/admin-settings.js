const API_BASE_URL = "http://localhost:5000";
import { getStoredToken, getStoredUser } from "./auth-storage.js";


const token = getStoredToken();
const user = getStoredUser();

const adminProfileForm = document.getElementById("adminProfileForm");
const adminPlatformSettingsForm = document.getElementById("adminPlatformSettingsForm");

const adminSettingsFirstName = document.getElementById("adminSettingsFirstName");
const adminSettingsLastName = document.getElementById("adminSettingsLastName");
const adminSettingsEmail = document.getElementById("adminSettingsEmail");
const adminSettingsMessage = document.getElementById("adminSettingsMessage");

const adminSummaryRole = document.getElementById("adminSummaryRole");
const adminSummaryStatus = document.getElementById("adminSummaryStatus");
const adminSummaryEmail = document.getElementById("adminSummaryEmail");

const adminRestartSystemBtn = document.getElementById("adminRestartSystemBtn");
const adminDisablePublicBtn = document.getElementById("adminDisablePublicBtn");

const showMessage = (text, type = "error") => {
  if (!adminSettingsMessage) return;
  adminSettingsMessage.textContent = text;
  adminSettingsMessage.className = `form-message ${type}`;
};

const clearMessage = () => {
  if (!adminSettingsMessage) return;
  adminSettingsMessage.textContent = "";
  adminSettingsMessage.className = "form-message";
};

const loadAdminProfile = async () => {
  if (!token) {
    window.location.href = "signin.html";
    return;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/api/users/me`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Failed to load admin profile");
    }

    const user = data.user;

    if (adminSettingsFirstName) adminSettingsFirstName.value = user.firstName || "";
    if (adminSettingsLastName) adminSettingsLastName.value = user.lastName || "";
    if (adminSettingsEmail) adminSettingsEmail.value = user.email || "";

    if (adminSummaryRole) adminSummaryRole.textContent = user.role || "admin";
    if (adminSummaryStatus) adminSummaryStatus.textContent = user.isActive ? "active" : "inactive";
    if (adminSummaryEmail) adminSummaryEmail.textContent = user.email || "-";
  } catch (error) {
    showMessage(error.message || "Could not load admin profile.");
  }
};

if (adminProfileForm) {
  adminProfileForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    clearMessage();

    const firstName = adminSettingsFirstName?.value.trim();
    const lastName = adminSettingsLastName?.value.trim();
    const email = adminSettingsEmail?.value.trim();

    if (!firstName || !lastName || !email) {
      showMessage("All profile fields are required.");
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/users/me`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          firstName,
          lastName,
          email
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to update admin profile");
      }

      localStorage.setItem("user", JSON.stringify(data.user));

      if (adminSummaryEmail) adminSummaryEmail.textContent = data.user.email || "-";

      showMessage("Admin profile updated successfully.", "success");

      if (typeof showToast === "function") {
        showToast("success", "Profile updated", "Admin profile updated successfully.");
      }
    } catch (error) {
      showMessage(error.message || "Something went wrong.");
    }
  });
}

if (adminPlatformSettingsForm) {
  adminPlatformSettingsForm.addEventListener("submit", (e) => {
    e.preventDefault();

    if (typeof showToast === "function") {
      showToast("success", "Settings saved", "Platform settings UI saved for now.");
    }
  });
}

adminRestartSystemBtn?.addEventListener("click", () => {
  if (typeof showToast === "function") {
    showToast("info", "Restart requested", "System restart is a placeholder action for now.");
  }
});

adminDisablePublicBtn?.addEventListener("click", () => {
  if (typeof showToast === "function") {
    showToast("error", "Action blocked", "Public access control is not connected yet.");
  }
});

loadAdminProfile();