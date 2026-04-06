const API_BASE_URL = CONFIG.API_BASE_URL;
const token = localStorage.getItem("token");

const profileSettingsForm = document.getElementById("profileSettingsForm");
const securitySettingsForm = document.getElementById("securitySettingsForm");
const openDeleteAccountModalBtn = document.getElementById("openDeleteAccountModalBtn");
const confirmDeleteAccountBtn = document.getElementById("confirmDeleteAccountBtn");

const settingsFirstName = document.getElementById("settingsFirstName");
const settingsLastName = document.getElementById("settingsLastName");
const settingsEmail = document.getElementById("settingsEmail");
const settingsProfileMessage = document.getElementById("settingsProfileMessage");

const showProfileMessage = (text, type = "error") => {
  if (!settingsProfileMessage) return;
  settingsProfileMessage.textContent = text;
  settingsProfileMessage.className = `form-message ${type}`;
};

const clearProfileMessage = () => {
  if (!settingsProfileMessage) return;
  settingsProfileMessage.textContent = "";
  settingsProfileMessage.className = "form-message";
};

const loadProfile = async () => {
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
      throw new Error(data.message || "Failed to load profile");
    }

    if (settingsFirstName) settingsFirstName.value = data.user.firstName || "";
    if (settingsLastName) settingsLastName.value = data.user.lastName || "";
    if (settingsEmail) settingsEmail.value = data.user.email || "";
  } catch (error) {
    showProfileMessage(error.message || "Could not load profile.");
  }
};

if (profileSettingsForm) {
  profileSettingsForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    clearProfileMessage();

    const firstName = settingsFirstName?.value.trim();
    const lastName = settingsLastName?.value.trim();
    const email = settingsEmail?.value.trim();

    if (!firstName || !lastName || !email) {
      showProfileMessage("All profile fields are required.");
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
        throw new Error(data.message || "Failed to update profile");
      }

      localStorage.setItem("user", JSON.stringify(data.user));

      showProfileMessage("Profile updated successfully.", "success");

      if (typeof showToast === "function") {
        showToast("success", "Profile updated", "Your profile was updated successfully.");
      }
    } catch (error) {
      showProfileMessage(error.message || "Something went wrong.");
    }
  });
}

if (securitySettingsForm) {
  securitySettingsForm.addEventListener("submit", (e) => {
    e.preventDefault();

    if (typeof showToast === "function") {
      showToast("success", "Security saved", "Security settings UI saved for now.");
    }
  });
}

if (openDeleteAccountModalBtn) {
  openDeleteAccountModalBtn.addEventListener("click", () => {
    if (typeof openModal === "function") {
      openModal("deleteAccountModal");
    }
  });
}

if (confirmDeleteAccountBtn) {
  confirmDeleteAccountBtn.addEventListener("click", () => {
    if (typeof closeModal === "function") {
      closeModal("deleteAccountModal");
    }

    if (typeof showToast === "function") {
      showToast("error", "Delete requested", "This demo does not actually delete the account.");
    }
  });
}

loadProfile();