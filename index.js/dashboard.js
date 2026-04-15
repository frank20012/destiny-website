import { getStoredToken, getStoredUser } from "./auth-storage.js";

const API_BASE_URL = CONFIG.API_BASE_URL;
const token = getStoredToken();
const user = getStoredUser();

const dashboardWalletBalance = document.getElementById("dashboardWalletBalance");
const mobileDashboardWalletBalance = document.getElementById("mobileDashboardWalletBalance");
const walletVisibilityToggle = document.getElementById("walletVisibilityToggle");

const dashboardOrdersCount = document.getElementById("dashboardOrdersCount");
const dashboardTransactionsCount = document.getElementById("dashboardTransactionsCount");
const dashboardApiStatus = document.getElementById("dashboardApiStatus");
const dashboardActiveOrdersCount = document.getElementById("dashboardActiveOrdersCount");
const dashboardCompletedOrdersCount = document.getElementById("dashboardCompletedOrdersCount");
const dashboardRefundsCount = document.getElementById("dashboardRefundsCount");
const dashboardRefundAmount = document.getElementById("dashboardRefundAmount");

const dashboardRecentOrders = document.getElementById("dashboardRecentOrders");
const dashboardRecentTransactions = document.getElementById("dashboardRecentTransactions");

let walletVisible = true;
let currentWalletText = "₦0.00";

const syncWalletDisplays = (value) => {
  currentWalletText = value;

  if (dashboardWalletBalance) {
    dashboardWalletBalance.textContent = value;
  }

  if (mobileDashboardWalletBalance) {
    mobileDashboardWalletBalance.textContent = walletVisible ? value : "••••••";
  }
};

walletVisibilityToggle?.addEventListener("click", () => {
  walletVisible = !walletVisible;

  if (mobileDashboardWalletBalance) {
    mobileDashboardWalletBalance.textContent = walletVisible
      ? currentWalletText
      : "••••••";
  }

  walletVisibilityToggle.innerHTML = walletVisible
    ? '<i class="fa-regular fa-eye"></i>'
    : '<i class="fa-regular fa-eye-slash"></i>';
});

const formatPrice = (value) =>
  `₦${Number(value || 0).toLocaleString("en-NG", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`;

const formatDate = (dateString) => {
  if (!dateString) return "-";
  const date = new Date(dateString);
  return date.toLocaleDateString();
};

const getStatusClass = (status) => {
  const map = {
    pending: "pending",
    active: "processing",
    completed: "completed",
    cancelled: "cancelled",
    expired: "cancelled",
    review: "processing",
    resolved: "completed",
    failed: "cancelled"
  };

  return map[String(status || "").toLowerCase()] || "pending";
};

const getAmountPrefix = (type) => {
  return type === "credit" || type === "refund" ? "+" : "-";
};

const getOrderType = (order) => {
  return order.provider === "smspool" ? "Rent Order" : "OTP Order";
};

const getOrderDisplayName = (order) => {
  return order.serviceName || order.service?.name || "Unknown Service";
};

const getOrderNumber = (order) => {
  return (
    order.assignedNumber ||
    order.numberInventory?.number ||
    "No number yet"
  );
};

const getTimeLeft = (order) => {
  if (!order.expiresAt) return "";

  const status = String(order.status || "").toLowerCase();

  if (status === "expired") return "Expired";
  if (status === "completed") return "Completed";
  if (status === "cancelled") return "Cancelled";

  const now = new Date();
  const expiresAt = new Date(order.expiresAt);
  const diffMs = expiresAt - now;

  if (diffMs <= 0) return "Expired";

  const totalMinutes = Math.floor(diffMs / (1000 * 60));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours <= 0) return `${minutes}m left`;

  return `${hours}h ${minutes}m left`;
};

