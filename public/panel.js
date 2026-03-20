const body = document.body;
const sidebar = document.querySelector(".sidebar");
const overlay = document.querySelector(".sidebar-overlay");
const menuBtn = document.querySelector(".mobile-menu-btn");
const themeBtn = document.querySelector(".theme-toggle-btn");

function openSidebar() {
  if (sidebar) sidebar.classList.add("open");
  if (overlay) overlay.classList.add("show");
}

function closeSidebar() {
  if (sidebar) sidebar.classList.remove("open");
  if (overlay) overlay.classList.remove("show");
}

if (menuBtn) {
  menuBtn.addEventListener("click", openSidebar);
}

if (overlay) {
  overlay.addEventListener("click", closeSidebar);
}

document.querySelectorAll(".sidebar-nav a").forEach((link) => {
  link.addEventListener("click", () => {
    if (window.innerWidth <= 800) closeSidebar();
  });
});

function applyTheme(theme) {
  if (theme === "dark") {
    body.classList.add("dark-mode");
    if (themeBtn) themeBtn.textContent = "☀️";
  } else {
    body.classList.remove("dark-mode");
    if (themeBtn) themeBtn.textContent = "🌙";
  }
}

const savedTheme = localStorage.getItem("theme") || "light";
applyTheme(savedTheme);

if (themeBtn) {
  themeBtn.addEventListener("click", () => {
    const isDark = body.classList.contains("dark-mode");
    const newTheme = isDark ? "light" : "dark";
    localStorage.setItem("theme", newTheme);
    applyTheme(newTheme);
  });
}