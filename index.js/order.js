const API_BASE_URL = CONFIG.API_BASE_URL;
import { getStoredToken, getStoredUser } from "./auth-storage.js";

const token = getStoredToken();
const user = getStoredUser();

const orderSearchInput = document.getElementById("orderSearchInput");
const orderStatusFilter = document.getElementById("orderStatusFilter");
const ordersTableBody = document.getElementById("ordersTableBody");
const ordersEmptyMessage = document.getElementById("ordersEmptyMessage");
const ordersPrevBtn = document.getElementById("ordersPrevBtn");
const ordersNextBtn = document.getElementById("ordersNextBtn");
const ordersPageInfo = document.getElementById("ordersPageInfo");
const ordersPagination = document.getElementById("ordersPagination");

const ordersTotalCount = document.getElementById("ordersTotalCount");
const ordersCompletedCount = document.getElementById("ordersCompletedCount");
const ordersPendingCount = document.getElementById("ordersPendingCount");
const ordersProcessingCount = document.getElementById("ordersProcessingCount");

const ordersRecentActivity = document.getElementById("ordersRecentActivity");
const ordersMostUsedService = document.getElementById("ordersMostUsedService");
const ordersLastCompleted = document.getElementById("ordersLastCompleted");
const ordersPendingValue = document.getElementById("ordersPendingValue");
const ordersSuccessRate = document.getElementById("ordersSuccessRate");

const ORDERS_PER_PAGE = 6;
let ordersCurrentPage = 1;
let allOrders = [];
let filteredOrders = [];

const formatPrice = (price) => `$${Number(price || 0).toFixed(2)}`;

const formatDate = (dateString) => {
  if (!dateString) return "-";
  const date = new Date(dateString);
  return date.toLocaleDateString();
};

const formatDateTime = (dateString) => {
  if (!dateString) return "-";
  const date = new Date(dateString);
  return `${date.toLocaleDateString()} ${date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
};

const getStatusClass = (status) => {
  const map = {
    pending: "pending",
    active: "processing",
    completed: "completed",
    cancelled: "cancelled",
    expired: "cancelled"
  };

  return map[status] || "pending";
};

const getTimeLeft = (order) => {
  if (!order.expiresAt) return "-";

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

  if (hours <= 0) {
    return `${minutes}m left`;
  }

  return `${hours}h ${minutes}m left`;
};

const renderOrdersSummary = () => {
  const totalOrders = allOrders.length;
  const completedOrders = allOrders.filter((order) => order.status === "completed");
  const pendingOrders = allOrders.filter((order) => order.status === "pending");
  const processingOrders = allOrders.filter((order) => order.status === "active");

  if (ordersTotalCount) ordersTotalCount.textContent = totalOrders;
  if (ordersCompletedCount) ordersCompletedCount.textContent = completedOrders.length;
  if (ordersPendingCount) ordersPendingCount.textContent = pendingOrders.length;
  if (ordersProcessingCount) ordersProcessingCount.textContent = processingOrders.length;

  let pendingValue = 0;
  pendingOrders.forEach((order) => {
    pendingValue += Number(order.price || 0);
  });

  if (ordersPendingValue) ordersPendingValue.textContent = formatPrice(pendingValue);

  const serviceUsage = {};
  allOrders.forEach((order) => {
    const name = order.service?.name || "Unknown Service";
    serviceUsage[name] = (serviceUsage[name] || 0) + 1;
  });

  let topService = "-";
  let topCount = 0;

  Object.entries(serviceUsage).forEach(([name, count]) => {
    if (count > topCount) {
      topCount = count;
      topService = name;
    }
  });

  if (ordersMostUsedService) ordersMostUsedService.textContent = topService;

  const sortedCompleted = [...completedOrders].sort(
    (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
  );

  if (ordersLastCompleted) {
    ordersLastCompleted.textContent =
      sortedCompleted.length > 0
        ? `#${sortedCompleted[0]._id.slice(-6).toUpperCase()}`
        : "-";
  }

  const successRate =
    totalOrders > 0 ? Math.round((completedOrders.length / totalOrders) * 100) : 0;

  if (ordersSuccessRate) ordersSuccessRate.textContent = `${successRate}%`;
};

const renderRecentActivity = () => {
  if (!ordersRecentActivity) return;

  if (!allOrders.length) {
    ordersRecentActivity.innerHTML = `
      <div class="activity-item">
        <div>
          <h4>No recent activity</h4>
          <p>Your recent order updates will appear here.</p>
        </div>
      </div>
    `;
    return;
  }

  ordersRecentActivity.innerHTML = "";

  allOrders.slice(0, 3).forEach((order) => {
    const item = document.createElement("div");
    item.className = "activity-item";

    let activityText = "Order updated";
    if (order.status === "pending") activityText = "Marked as pending";
    if (order.status === "active") activityText = "Currently active";
    if (order.status === "completed") activityText = "Completed successfully";
    if (order.status === "cancelled") activityText = "Cancelled";
    if (order.status === "expired") activityText = "Expired automatically";

    item.innerHTML = `
      <div>
        <h4>Order #${order._id.slice(-6).toUpperCase()}</h4>
        <p>${activityText}</p>
      </div>
      <span class="mini-badge ${getStatusClass(order.status)}">${order.status}</span>
    `;

    ordersRecentActivity.appendChild(item);
  });
};