const sortByDateDesc = (items = []) => {
  return [...items].sort(
    (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
  );
};

const renderRecentOrders = (orders) => {
  if (!dashboardRecentOrders) return;

  if (!orders.length) {
    dashboardRecentOrders.innerHTML = `
      <div class="activity-item">
        <div>
          <h4>No recent orders</h4>
          <p>Your recent OTP and rent orders will appear here.</p>
        </div>
      </div>
    `;
    return;
  }

  dashboardRecentOrders.innerHTML = "";

  sortByDateDesc(orders)
    .slice(0, 4)
    .forEach((order) => {
      const item = document.createElement("div");
      item.className = "activity-item";

      item.innerHTML = `
        <div>
          <h4>${getOrderDisplayName(order)}</h4>
          <p>
            ${getOrderNumber(order)} •
            ${getTimeLeft(order) || formatDate(order.createdAt)} •
            ${getOrderType(order)}
          </p>
        </div>
        <span class="mini-badge ${getStatusClass(order.status)}">${order.status}</span>
      `;

      dashboardRecentOrders.appendChild(item);
    });
};

const renderRecentTransactions = (transactions) => {
  if (!dashboardRecentTransactions) return;

  if (!transactions.length) {
    dashboardRecentTransactions.innerHTML = `
      <div class="activity-item">
        <div>
          <h4>No recent transactions</h4>
          <p>Your wallet activity will appear here.</p>
        </div>
      </div>
    `;
    return;
  }

  dashboardRecentTransactions.innerHTML = "";

  sortByDateDesc(transactions)
    .slice(0, 4)
    .forEach((transaction) => {
      const item = document.createElement("div");
      item.className = "activity-item";

      item.innerHTML = `
        <div>
          <h4>${transaction.description || "Transaction"}</h4>
          <p>${transaction.reference || "-"} • ${formatDate(transaction.createdAt)}</p>
        </div>
        <span class="amount ${transaction.type === "credit" || transaction.type === "refund" ? "positive" : "negative"}">
          ${getAmountPrefix(transaction.type)}${formatPrice(transaction.amount)}
        </span>
      `;

      dashboardRecentTransactions.appendChild(item);
    });
};

const fetchWallet = async () => {
  const response = await fetch(`${API_BASE_URL}/api/wallet`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Failed to fetch wallet");
  }

  const balance =
    data.wallet?.balance ??
    data.balance ??
    0;

  syncWalletDisplays(formatPrice(balance));

  return data.wallet || { balance };
};

const fetchOtpOrders = async () => {
  const response = await fetch(`${API_BASE_URL}/api/orders`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Failed to fetch OTP orders");
  }

  return data.orders || [];
};

const fetchRentOrders = async () => {
  const response = await fetch(`${API_BASE_URL}/api/rent/orders`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Failed to fetch rent orders");
  }

  return data.orders || [];
};

const fetchTransactions = async () => {
  const response = await fetch(`${API_BASE_URL}/api/transactions`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Failed to fetch transactions");
  }

  return data.transactions || [];
};

const loadDashboard = async () => {
  if (!token || !user) {
    window.location.href = "signin.html";
    return;
  }

  if (dashboardApiStatus) {
    dashboardApiStatus.textContent = "Connected";
  }

  try {
    const [wallet, otpOrders, rentOrders, transactions] = await Promise.all([
      fetchWallet(),
      fetchOtpOrders().catch(() => []),
      fetchRentOrders().catch(() => []),
      fetchTransactions()
    ]);

    const allOrders = sortByDateDesc([...otpOrders, ...rentOrders]);

    const activeOrders = allOrders.filter((order) =>
      ["pending", "active"].includes(String(order.status || "").toLowerCase())
    ).length;

    const completedOrders = allOrders.filter((order) =>
      String(order.status || "").toLowerCase() === "completed"
    ).length;

    const refundTransactions = transactions.filter(
      (transaction) =>
        String(transaction.type || "").toLowerCase() === "refund"
    );

    const totalRefundAmount = refundTransactions.reduce(
      (sum, transaction) => sum + Number(transaction.amount || 0),
      0
    );

    if (dashboardOrdersCount) {
      dashboardOrdersCount.textContent = allOrders.length;
    }

    if (dashboardTransactionsCount) {
      dashboardTransactionsCount.textContent = transactions.length;
    }

    if (dashboardActiveOrdersCount) {
      dashboardActiveOrdersCount.textContent = activeOrders;
    }

    if (dashboardCompletedOrdersCount) {
      dashboardCompletedOrdersCount.textContent = completedOrders;
    }

    if (dashboardRefundsCount) {
      dashboardRefundsCount.textContent = refundTransactions.length;
    }

    if (dashboardRefundAmount) {
      dashboardRefundAmount.textContent = formatPrice(totalRefundAmount);
    }

    renderRecentOrders(allOrders);
    renderRecentTransactions(transactions);
  } catch (error) {
    console.error(error.message);

    if (dashboardRecentOrders) {
      dashboardRecentOrders.innerHTML = `
        <div class="activity-item">
          <div>
            <h4>Could not load dashboard</h4>
            <p>${error.message}</p>
          </div>
        </div>
      `;
    }

    if (dashboardRecentTransactions) {
      dashboardRecentTransactions.innerHTML = `
        <div class="activity-item">
          <div>
            <h4>Could not load transactions</h4>
            <p>${error.message}</p>
          </div>
        </div>
      `;
    }

    if (dashboardApiStatus) {
      dashboardApiStatus.textContent = "Disconnected";
    }
  }
};

loadDashboard();