import { saveAuth } from "./auth-storage.js";

const API_BASE_URL = CONFIG.API_BASE_URL;

const signupForm = document.getElementById("signupForm");
const signinForm = document.getElementById("signinForm");

const showMessage = (elementId, text, type = "error") => {
  const messageEl = document.getElementById(elementId);
  if (!messageEl) return;

  messageEl.textContent = text;
  messageEl.className = `form-message ${type}`;
};

const clearMessage = (elementId) => {
  const messageEl = document.getElementById(elementId);
  if (!messageEl) return;

  messageEl.textContent = "";
  messageEl.className = "form-message";
};

const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const isStrongPassword = (password) => {
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
  return passwordRegex.test(password);
};

if (signupForm) {
  signupForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    clearMessage("signupMessage");

    const firstName = document.getElementById("signupFirstName")?.value.trim();
    const lastName = document.getElementById("signupLastName")?.value.trim();
    const email = document.getElementById("signupEmail")?.value.trim();
    const password = document.getElementById("signupPassword")?.value.trim();
    const confirmPassword = document.getElementById("signupConfirmPassword")?.value.trim();

    if (!firstName || !lastName || !email || !password || !confirmPassword) {
      showMessage("signupMessage", "All fields are required.");
      return;
    }

    if (!isValidEmail(email)) {
      showMessage("signupMessage", "Enter a valid email address.");
      return;
    }

    if (!isStrongPassword(password)) {
      showMessage(
        "signupMessage",
        "Password must be at least 8 characters and include uppercase, lowercase, and a number."
      );
      return;
    }

    if (password !== confirmPassword) {
      showMessage("signupMessage", "Passwords do not match.");
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          firstName,
          lastName,
          email,
          password
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Registration failed");
      }

      saveAuth(data.token, data.user, true);

      showMessage("signupMessage", "Account created successfully.", "success");

      setTimeout(() => {
        window.location.href = "dashboard.html";
      }, 1000);
    } catch (error) {
      showMessage("signupMessage", error.message || "Something went wrong.");
    }
  });
}

if (signinForm) {
  signinForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    clearMessage("signinMessage");

    const email = document.getElementById("signinEmail")?.value.trim();
    const password = document.getElementById("signinPassword")?.value.trim();
    const rememberMe = document.getElementById("rememberMe")?.checked || false;

    if (!email || !password) {
      showMessage("signinMessage", "Email and password are required.");
      return;
    }

    if (!isValidEmail(email)) {
      showMessage("signinMessage", "Enter a valid email address.");
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          email,
          password
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Login failed");
      }

      saveAuth(data.token, data.user, rememberMe);

      showMessage("signinMessage", "Login successful.", "success");

      setTimeout(() => {
        if (data.user.role === "admin") {
          window.location.href = "admin.html";
        } else {
          window.location.href = "dashboard.html";
        }
      }, 700);
    } catch (error) {
      showMessage("signinMessage", error.message || "Something went wrong.");
    }
  });
}

const togglePasswordButtons = document.querySelectorAll(".toggle-password");

togglePasswordButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const targetInputId = button.getAttribute("data-target");
    const passwordInput = document.getElementById(targetInputId);

    if (!passwordInput) return;

    if (passwordInput.type === "password") {
      passwordInput.type = "text";
      button.textContent = "Hide";
    } else {
      passwordInput.type = "password";
      button.textContent = "Show";
    }
  });
});