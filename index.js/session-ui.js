import { getStoredUser, clearAuth } from "./auth-storage.js";

const storedUser = getStoredUser();

document.addEventListener("DOMContentLoaded", () => {
  if (storedUser) {
    const firstName = storedUser.firstName || "User";
    const fullName =
      `${storedUser.firstName || ""} ${storedUser.lastName || ""}`.trim() || "User";
    const initial = firstName.charAt(0).toUpperCase();

    const profileNameEls = document.querySelectorAll(".profile-box span");
    const avatarEls = document.querySelectorAll(".avatar");
    const welcomeText = document.querySelector(".topbar p");

    profileNameEls.forEach((el) => {
      el.textContent = fullName;
    });

    avatarEls.forEach((el) => {
      el.textContent = initial;
    });

    if (welcomeText && welcomeText.textContent.toLowerCase().includes("welcome")) {
      welcomeText.textContent = `Welcome back, ${firstName}`;
    }
  }

  const logoutLinks = document.querySelectorAll('a[href="signin.html"]');

  logoutLinks.forEach((link) => {
    link.addEventListener("click", (e) => {
      e.preventDefault();
      clearAuth();
      window.location.href = "signin.html";
    });
  });
});