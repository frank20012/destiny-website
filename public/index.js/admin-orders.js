import { getStoredToken } from "./auth-storage.js";

const API_BASE_URL = CONFIG.API_BASE_URL;

const getToken = () => getStoredToken();

const focusOrderSearchBtn = document.getElementById("focusOrderSearchBtn");
const showActiveOrdersBtn = document.getElementById("showActiveOrdersBtn");
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

const escapeHtml = (value = "") => {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
};

const normalizeStatus = (status = "pending") => {
  return String(status || "pending").trim().toLowerCase();
};

const formatPrice = (value) => {
  return `₦${Number(value || 0).toLocaleString("en-NG", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`;
};

const formatDateTime = (dateString) => {
  if (!dateString) return "-";

  const date = new Date(dateString);

  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return date.toLocaleString();
};

const getUserName = (order) => {
  if (order.userDisplayName) return order.userDisplayName;

  if (!order.user) return "-";

  const firstName = order.user.firstName || "";
  const lastName = order.user.lastName || "";
  const fullName = `${firstName} ${lastName}`.trim();

  return fullName || order.user.email || "-";
};

const getServiceName = (order) => {
  return (
    order.serviceName ||
    order.service?.name ||
    order.service ||
    "Service"
  );
};

const getOrderNumber = (order) => {
  return (
    order.assignedNumber ||
    order.phoneNumber ||
    order.numberInventory?.number ||
    "-"
  );
};

const getStatusClass = (status) => {
  const normalizedStatus = normalizeStatus(status);

  const map = {
    pending: "pending",
    active: "processing",
    waiting_sms: "processing",
    completed: "completed",
    cancelled: "cancelled",
    expired: "cancelled",
    failed: "failed"
  };

  return map[normalizedStatus] || "pending";
};

const getTimeLeft = (order) => {
  if (!order.expiresAt) return "-";

  const status = normalizeStatus(order.status);

  if (status === "expired") return "Expired";
  if (status === "completed") return "Completed";
  if (status === "cancelled") return "Cancelled";
  if (status === "failed") return "Failed";

  const now = new Date();
  const expiresAt = new Date(order.expiresAt);
  const diffMs = expiresAt - now;

  if (Number.isNaN(expiresAt.getTime())) return "-";
  if (diffMs <= 0) return "Expired";

  const totalMinutes = Math.floor(diffMs / (1000 * 60));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours <= 0) return `${minutes}m left`;

  return `${hours}h ${minutes}m left`;
};

const renderCounts = () => {
  const activeCount = allAdminOrders.filter((order) =>
    ["active", "waiting_sms", "pending"].includes(normalizeStatus(order.status))
  ).length;

  const completedCount = allAdminOrders.filter(
    (order) => normalizeStatus(order.status) === "completed"
  ).length;

  const closedCount = allAdminOrders.filter((order) =>
    ["cancelled", "expired", "failed"].includes(normalizeStatus(order.status))
  ).length;

  if (ordersTotalCount) ordersTotalCount.textContent = allAdminOrders.length;
  if (ordersActiveCount) ordersActiveCount.textContent = activeCount;
  if (ordersCompletedCount) ordersCompletedCount.textContent = completedCount;
  if (ordersClosedCount) ordersClosedCount.textContent = closedCount;
};

const showTableMessage = (message, type = "normal") => {
  if (!adminOrdersTableBody) return;

  const color = type === "error" ? "#ef4444" : "var(--muted)";

  adminOrdersTableBody.innerHTML = `
    <tr>
      <td colspan="10" style="text-align:center; color:${color}; padding: 24px;">
        ${escapeHtml(message)}
      </td>
    </tr>
  `;
};

