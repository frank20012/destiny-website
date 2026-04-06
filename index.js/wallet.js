const API_BASE_URL = CONFIG.API_BASE_URL;
import { getStoredToken, getStoredUser } from "./auth-storage.js";

const token = getStoredToken();
const user = getStoredUser();

const walletFundForm = document.getElementById("walletFundForm");
const fundAmountInput = document.getElementById("fundAmount");
const walletMessage = document.getElementById("walletMessage");

const walletMainBalance = document.getElementById("walletMainBalance");
const walletTotalFunded = document.getElementById("walletTotalFunded");
const walletTotalSpent = document.getElementById("walletTotalSpent");
const walletPendingAmount = document.getElementById("walletPendingAmount");
const walletFundingHistoryBody = document.getElementById("walletFundingHistoryBody");

const openFundModalBtn = document.getElementById("openFundModalBtn");
const confirmFundModalBtn = document.getElementById("confirmFundModalBtn");

const formatPrice = (value) => `$${Number(value || 0).toFixed(2)}`;

const formatDate = (dateString) => {
  if (!dateString) return "-";
  const date = new Date(dateString);
  return date.toLocaleDateString();
};

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

const getStatusClass = (status) => {
  const map = {
    completed: "completed",
    pending: "pending",
    failed: "cancelled"
  };
  return map[status] || "pending";
};

const getFundingMethodLabel = (transaction) => {
  const description = (transaction.description || "").toLowerCase();

  if (description.includes("paystack")) return "Paystack";
  if (description.includes("bank")) return "Bank Transfer";
  if (description.includes("card")) return "Card Payment";

  return "Wallet Funding";
};

const updateWalletUI = (wallet) => {
  if (!wallet) return;

  if (walletMainBalance) {
    walletMainBalance.textContent = formatPrice(wallet.balance);
  }
};

const renderFundingHistory = (transactions) => {
  if (!walletFundingHistoryBody) return;

  const fundingTransactions = transactions.filter(
    (transaction) => transaction.type === "credit" || transaction.type === "refund"
  );

  if (!fundingTransactions.length) {
    walletFundingHistoryBody.innerHTML = `
      <tr>
        <td colspan="5" style="text-align:center; color: var(--muted);">
          No funding history found.
        </td>
      </tr>
    `;
    return;
  }

  walletFundingHistoryBody.innerHTML = "";

  fundingTransactions.slice(0, 8).forEach((transaction) => {
    const tr = document.createElement("tr");

    tr.innerHTML = `
      <td>${transaction.reference || "-"}</td>
      <td>${getFundingMethodLabel(transaction)}</td>
      <td><span class="status ${getStatusClass(transaction.status)}">${transaction.status}</span></td>
      <td>${formatPrice(transaction.amount)}</td>
      <td>${formatDate(transaction.createdAt)}</td>
    `;

    walletFundingHistoryBody.appendChild(tr);
  });
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

    renderFundingHistory(transactions);
  } catch (error) {
    console.error(error.message);
  }
};

const verifyPaymentFromUrl = async () => {
  const params = new URLSearchParams(window.location.search);
  const reference = params.get("reference");

  if (!reference || !token) return;

  try {
    const response = await fetch(`${API_BASE_URL}/api/payments/paystack/verify/${reference}`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Payment verification failed");
    }

    updateWalletUI(data.wallet);
    await fetchTransactionsSummary();

    if (typeof showToast === "function") {
      showToast("success", "Payment verified", "Your wallet has been funded successfully.");
    }

    const cleanUrl = window.location.origin + window.location.pathname;
    window.history.replaceState({}, document.title, cleanUrl);
  } catch (error) {
    showMessage(error.message || "Could not verify payment.");
  }
};

const initializePaystackFunding = async () => {
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
    const response = await fetch(`${API_BASE_URL}/api/payments/paystack/initialize`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ amount })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Payment initialization failed");
    }

    window.location.href = data.authorization_url;
  } catch (error) {
    showMessage(error.message || "Something went wrong.");
  }
};

if (walletFundForm) {
  walletFundForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    await initializePaystackFunding();
  });
}

openFundModalBtn?.addEventListener("click", () => {
  if (typeof openModal === "function") {
    openModal("fundWalletModal");
  }
});

confirmFundModalBtn?.addEventListener("click", async () => {
  if (typeof closeModal === "function") {
    closeModal("fundWalletModal");
  }

  await initializePaystackFunding();
});

if (token) {
  fetchWallet();
  fetchTransactionsSummary();
  verifyPaymentFromUrl();
} else {
  showMessage("Please sign in first.");
}