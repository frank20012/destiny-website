const mobileMenuBtn = document.querySelector(".mobile-menu-btn");
const mobileNav = document.querySelector(".mobile-nav");

if (mobileMenuBtn && mobileNav) {
  mobileMenuBtn.addEventListener("click", () => {
    mobileNav.classList.toggle("open");

    if (mobileNav.classList.contains("open")) {
      mobileMenuBtn.textContent = "✕";
    } else {
      mobileMenuBtn.textContent = "☰";
    }
  });

  mobileNav.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      mobileNav.classList.remove("open");
      mobileMenuBtn.textContent = "☰";
    });
  });
}