const renderAdminOrdersPage = () => {
  if (!adminOrdersTableBody) return;

  const totalPages = Math.max(
    1,
    Math.ceil(filteredAdminOrders.length / ADMIN_ORDERS_PER_PAGE)
  );

  if (adminOrdersCurrentPage > totalPages) {
    adminOrdersCurrentPage = totalPages;
  }

  const start = (adminOrdersCurrentPage - 1) * ADMIN_ORDERS_PER_PAGE;
  const end = start + ADMIN_ORDERS_PER_PAGE;
  const currentOrders = filteredAdminOrders.slice(start, end);

  adminOrdersTableBody.innerHTML = "";

  currentOrders.forEach((order) => {
    const orderId = String(order._id || "");
    const status = normalizeStatus(order.status);
    const serviceName = getServiceName(order);
    const userName = getUserName(order);
    const number = getOrderNumber(order);
    const otpCode = order.otpCode || "";

    const tr = document.createElement("tr");

    tr.innerHTML = `
      <td>#${escapeHtml(orderId.slice(-6).toUpperCase())}</td>
      <td>${escapeHtml(userName)}</td>
      <td>${escapeHtml(serviceName)}</td>
      <td>${escapeHtml(number)}</td>
      <td>
        <span class="status ${getStatusClass(status)}">
          ${escapeHtml(status)}
        </span>
      </td>
      <td>${formatPrice(order.price || order.chargedAmount)}</td>
      <td>${escapeHtml(otpCode || "-")}</td>
      <td>${formatDateTime(order.expiresAt)}</td>
      <td>${escapeHtml(getTimeLeft(order))}</td>
      <td>
        <div class="admin-order-action-box">
          <select class="order-status-select" data-id="${escapeHtml(orderId)}">
            <option value="pending" ${status === "pending" ? "selected" : ""}>Pending</option>
            <option value="active" ${status === "active" ? "selected" : ""}>Active</option>
            <option value="waiting_sms" ${status === "waiting_sms" ? "selected" : ""}>Waiting SMS</option>
            <option value="completed" ${status === "completed" ? "selected" : ""}>Completed</option>
            <option value="cancelled" ${status === "cancelled" ? "selected" : ""}>Cancelled</option>
            <option value="expired" ${status === "expired" ? "selected" : ""}>Expired</option>
            <option value="failed" ${status === "failed" ? "selected" : ""}>Failed</option>
          </select>

          <div class="otp-action-wrap ${
            status === "active" ||
            status === "waiting_sms" ||
            status === "completed"
              ? "show"
              : ""
          }" data-id="${escapeHtml(orderId)}">
            <input
              type="text"
              class="order-otp-input"
              data-id="${escapeHtml(orderId)}"
              value="${escapeHtml(otpCode)}"
              placeholder="Enter OTP"
            />

            <button
              type="button"
              class="save-order-update-btn"
              data-id="${escapeHtml(orderId)}"
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
    const searchableText = `
      ${getServiceName(order)}
      ${getUserName(order)}
      ${order.user?.email || ""}
      ${getOrderNumber(order)}
      ${order.otpCode || ""}
      ${order.provider || ""}
      ${order.providerOrderId || ""}
      ${order.country || ""}
    `.toLowerCase();

    const matchesSearch = searchableText.includes(searchValue);
    const matchesStatus =
      statusValue === "all" || normalizeStatus(order.status) === statusValue;

    return matchesSearch && matchesStatus;
  });

  adminOrdersCurrentPage = 1;
  renderAdminOrdersPage();
};

const fetchAdminOrders = async () => {
  const token = getToken();

  if (!token) {
    showTableMessage("Admin login required.", "error");
    return;
  }

  showTableMessage("Loading orders...");

  try {
    const response = await fetch(`${API_BASE_URL}/api/admin/orders`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Failed to fetch orders");
    }

    allAdminOrders = Array.isArray(data.orders) ? data.orders : [];
    filteredAdminOrders = [...allAdminOrders];

    renderCounts();
    renderAdminOrdersPage();
  } catch (error) {
    console.error("Admin orders fetch error:", error.message);

    showTableMessage(error.message || "Could not load orders.", "error");

    if (adminOrdersPagination) {
      adminOrdersPagination.style.display = "none";
    }
  }
};

const updateOrderStatus = async (orderId, status, otpCode) => {
  const token = getToken();

  if (!token) {
    if (typeof showToast === "function") {
      showToast("error", "Login required", "Admin login is required.");
    }
    return;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/api/admin/orders/${orderId}`, {
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
    console.error("Admin order update error:", error.message);

    if (typeof showToast === "function") {
      showToast(
        "error",
        "Update failed",
        error.message || "Could not update order."
      );
    }
  }
};

const bindOrderStatusEvents = () => {
  document.querySelectorAll(".order-status-select").forEach((select) => {
    select.addEventListener("change", () => {
      const orderId = select.dataset.id;
      const selectedStatus = select.value;

      const otpWrap = document.querySelector(
        `.otp-action-wrap[data-id="${orderId}"]`
      );

      if (!otpWrap) return;

      if (
        selectedStatus === "active" ||
        selectedStatus === "waiting_sms" ||
        selectedStatus === "completed"
      ) {
        otpWrap.classList.add("show");
      } else {
        otpWrap.classList.remove("show");
      }
    });
  });

  document.querySelectorAll(".save-order-update-btn").forEach((button) => {
    button.addEventListener("click", () => {
      const orderId = button.dataset.id;

      const statusSelect = document.querySelector(
        `.order-status-select[data-id="${orderId}"]`
      );
      const otpInput = document.querySelector(
        `.order-otp-input[data-id="${orderId}"]`
      );

      const status = statusSelect ? statusSelect.value : "pending";
      const otpCode = otpInput ? otpInput.value.trim() : "";

      updateOrderStatus(orderId, status, otpCode);
    });
  });
};

focusOrderSearchBtn?.addEventListener("click", () => {
  adminOrderSearchInput?.focus();
});

showActiveOrdersBtn?.addEventListener("click", () => {
  if (!adminOrderStatusFilter) return;

  adminOrderStatusFilter.value = "active";
  adminOrderStatusFilter.dispatchEvent(new Event("change", { bubbles: true }));
});

adminOrderSearchInput?.addEventListener("input", filterAdminOrders);
adminOrderStatusFilter?.addEventListener("change", filterAdminOrders);

adminOrdersPrevBtn?.addEventListener("click", () => {
  if (adminOrdersCurrentPage > 1) {
    adminOrdersCurrentPage -= 1;
    renderAdminOrdersPage();
  }
});

adminOrdersNextBtn?.addEventListener("click", () => {
  const totalPages = Math.ceil(
    filteredAdminOrders.length / ADMIN_ORDERS_PER_PAGE
  );

  if (adminOrdersCurrentPage < totalPages) {
    adminOrdersCurrentPage += 1;
    renderAdminOrdersPage();
  }
});

refreshOrdersBtn?.addEventListener("click", fetchAdminOrders);

fetchAdminOrders();