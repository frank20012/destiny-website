const API_BASE_URL = "http://localhost:5000";
import { getStoredToken, getStoredUser } from "./auth-storage.js";

const token = getStoredToken();
const user = getStoredUser();

const adminOrderSearchInput = document.getElementById("adminOrderSearchInput");
const adminOrderStatusFilter = document.getElementById("adminOrderStatusFilter");
const adminOrdersTableBody = document.getElementById("adminOrdersTableBody");
const adminOrdersEmptyMessage = document.getElementById("adminOrdersEmptyMessage");
const adminOrdersPrevBtn = document.getElementById("adminOrdersPrevBtn");
const adminOrdersNextBtn = document.getElementById("adminOrdersNextBtn");
const adminOrdersPageInfo = document.getElementById("adminOrdersPageInfo");
const adminOrdersPagination = document.getElementById("adminOrdersPagination");
const refreshOrdersBtn = document.getElementById("refreshOrdersBtn");

const ordersTotalCount = document.getElementById("ordersTotalCount");
const ordersActiveCount = document.getElementById("ordersActiveCount");
const ordersCompletedCount = document.getElementById("ordersCompletedCount");
const ordersClosedCount = document.getElementById("ordersClosedCount");

const ADMIN_ORDERS_PER_PAGE = 6;
let adminOrdersCurrentPage = 1;
let allAdminOrders = [];
let filteredAdminOrders = [];

const formatPrice = (value) => `$${Number(value || 0).toFixed(2)}`;

const formatDateTime = (dateString) => {
  if (!dateString) return "-";
  const date = new Date(dateString);
  return `${date.toLocaleDateString()} ${date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit"
  })}`;
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

  if (hours <= 0) return `${minutes}m left`;

  return `${hours}h ${minutes}m left`;
};

const renderCounts = () => {
  const activeCount = allAdminOrders.filter((o) => o.status === "active").length;
  const completedCount = allAdminOrders.filter((o) => o.status === "completed").length;
  const closedCount = allAdminOrders.filter(
    (o) => o.status === "cancelled" || o.status === "expired"
  ).length;

  if (ordersTotalCount) ordersTotalCount.textContent = allAdminOrders.length;
  if (ordersActiveCount) ordersActiveCount.textContent = activeCount;
  if (ordersCompletedCount) ordersCompletedCount.textContent = completedCount;
  if (ordersClosedCount) ordersClosedCount.textContent = closedCount;
};

const renderAdminOrdersPage = () => {
  if (!adminOrdersTableBody) return;

  const totalPages = Math.max(
    1,
    Math.ceil(filteredAdminOrders.length / ADMIN_ORDERS_PER_PAGE)
  );
  if (adminOrdersCurrentPage > totalPages) adminOrdersCurrentPage = totalPages;

  const start = (adminOrdersCurrentPage - 1) * ADMIN_ORDERS_PER_PAGE;
  const end = start + ADMIN_ORDERS_PER_PAGE;
  const currentOrders = filteredAdminOrders.slice(start, end);

  adminOrdersTableBody.innerHTML = "";

  currentOrders.forEach((order) => {
    const tr = document.createElement("tr");

    tr.innerHTML = `
      <td>#${order._id.slice(-6).toUpperCase()}</td>
      <td>${order.user ? `${order.user.firstName} ${order.user.lastName}` : "-"}</td>
      <td>${order.service?.name || "-"}</td>
      <td>${order.assignedNumber || order.numberInventory?.number || "-"}</td>
      <td><span class="status ${getStatusClass(order.status)}">${order.status}</span></td>
      <td>${formatPrice(order.price)}</td>
      <td>${order.otpCode || "-"}</td>
      <td>${formatDateTime(order.expiresAt)}</td>
      <td>${getTimeLeft(order)}</td>
      <td>
        <div class="admin-order-action-box">
          <select class="order-status-select" data-id="${order._id}">
            <option value="pending" ${order.status === "pending" ? "selected" : ""}>Pending</option>
            <option value="active" ${order.status === "active" ? "selected" : ""}>Active</option>
            <option value="completed" ${order.status === "completed" ? "selected" : ""}>Completed</option>
            <option value="cancelled" ${order.status === "cancelled" ? "selected" : ""}>Cancelled</option>
            <option value="expired" ${order.status === "expired" ? "selected" : ""}>Expired</option>
          </select>

          <div class="otp-action-wrap ${order.status === "active" || order.status === "completed" ? "show" : ""}" data-id="${order._id}">
            <input
              type="text"
              class="order-otp-input"
              data-id="${order._id}"
              value="${order.otpCode || ""}"
              placeholder="Enter OTP"
            />
            <button
              type="button"
              class="save-order-update-btn"
              data-id="${order._id}"
            >
              Save
            </button>
          </div>
        </div>
      </td>
    `;

    adminOrdersTableBody.appendChild(tr);
  });

  if (adminOrdersPageInfo) {
    adminOrdersPageInfo.textContent = `Page ${adminOrdersCurrentPage} of ${totalPages}`;
  }

  if (adminOrdersPrevBtn) {
    adminOrdersPrevBtn.disabled = adminOrdersCurrentPage === 1;
  }

  if (adminOrdersNextBtn) {
    adminOrdersNextBtn.disabled = adminOrdersCurrentPage === totalPages;
  }

  if (adminOrdersEmptyMessage) {
    adminOrdersEmptyMessage.style.display =
      filteredAdminOrders.length === 0 ? "block" : "none";
  }

  if (adminOrdersPagination) {
    adminOrdersPagination.style.display =
      filteredAdminOrders.length === 0 ? "none" : "flex";
  }

  bindOrderStatusEvents();
};

