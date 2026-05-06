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
const walletAmountPreview = document.getElementById("walletAmountPreview");
const walletPreviewGateway = document.getElementById("walletPreviewGateway");
const walletMethodTag = document.getElementById("walletMethodTag");
const gatewayTitle = document.getElementById("gatewayTitle");
const gatewayDescription = document.getElementById("gatewayDescription");
const gatewayBadge = document.getElementById("gatewayBadge");
const quickAmountButtons = document.querySelectorAll(".quick-amount-btn");

const walletCredits = document.getElementById("walletCredits");
const walletDebits = document.getElementById("walletDebits");
const walletTransactionCount = document.getElementById("walletTransactionCount");

const MIN_FUND_AMOUNT = 100;
const MAX_FUND_AMOUNT = 1000000;

let balanceVisible = true;

const getToken = () => getStoredToken();

const formatMoney = (amount) =>
  `₦${Number(amount || 0).toLocaleString("en-NG", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`;

const formatTransactionTitle = (transaction) => {
  const raw =
    transaction.description ||
    transaction.title ||
    transaction.referenceType ||
    "Transaction";

  return String(raw)
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/[_-]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase());
};

const getTransactionStatus = (transaction) => {
  return String(transaction.status || "pending").toLowerCase();
};

const getTransactionStatusLabel = (status) => {
  if (status === "completed") return "Completed";
  if (status === "failed") return "Failed";
  if (status === "cancelled") return "Cancelled";
  if (status === "abandoned") return "Abandoned";
  if (status === "pending") return "Pending";
  return status.charAt(0).toUpperCase() + status.slice(1);
};

const getTransactionAmountClass = (transaction) => {
  const status = getTransactionStatus(transaction);
  const type = String(transaction.type || "").toLowerCase();

  if (status === "failed" || status === "cancelled" || status === "abandoned") {
    return "failed";
  }

  if (status === "pending") {
    return "pending";
  }

  if (type === "credit" || type === "refund") {
    return "credit";
  }

  if (type === "debit") {
    return "debit";
  }

  return "normal";
};

const getSignedAmountText = (transaction) => {
  const type = String(transaction.type || "").toLowerCase();
  const amount = formatMoney(transaction.amount || 0);

  if (type === "credit" || type === "refund") {
    return `+${amount}`;
  }

  if (type === "debit") {
    return `-${amount}`;
  }

  return amount;
};

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

const clearFundingParamsFromUrl = () => {
  const url = new URL(window.location.href);
  url.searchParams.delete("reference");
  url.searchParams.delete("trxref");
  url.searchParams.delete("accessCode");
  url.searchParams.delete("access_code");
  url.searchParams.delete("gateway");
  window.history.replaceState({}, document.title, url.pathname);
};

const updateAmountPreview = () => {
  if (!walletAmountPreview) return;
  const amount = Number(fundAmountInput?.value || 0);
  walletAmountPreview.textContent = formatMoney(amount);
};

const updateGatewayPreview = () => {
  const method = fundMethodInput?.value || "paystack";

  if (walletPreviewGateway) {
    walletPreviewGateway.textContent =
      method === "etegram" ? "Etegram" : "Paystack";
  }

  if (walletMethodTag) {
    walletMethodTag.textContent = method === "etegram" ? "Bank Transfer" : "Instant";
  }

  if (gatewayTitle) {
    gatewayTitle.textContent = method === "etegram" ? "Etegram" : "Paystack";
  }

  if (gatewayDescription) {
    gatewayDescription.textContent =
      method === "etegram"
        ? "Alternative checkout gateway for wallet funding"
        : "Secure online payment gateway for quick wallet funding";
  }

  if (gatewayBadge) {
    gatewayBadge.textContent = method === "etegram" ? "Alternative" : "Secure";
  }
};

const setActiveQuickAmount = (amount) => {
  quickAmountButtons.forEach((button) => {
    button.classList.toggle(
      "is-active",
      Number(button.dataset.amount || 0) === Number(amount || 0)
    );
  });
};

