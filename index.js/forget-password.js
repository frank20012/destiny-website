const API_BASE_URL = CONFIG.API_BASE_URL;

const forgotPasswordForm = document.getElementById("forgotPasswordForm");
const forgotEmail = document.getElementById("forgotEmail");
const forgotPasswordMessage = document.getElementById("forgotPasswordMessage");
const forgotSubmitBtn = forgotPasswordForm?.querySelector('button[type="submit"]');

const showMessage = (text, type = "error") => {
  if (!forgotPasswordMessage) return;
  forgotPasswordMessage.textContent = text;
  forgotPasswordMessage.className = `form-message ${type}`;
};

const setSubmittingState = (isSubmitting) => {
  if (!forgotSubmitBtn) return;
  forgotSubmitBtn.disabled = isSubmitting;
  forgotSubmitBtn.textContent = isSubmitting ? "Sending..." : "Send Reset Link";
};

const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

if (forgotPasswordForm) {
  forgotPasswordForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = forgotEmail?.value.trim();

    if (!email) {
      showMessage("Email is required.");
      return;
    }

    if (!isValidEmail(email)) {
      showMessage("Enter a valid email address.");
      return;
    }

    setSubmittingState(true);
    showMessage("", "error");

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/forgot-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ email })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to send reset link");
      }

      showMessage(
        "Reset link generated successfully. Please check the backend console for now.",
        "success"
      );

      forgotPasswordForm.reset();
    } catch (error) {
      showMessage(error.message || "Something went wrong.");
    } finally {
      setSubmittingState(false);
    }
  });
}