const renderOrdersPage = () => {
  if (!ordersTableBody) return;

  const totalPages = Math.max(1, Math.ceil(filteredOrders.length / ORDERS_PER_PAGE));
  if (ordersCurrentPage > totalPages) ordersCurrentPage = totalPages;

  const start = (ordersCurrentPage - 1) * ORDERS_PER_PAGE;
  const end = start + ORDERS_PER_PAGE;
  const currentOrders = filteredOrders.slice(start, end);

  ordersTableBody.innerHTML = "";

  currentOrders.forEach((order) => {
    const tr = document.createElement("tr");
    tr.dataset.status = order.status;

    tr.innerHTML = `
      <td>#${order._id.slice(-6).toUpperCase()}</td>
      <td>${order.service?.name || "Unknown Service"}</td>
      <td>${order.assignedNumber || order.numberInventory?.number || "-"}</td>
      <td><span class="status ${getStatusClass(order.status)}">${order.status}</span></td>
      <td>${order.otpCode || "-"}</td>
      <td>${formatDateTime(order.expiresAt)}</td>
      <td>${getTimeLeft(order)}</td>
      <td>${formatPrice(order.price)}</td>
      <td>${formatDate(order.createdAt)}</td>
    `;

    ordersTableBody.appendChild(tr);
  });

  if (ordersPageInfo) {
    ordersPageInfo.textContent = `Page ${ordersCurrentPage} of ${totalPages}`;
  }

  if (ordersPrevBtn) {
    ordersPrevBtn.disabled = ordersCurrentPage === 1;
  }

  if (ordersNextBtn) {
    ordersNextBtn.disabled = ordersCurrentPage === totalPages;
  }

  if (ordersEmptyMessage) {
    ordersEmptyMessage.style.display = filteredOrders.length === 0 ? "block" : "none";
  }

  if (ordersPagination) {
    ordersPagination.style.display = filteredOrders.length === 0 ? "none" : "flex";
  }
};

const filterOrders = () => {
  const searchValue = (orderSearchInput?.value || "").toLowerCase().trim();
  const statusValue = orderStatusFilter?.value || "all";

  filteredOrders = allOrders.filter((order) => {
    const orderId = `#${order._id.slice(-6).toUpperCase()}`.toLowerCase();
    const serviceName = (order.service?.name || "").toLowerCase();
    const assignedNumber = (order.assignedNumber || order.numberInventory?.number || "").toLowerCase();
    const otpCode = (order.otpCode || "").toLowerCase();
    const status = order.status || "";

    const matchesSearch =
      orderId.includes(searchValue) ||
      serviceName.includes(searchValue) ||
      assignedNumber.includes(searchValue) ||
      otpCode.includes(searchValue);

    const matchesStatus = statusValue === "all" || status === statusValue;

    return matchesSearch && matchesStatus;
  });

  ordersCurrentPage = 1;
  renderOrdersPage();
};

const fetchOrders = async () => {
  if (!token) {
    if (ordersEmptyMessage) {
      ordersEmptyMessage.textContent = "Please sign in to view your orders.";
      ordersEmptyMessage.style.display = "block";
    }
    if (ordersPagination) {
      ordersPagination.style.display = "none";
    }
    return;
  }

  if (ordersTableBody) {
    ordersTableBody.innerHTML = `
      <tr>
        <td colspan="9" style="text-align:center; color: var(--muted);">Loading orders...</td>
      </tr>
    `;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/api/orders`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Failed to fetch orders");
    }

    allOrders = data.orders || [];
    filteredOrders = [...allOrders];

    renderOrdersSummary();
    renderRecentActivity();
    renderOrdersPage();
  } catch (error) {
    if (ordersTableBody) {
      ordersTableBody.innerHTML = `
        <tr>
          <td colspan="9" style="text-align:center; color: #ef4444;">${error.message || "Could not load orders."}</td>
        </tr>
      `;
    }
    if (ordersPagination) {
      ordersPagination.style.display = "none";
    }
  }
};

if (orderSearchInput) {
  orderSearchInput.addEventListener("input", filterOrders);
}

if (orderStatusFilter) {
  orderStatusFilter.addEventListener("change", filterOrders);
}

if (ordersPrevBtn) {
  ordersPrevBtn.addEventListener("click", () => {
    if (ordersCurrentPage > 1) {
      ordersCurrentPage--;
      renderOrdersPage();
    }
  });
}

if (ordersNextBtn) {
  ordersNextBtn.addEventListener("click", () => {
    const totalPages = Math.ceil(filteredOrders.length / ORDERS_PER_PAGE);
    if (ordersCurrentPage < totalPages) {
      ordersCurrentPage++;
      renderOrdersPage();
    }
  });
}

fetchOrders();