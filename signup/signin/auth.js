function togglePassword(inputId, button) {
  const input = document.getElementById(inputId);

  if (input.type === "password") {
    input.type = "text";
    button.textContent = "Hide";
  } else {
    input.type = "password";
    button.textContent = "Show";
  }
}

function setError(input, message) {
  const inputGroup = input.closest(".input-group");
  const errorText = inputGroup.querySelector(".error-text");

  input.classList.remove("input-success");
  input.classList.add("input-error");
  errorText.textContent = message;
}

function setSuccess(input) {
  const inputGroup = input.closest(".input-group");
  const errorText = inputGroup.querySelector(".error-text");

  input.classList.remove("input-error");
  input.classList.add("input-success");
  errorText.textContent = "";
}

function clearState(input) {
  const inputGroup = input.closest(".input-group");
  const errorText = inputGroup.querySelector(".error-text");

  input.classList.remove("input-error", "input-success");
  errorText.textContent = "";
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/* ---------------- SIGN UP VALIDATION ---------------- */
const signupForm = document.getElementById("signupForm");

if (signupForm) {
  signupForm.addEventListener("submit", function (e) {
    e.preventDefault();

    const fullName = document.getElementById("fullname");
    const email = document.getElementById("email");
    const password = document.getElementById("password");
    const confirmPassword = document.getElementById("confirmPassword");
    const terms = document.getElementById("terms");
    const message = document.getElementById("signupMessage");

    let isFormValid = true;
    message.textContent = "";
    message.className = "form-message";

    if (fullName.value.trim() === "") {
      setError(fullName, "Full name is required");
      isFormValid = false;
    } else if (fullName.value.trim().length < 3) {
      setError(fullName, "Full name must be at least 3 characters");
      isFormValid = false;
    } else {
      setSuccess(fullName);
    }

    if (email.value.trim() === "") {
      setError(email, "Email is required");
      isFormValid = false;
    } else if (!isValidEmail(email.value.trim())) {
      setError(email, "Enter a valid email address");
      isFormValid = false;
    } else {
      setSuccess(email);
    }

    if (password.value.trim() === "") {
      setError(password, "Password is required");
      isFormValid = false;
    } else if (password.value.length < 6) {
      setError(password, "Password must be at least 6 characters");
      isFormValid = false;
    } else {
      setSuccess(password);
    }

    if (confirmPassword.value.trim() === "") {
      setError(confirmPassword, "Please confirm your password");
      isFormValid = false;
    } else if (confirmPassword.value !== password.value) {
      setError(confirmPassword, "Passwords do not match");
      isFormValid = false;
    } else {
      setSuccess(confirmPassword);
    }

    if (!terms.checked) {
      message.textContent = "You must agree to the Terms & Conditions";
      message.classList.add("error");
      isFormValid = false;
    }

    if (isFormValid) {
      message.textContent = "Sign up successful";
      message.classList.add("success");

      // Example redirect later:
      // window.location.href = "signin.html";
    }
  });
}

/* ---------------- SIGN IN VALIDATION ---------------- */
const signinForm = document.getElementById("signinForm");

if (signinForm) {
  signinForm.addEventListener("submit", function (e) {
    e.preventDefault();

    const email = document.getElementById("email");
    const password = document.getElementById("password");
    const message = document.getElementById("signinMessage");

    let isFormValid = true;
    message.textContent = "";
    message.className = "form-message";

    if (email.value.trim() === "") {
      setError(email, "Email is required");
      isFormValid = false;
    } else if (!isValidEmail(email.value.trim())) {
      setError(email, "Enter a valid email address");
      isFormValid = false;
    } else {
      setSuccess(email);
    }

    if (password.value.trim() === "") {
      setError(password, "Password is required");
      isFormValid = false;
    } else if (password.value.length < 6) {
      setError(password, "Password must be at least 6 characters");
      isFormValid = false;
    } else {
      setSuccess(password);
    }

    if (isFormValid) {
      message.textContent = "Sign in successful";
      message.classList.add("success");

      // Example redirect later:
      // window.location.href = "dashboard.html";
    }
  });
}

/* ---------------- LIVE CLEARING ---------------- */
document.querySelectorAll("input").forEach((input) => {
  input.addEventListener("input", () => {
    clearState(input);
  });
});