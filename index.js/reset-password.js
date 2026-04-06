const API_BASE_URL = CONFIG.API_BASE_URL;

const resetPasswordForm = document.getElementById("resetPasswordForm");
const newPassword = document.getElementById("newPassword");
const confirmNewPassword = document.getElementById("confirmNewPassword");
const resetPasswordMessage = document.getElementById("resetPasswordMessage");
const resetSubmitBtn = resetPasswordForm?.querySelector('button[type="submit"]');

const showMessage = (text, type = "error") => {
  if (!resetPasswordMessage) return;
  resetPasswordMessage.textContent = text;
  resetPasswordMessage.className = `form-message ${type}`;
};

const setSubmittingState = (isSubmitting) => {
  if (!resetSubmitBtn) return;
  resetSubmitBtn.disabled = isSubmitting;
  resetSubmitBtn.textContent = isSubmitting ? "Resetting..." : "Reset Password";
};

const isStrongPassword = (password) => {
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
  return passwordRegex.test(password);
};

if (resetPasswordForm) {
  resetPasswordForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");

    const password = newPassword?.value.trim();
    const confirmPassword = confirmNewPassword?.value.trim();

    if (!token) {
      showMessage("Invalid or missing reset token.");
      return;
    }

    if (!password || !confirmPassword) {
      showMessage("All fields are required.");
      return;
    }

    if (password !== confirmPassword) {
      showMessage("Passwords do not match.");
      return;
    }

    if (!isStrongPassword(password)) {
      showMessage("Password must be at least 8 characters and include uppercase, lowercase, and a number.");
      return;
    }

    setSubmittingState(true);
    showMessage("", "error");

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/reset-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          token,
          password
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Password reset failed");
      }

      showMessage("Password reset successful. Redirecting to sign in...", "success");

      resetPasswordForm.reset();

      setTimeout(() => {
        window.location.href = "signin.html";
      }, 1500);
    } catch (error) {
      showMessage(error.message || "Something went wrong.");
    } finally {
      setSubmittingState(false);
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