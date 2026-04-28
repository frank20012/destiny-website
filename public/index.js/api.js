const copyBtn = document.getElementById("copyApiKeyBtn");
const openGenerateKeyModalBtn = document.getElementById("openGenerateKeyModalBtn");
const confirmGenerateKeyBtn = document.getElementById("confirmGenerateKeyBtn");

if (copyBtn) {
  copyBtn.addEventListener("click", async () => {
    const code = document.querySelector(".key-box code");
    if (!code) return;

    try {
      await navigator.clipboard.writeText(code.textContent.trim());
      showToast("success", "Copied", "API key copied to clipboard.");
    } catch {
      showToast("error", "Copy failed", "Could not copy the API key.");
    }
  });
}

if (openGenerateKeyModalBtn) {
  openGenerateKeyModalBtn.addEventListener("click", () => {
    openModal("generateKeyModal");
  });
}

if (confirmGenerateKeyBtn) {
  confirmGenerateKeyBtn.addEventListener("click", () => {
    closeModal("generateKeyModal");
    showToast("success", "API key generated", "A new API key has been created.");
  });
}