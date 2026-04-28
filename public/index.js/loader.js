window.addEventListener("load", () => {
  const loader = document.querySelector(".loader-wrapper");
  if (!loader) return;

  setTimeout(() => {
    loader.classList.add("hidden");
  }, 500);
});