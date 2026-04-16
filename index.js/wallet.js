import { getStoredToken } from "./auth-storage.js";

const API_BASE_URL = CONFIG.API_BASE_URL;

const walletBalance = document.getElementById("walletBalance");
const transactionList = document.getElementById("transactionList");
const toggleBtn = document.getElementById("toggleBalance");
const fundBtn = document.getElementById("fundBtn");
const fundWalletForm = document.getElementById("fundWalletForm");
const fundAmountInput = document.getElementById("fundAmount");
const fundMethodInput = document.getElementById("fundMethod");
const walletMessage = document.getElementById("walletMessage");
const walletSubtext = document.getElementById("walletSubtext");

const walletCredits = document.getElementById("walletCredits");
const walletDebits = document.getElementById("walletDebits");
const walletTransactionCount = document.getElementById("walletTransactionCount");

let balanceVisible = true;

const getToken = () => getStoredToken();

const formatMoney = (amount) =>
  `₦${Number(amount || 0).toLocaleString("en-NG", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`;

const showWalletMessage = (text, type = "normal") => {
  if (!walletMessage) return;

  walletMessage.textContent = text;
  walletMessage.style.color =
    type === "error"
      ? "#dc2626"
      : type === "success"
      ? "#16a34a"
      : "";
};

const showEmptyTransactions = (message, icon = "fa-wallet") => {
  if (!transactionList) return;

  transactionList.innerHTML = `
    <div class="wallet-empty-box">
      <i class="fa-solid ${icon}"></i>
      <p>${message}</p>
    </div>
  `;
};

const clearReferenceFromUrl = () => {
  const url = new URL(window.location.href);
  url.searchParams.delete("reference");
  url.searchParams.delete("trxref");
  window.history.replaceState({}, document.title, url.pathname);
};

toggleBtn?.addEventListener("click", () => {
  balanceVisible = !balanceVisible;

  if (walletBalance) {
    walletBalance.textContent = balanceVisible
      ? walletBalance.dataset.real
      : "••••••";
  }

  toggleBtn.innerHTML = balanceVisible
    ? '<i class="fa-regular fa-eye"></i>'
    : '<i class="fa-regular fa-eye-slash"></i>';
});

fundBtn?.addEventListener("click", () => {
  fundAmountInput?.focus();
});

const loadWallet = async () => {
  try {
    const token = getToken();

    if (!token) {
      showWalletMessage("Please sign in to view wallet details.", "error");
      if (walletSubtext) {
        walletSubtext.textContent = "Login required";
      }
      return;
    }

    const response = await fetch(`${API_BASE_URL}/api/wallet`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Failed to load wallet");
    }

    const balanceValue =
      data.wallet?.balance ??
      data.balance ??
      0;

    const formattedBalance = formatMoney(balanceValue);

    if (walletBalance) {
      walletBalance.dataset.real = formattedBalance;
      walletBalance.textContent = balanceVisible ? formattedBalance : "••••••";
    }

    if (walletSubtext) {
      walletSubtext.textContent = "Your current usable balance";
    }
  } catch (error) {
    showWalletMessage(error.message || "Could not load wallet.", "error");
    if (walletSubtext) {
      walletSubtext.textContent = "Wallet unavailable";
    }
  }
};

const renderTransactions = (transactions) => {
  if (!transactionList) return;

  transactionList.innerHTML = "";

  if (!transactions.length) {
    showEmptyTransactions("No transactions yet.");
    return;
  }

  transactions.slice(0, 8).forEach((transaction) => {
    const item = document.createElement("div");
    item.className = "transaction-item";

    item.innerHTML = `
      <div class="transaction-info">
        <h4>${transaction.description || "Transaction"}</h4>
        <p>${new Date(transaction.createdAt).toLocaleString()}</p>
      </div>

      <div class="transaction-amount ${transaction.type}">
        ${transaction.type === "credit" || transaction.type === "refund" ? "+" : "-"}${formatMoney(transaction.amount)}
      </div>
    `;

    transactionList.appendChild(item);
  });
};

const loadTransactions = async () => {
  try {
    const token = getToken();

    if (!token) {
      showEmptyTransactions("Please sign in to view transactions.", "fa-lock");
      return;
    }

    const response = await fetch(`${API_BASE_URL}/api/transactions`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Failed to load transactions");
    }

    const transactions = data.transactions || [];

    if (walletTransactionCount) {
      walletTransactionCount.textContent = transactions.length;
    }

    const totalCredits = transactions
      .filter((item) => item.type === "credit" && item.status === "completed")
      .reduce((sum, item) => sum + Number(item.amount || 0), 0);

    const totalDebits = transactions
      .filter((item) => item.type === "debit" && item.status === "completed")
      .reduce((sum, item) => sum + Number(item.amount || 0), 0);

    if (walletCredits) {
      walletCredits.textContent = formatMoney(totalCredits);
    }

    if (walletDebits) {
      walletDebits.textContent = formatMoney(totalDebits);
    }

    renderTransactions(transactions);
  } catch (error) {
    showEmptyTransactions(
      error.message || "Could not load transactions.",
      "fa-triangle-exclamation"
    );
  }
};

const initializePaystackFunding = async (amount) => {
  const token = getToken();

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
    throw new Error(data.message || "Failed to initialize payment");
  }

  if (!data.authorization_url) {
    throw new Error("Payment link was not returned by the server");
  }

  return data;
};

const verifyPaystackFunding = async (reference) => {
  const token = getToken();

  const response = await fetch(`${API_BASE_URL}/api/payments/paystack/verify/${reference}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Payment verification failed");
  }

  return data;
};

const handlePaystackReturn = async () => {
  const token = getToken();
  const url = new URL(window.location.href);
  const reference =
    url.searchParams.get("reference") ||
    url.searchParams.get("trxref");

  if (!reference || !token) return;

  try {
    showWalletMessage("Verifying payment...", "normal");

    await verifyPaystackFunding(reference);

    showWalletMessage("Wallet funded successfully.", "success");

    await loadWallet();
    await loadTransactions();

    clearReferenceFromUrl();
  } catch (error) {
    showWalletMessage(error.message || "Could not verify payment.", "error");
  }
};

fundWalletForm?.addEventListener("submit", async (event) => {
  event.preventDefault();

  const token = getToken();
  const amount = Number(fundAmountInput?.value || 0);
  const method = fundMethodInput?.value || "paystack";

  if (!token) {
    showWalletMessage("You need to sign in before funding your wallet.", "error");
    return;
  }

  if (!amount || amount <= 0) {
    showWalletMessage("Enter a valid amount.", "error");
    return;
  }

  try {
    if (method !== "paystack") {
      throw new Error("Only Paystack is available right now");
    }

    showWalletMessage("Initializing payment...");

    const data = await initializePaystackFunding(amount);

    showWalletMessage("Redirecting to payment...", "success");
    window.location.href = data.authorization_url;
  } catch (error) {
    showWalletMessage(error.message || "Could not initialize funding.", "error");
  }
});

const initWalletPage = async () => {
  await handlePaystackReturn();
  await loadWallet();
  await loadTransactions();
};

initWalletPage();