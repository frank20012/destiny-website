const API_BASE_URL = "http://localhost:5000";
const token = localStorage.getItem("token");

const walletFundForm = document.getElementById("walletFundForm");
const fundAmountInput = document.getElementById("fundAmount");
const walletMessage = document.getElementById("walletMessage");

const walletMainBalance = document.getElementById("walletMainBalance");
const walletTotalFunded = document.getElementById("walletTotalFunded");
const walletTotalSpent = document.getElementById("walletTotalSpent");
const walletPendingAmount = document.getElementById("walletPendingAmount");

const formatPrice = (value) => `$${Number(value || 0).toFixed(2)}`;

const showMessage = (text, type = "error") => {
  if (!walletMessage) return;
  walletMessage.textContent = text;
  walletMessage.className = `form-message ${type}`;
};

const clearMessage = () => {
  if (!walletMessage) return;
  walletMessage.textContent = "";
  walletMessage.className = "form-message";
};

const updateWalletUI = (wallet) => {
  if (!wallet) return;

  if (walletMainBalance) {
    walletMainBalance.textContent = formatPrice(wallet.balance);
  }
};

const fetchWallet = async () => {
  if (!token) {
    showMessage("Please sign in first.");
    return;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/api/wallet`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Failed to fetch wallet");
    }

    updateWalletUI(data.wallet);
  } catch (error) {
    showMessage(error.message || "Could not load wallet.");
  }
};

const fetchTransactionsSummary = async () => {
  if (!token) return;

  try {
    const response = await fetch(`${API_BASE_URL}/api/transactions`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Failed to fetch transactions");
    }

    const transactions = data.transactions || [];

    let totalFunded = 0;
    let totalSpent = 0;
    let pendingAmount = 0;

    transactions.forEach((transaction) => {
      if (transaction.type === "credit" && transaction.status === "completed") {
        totalFunded += Number(transaction.amount);
      }

      if (transaction.type === "debit" && transaction.status === "completed") {
        totalSpent += Number(transaction.amount);
      }

      if (transaction.status === "pending") {
        pendingAmount += Number(transaction.amount);
      }
    });

    if (walletTotalFunded) {
      walletTotalFunded.textContent = formatPrice(totalFunded);
    }

    if (walletTotalSpent) {
      walletTotalSpent.textContent = formatPrice(totalSpent);
    }

    if (walletPendingAmount) {
      walletPendingAmount.textContent = formatPrice(pendingAmount);
    }
  } catch (error) {
    console.error(error.message);
  }
};

if (walletFundForm) {
  walletFundForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    clearMessage();

    if (!token) {
      showMessage("Please sign in first.");
      return;
    }

    const amount = Number(fundAmountInput?.value);

    if (!amount || amount <= 0) {
      showMessage("Enter a valid amount.");
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/wallet/fund`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ amount })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Wallet funding failed");
      }

      updateWalletUI(data.wallet);
      await fetchTransactionsSummary();

      if (fundAmountInput) {
        fundAmountInput.value = "";
      }

      showMessage("Wallet funded successfully.", "success");

      if (typeof showToast === "function") {
        showToast("success", "Wallet funded", "Your wallet has been funded successfully.");
      }
    } catch (error) {
      showMessage(error.message || "Something went wrong.");
    }
  });
}

if (token) {
  fetchWallet();
  fetchTransactionsSummary();
} else {
  showMessage("Please sign in first.");
}