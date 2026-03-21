const walletFundForm = document.getElementById("walletFundForm");
const openFundModalBtn = document.getElementById("openFundModalBtn");
const confirmFundModalBtn = document.getElementById("confirmFundModalBtn");

if (openFundModalBtn) {
  openFundModalBtn.addEventListener("click", () => {
    openModal("fundWalletModal");
  });
}

if (confirmFundModalBtn) {
  confirmFundModalBtn.addEventListener("click", () => {
    closeModal("fundWalletModal");
    showToast("info", "Funding started", "Choose an amount below to continue funding.");
  });
}

if (walletFundForm) {
  walletFundForm.addEventListener("submit", (e) => {
    e.preventDefault();
    showToast("info", "Funding started", "Your wallet funding request is being processed.");
  });
}