const filterAdminOrders = () => {
  const searchValue = (adminOrderSearchInput?.value || "").toLowerCase().trim();
  const statusValue = adminOrderStatusFilter?.value || "all";

  filteredAdminOrders = allAdminOrders.filter((order) => {
    const text = `${order.service?.name || ""} ${order.user?.firstName || ""} ${order.user?.lastName || ""} ${order.assignedNumber || order.numberInventory?.number || ""} ${order.otpCode || ""}`.toLowerCase();
    const matchesSearch = text.includes(searchValue);
    const matchesStatus = statusValue === "all" || order.status === statusValue;
    return matchesSearch && matchesStatus;
  });

  adminOrdersCurrentPage = 1;
  renderAdminOrdersPage();
};

const fetchAdminOrders = async () => {
  if (!token) return;

  if (adminOrdersTableBody) {
    adminOrdersTableBody.innerHTML = `
      <tr>
        <td colspan="10" style="text-align:center; color: var(--muted);">Loading orders...</td>
      </tr>
    `;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/api/orders/admin/all`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Failed to fetch orders");
    }

    allAdminOrders = data.orders || [];
    filteredAdminOrders = [...allAdminOrders];
    renderCounts();
    renderAdminOrdersPage();
  } catch (error) {
    if (adminOrdersTableBody) {
      adminOrdersTableBody.innerHTML = `
        <tr>
          <td colspan="10" style="text-align:center; color: #ef4444;">${error.message || "Could not load orders."}</td>
        </tr>
      `;
    }
    if (adminOrdersPagination) {
      adminOrdersPagination.style.display = "none";
    }
  }
};

const updateOrderStatus = async (orderId, status, otpCode) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/orders/admin/${orderId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        status,
        otpCode
      })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Failed to update order");
    }

    if (typeof showToast === "function") {
      showToast("success", "Order updated", "Order updated successfully.");
    }

    await fetchAdminOrders();
  } catch (error) {
    if (typeof showToast === "function") {
      showToast("error", "Update failed", error.message || "Could not update order.");
    }
  }
};

const bindOrderStatusEvents = () => {
  document.querySelectorAll(".order-status-select").forEach((select) => {
    select.addEventListener("change", () => {
      const orderId = select.dataset.id;
      const selectedStatus = select.value;

      const otpWrap = document.querySelector(`.otp-action-wrap[data-id="${orderId}"]`);

      if (otpWrap) {
        if (selectedStatus === "active" || selectedStatus === "completed") {
          otpWrap.classList.add("show");
        } else {
          otpWrap.classList.remove("show");
        }
      }
    });
  });

  document.querySelectorAll(".save-order-update-btn").forEach((button) => {
    button.addEventListener("click", () => {
      const orderId = button.dataset.id;

      const statusSelect = document.querySelector(`.order-status-select[data-id="${orderId}"]`);
      const otpInput = document.querySelector(`.order-otp-input[data-id="${orderId}"]`);

      const status = statusSelect ? statusSelect.value : "pending";
      const otpCode = otpInput ? otpInput.value.trim() : "";

      updateOrderStatus(orderId, status, otpCode);
    });
  });
};

adminOrderSearchInput?.addEventListener("input", filterAdminOrders);
adminOrderStatusFilter?.addEventListener("change", filterAdminOrders);

adminOrdersPrevBtn?.addEventListener("click", () => {
  if (adminOrdersCurrentPage > 1) {
    adminOrdersCurrentPage--;
    renderAdminOrdersPage();
  }
});

adminOrdersNextBtn?.addEventListener("click", () => {
  const totalPages = Math.ceil(filteredAdminOrders.length / ADMIN_ORDERS_PER_PAGE);
  if (adminOrdersCurrentPage < totalPages) {
    adminOrdersCurrentPage++;
    renderAdminOrdersPage();
  }
});

refreshOrdersBtn?.addEventListener("click", fetchAdminOrders);

fetchAdminOrders();