const validateFundingAmount = (amount) => {
  if (!amount || Number.isNaN(amount)) {
    return "Enter a valid amount.";
  }

  if (amount < MIN_FUND_AMOUNT) {
    return `Minimum funding amount is ${formatMoney(MIN_FUND_AMOUNT)}.`;
  }

  if (amount > MAX_FUND_AMOUNT) {
    return `Maximum funding amount is ${formatMoney(MAX_FUND_AMOUNT)}.`;
  }

  return null;
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

fundAmountInput?.addEventListener("input", () => {
  updateAmountPreview();
  setActiveQuickAmount(Number(fundAmountInput.value || 0));
});

fundMethodInput?.addEventListener("change", () => {
  updateGatewayPreview();
});

quickAmountButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const amount = Number(button.dataset.amount || 0);
    if (fundAmountInput) {
      fundAmountInput.value = amount;
      fundAmountInput.focus();
    }
    setActiveQuickAmount(amount);
    updateAmountPreview();
  });
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

    const status = getTransactionStatus(transaction);
    const amountClass = getTransactionAmountClass(transaction);
    const statusLabel = getTransactionStatusLabel(status);

    item.innerHTML = `
      <div class="transaction-info">
        <h4>${formatTransactionTitle(transaction)}</h4>
        <p>${new Date(transaction.createdAt).toLocaleString()}</p>
      </div>

      <div class="transaction-side">
        <span class="transaction-status status-${status}">
          ${statusLabel}
        </span>

        <div class="transaction-amount ${amountClass}">
          ${getSignedAmountText(transaction)}
        </div>
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
      .filter(
        (item) =>
          item.type === "credit" &&
          String(item.status || "").toLowerCase() === "completed"
      )
      .reduce((sum, item) => sum + Number(item.amount || 0), 0);

    const totalDebits = transactions
      .filter(
        (item) =>
          item.type === "debit" &&
          String(item.status || "").toLowerCase() === "completed"
      )
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

const initializeEtegramFunding = async (amount) => {
  const token = getToken();

  const response = await fetch(`${API_BASE_URL}/api/payments/etegram/initialize`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ amount })
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Failed to initialize Etegram payment");
  }

  if (!data.authorization_url || !data.access_code) {
    throw new Error("Etegram payment link was not returned by the server");
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

const verifyEtegramFunding = async (reference, accessCode) => {
  const token = getToken();

  const response = await fetch(
    `${API_BASE_URL}/api/payments/etegram/verify/${reference}/${accessCode}`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`
      }
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Etegram payment verification failed");
  }

  return data;
};

const handleFundingReturn = async () => {
  const token = getToken();
  const url = new URL(window.location.href);
  const reference =
    url.searchParams.get("reference") ||
    url.searchParams.get("trxref");
  const accessCode =
    url.searchParams.get("accessCode") ||
    url.searchParams.get("access_code");
  const gateway = url.searchParams.get("gateway");

  if (!token || !reference) return;

  try {
    showWalletMessage("Verifying payment...", "normal");

    if (gateway === "etegram" && accessCode) {
      await verifyEtegramFunding(reference, accessCode);
    } else {
      await verifyPaystackFunding(reference);
    }

    showWalletMessage("Wallet funded successfully.", "success");

    await loadWallet();
    await loadTransactions();

    clearFundingParamsFromUrl();
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

  const amountError = validateFundingAmount(amount);
  if (amountError) {
    showWalletMessage(amountError, "error");
    fundAmountInput?.focus();
    return;
  }

  try {
    showWalletMessage("Initializing payment...");

    if (method === "etegram") {
      const data = await initializeEtegramFunding(amount);
      showWalletMessage("Redirecting to Etegram...", "success");
      window.location.href = data.authorization_url;
      return;
    }

    const data = await initializePaystackFunding(amount);
    showWalletMessage("Redirecting to payment...", "success");
    window.location.href = data.authorization_url;
  } catch (error) {
    showWalletMessage(error.message || "Could not initialize funding.", "error");
  }
});

const initWalletPage = async () => {
  updateAmountPreview();
  updateGatewayPreview();
  await handleFundingReturn();
  await loadWallet();
  await loadTransactions();
};

initWalletPage();