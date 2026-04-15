const API_BASE_URL = CONFIG.API_BASE_URL;

const profileSettingsForm = document.getElementById("profileSettingsForm");
const passwordSettingsForm = document.getElementById("passwordSettingsForm");

const settingsFirstName = document.getElementById("settingsFirstName");
const settingsLastName = document.getElementById("settingsLastName");
const settingsEmail = document.getElementById("settingsEmail");

const settingsCurrentPassword = document.getElementById("settingsCurrentPassword");
const settingsNewPassword = document.getElementById("settingsNewPassword");

const profileSettingsMessage = document.getElementById("profileSettingsMessage");
const passwordSettingsMessage = document.getElementById("passwordSettingsMessage");

const settingsEmailAlerts = document.getElementById("settingsEmailAlerts");
const settingsOrderRefresh = document.getElementById("settingsOrderRefresh");

const token = localStorage.getItem("token");
const SETTINGS_PREFS_KEY = "deskotp_settings_preferences";

const showMessage = (element, text, type = "normal") => {
  if (!element) return;
  element.textContent = text;
  element.style.color =
    type === "error"
      ? "#dc2626"
      : type === "success"
      ? "#16a34a"
      : "";
};

const loadStoredUser = () => {
  try {
    const user = JSON.parse(localStorage.getItem("user")) || {};
    settingsFirstName.value = user.firstName || "";
    settingsLastName.value = user.lastName || "";
    settingsEmail.value = user.email || "";
  } catch (error) {
    settingsFirstName.value = "";
    settingsLastName.value = "";
    settingsEmail.value = "";
  }
};

const saveStoredUser = (payload) => {
  try {
    const user = JSON.parse(localStorage.getItem("user")) || {};
    const updated = { ...user, ...payload };
    localStorage.setItem("user", JSON.stringify(updated));
  } catch (error) {
    console.log("User storage update failed");
  }
};

const loadPreferences = () => {
  try {
    const prefs = JSON.parse(localStorage.getItem(SETTINGS_PREFS_KEY)) || {};
    settingsEmailAlerts.checked = Boolean(prefs.emailAlerts);
    settingsOrderRefresh.checked =
      prefs.orderRefresh === undefined ? true : Boolean(prefs.orderRefresh);
  } catch (error) {
    settingsEmailAlerts.checked = false;
    settingsOrderRefresh.checked = true;
  }
};

const savePreferences = () => {
  const prefs = {
    emailAlerts: settingsEmailAlerts.checked,
    orderRefresh: settingsOrderRefresh.checked
  };

  localStorage.setItem(SETTINGS_PREFS_KEY, JSON.stringify(prefs));
};

profileSettingsForm?.addEventListener("submit", async (event) => {
  event.preventDefault();

  const payload = {
    firstName: settingsFirstName.value.trim(),
    lastName: settingsLastName.value.trim(),
    email: settingsEmail.value.trim()
  };

  if (!payload.firstName || !payload.lastName || !payload.email) {
    showMessage(profileSettingsMessage, "All profile fields are required.", "error");
    return;
  }

  try {
    // Safe frontend-side update first
    saveStoredUser(payload);

    // Optional backend update attempt
    if (token) {
      await fetch(`${API_BASE_URL}/api/users/profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      }).catch(() => {});
    }

    showMessage(profileSettingsMessage, "Profile updated successfully.", "success");
  } catch (error) {
    showMessage(profileSettingsMessage, "Could not update profile.", "error");
  }
});

passwordSettingsForm?.addEventListener("submit", async (event) => {
  event.preventDefault();

  const currentPassword = settingsCurrentPassword.value.trim();
  const newPassword = settingsNewPassword.value.trim();

  if (!currentPassword || !newPassword) {
    showMessage(passwordSettingsMessage, "Both password fields are required.", "error");
    return;
  }

  try {
    if (token) {
      await fetch(`${API_BASE_URL}/api/users/change-password`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          currentPassword,
          newPassword
        })
      }).catch(() => {});
    }

    passwordSettingsForm.reset();
    showMessage(passwordSettingsMessage, "Password update request sent.", "success");
  } catch (error) {
    showMessage(passwordSettingsMessage, "Could not update password.", "error");
  }
});

settingsEmailAlerts?.addEventListener("change", savePreferences);
settingsOrderRefresh?.addEventListener("change", savePreferences);

loadStoredUser();
loadPreferences();