import { getStoredToken, getStoredUser } from "./auth-storage.js";

const API_BASE_URL = CONFIG.API_BASE_URL;
const token = getStoredToken();
const user = getStoredUser();

const dashboardWalletBalance = document.getElementById("dashboardWalletBalance");
const dashboardOrdersCount = document.getElementById("dashboardOrdersCount");
const dashboardTransactionsCount = document.getElementById("dashboardTransactionsCount");
const dashboardApiStatus = document.getElementById("dashboardApiStatus");

const dashboardRecentOrders = document.getElementById("dashboardRecentOrders");
const dashboardRecentTransactions = document.getElementById("dashboardRecentTransactions");

const formatPrice = (value) => `$${Number(value || 0).toFixed(2)}`;

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

  return map[status] || "pending";
};

const getAmountPrefix = (type) => {
  return type === "credit" || type === "refund" ? "+" : "-";
};

const formatDate = (dateString) => {
  if (!dateString) return "-";
  const date = new Date(dateString);
  return date.toLocaleDateString();
};

const getTimeLeft = (order) => {
  if (!order.expiresAt) return "";

  if (order.status === "expired") return "Expired";
  if (order.status === "completed") return "Completed";
  if (order.status === "cancelled") return "Cancelled";

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

const renderRecentOrders = (orders) => {
  if (!dashboardRecentOrders) return;

  if (!orders.length) {
    dashboardRecentOrders.innerHTML = `
      <div class="activity-item">
        <div>
          <h4>No recent orders</h4>
          <p>Your recent OTP orders will appear here.</p>
        </div>
      </div>
    `;
    return;
  }

  dashboardRecentOrders.innerHTML = "";

  orders.slice(0, 4).forEach((order) => {
    const item = document.createElement("div");
    item.className = "activity-item";

    item.innerHTML = `
      <div>
        <h4>${order.service?.name || "Unknown Service"}</h4>
        <p>
          ${order.assignedNumber || order.numberInventory?.number || "No number yet"} •
          ${getTimeLeft(order) || formatDate(order.createdAt)}
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

  transactions.slice(0, 4).forEach((transaction) => {
    const item = document.createElement("div");
    item.className = "activity-item";

    item.innerHTML = `
      <div>
        <h4>${transaction.description || "Transaction"}</h4>
        <p>${transaction.reference || "-"} • ${formatDate(transaction.createdAt)}</p>
      </div>
      <span class="mini-badge ${getStatusClass(transaction.status)}">
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

  if (dashboardWalletBalance) {
    dashboardWalletBalance.textContent = formatPrice(data.wallet.balance);
  }
};

const fetchOrders = async () => {
  const response = await fetch(`${API_BASE_URL}/api/orders`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Failed to fetch orders");
  }

  const orders = data.orders || [];

  if (dashboardOrdersCount) {
    dashboardOrdersCount.textContent = orders.length;
  }

  renderRecentOrders(orders);
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

  const transactions = data.transactions || [];

  if (dashboardTransactionsCount) {
    dashboardTransactionsCount.textContent = transactions.length;
  }

  renderRecentTransactions(transactions);
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
    await Promise.all([fetchWallet(), fetchOrders(), fetchTransactions()]);
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
  }
};

loadDashboard();