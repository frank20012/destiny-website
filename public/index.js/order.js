import { getStoredToken } from "./auth-storage.js";

const API_BASE_URL = CONFIG.API_BASE_URL;

const ordersContainer = document.getElementById("ordersContainer");
const refreshOrdersBtn = document.getElementById("refreshOrdersBtn");

let orders = [];
let currentPage = 1;
let autoPollingTimer = null;
let isAutoChecking = false;

const ROWS_PER_PAGE = 5;
const AUTO_POLL_INTERVAL = 12000;

const getToken = () => getStoredToken();

const formatDate = (dateString) => {
  if (!dateString) return "-";
  const date = new Date(dateString);
  return date.toLocaleString();
};

const formatMoney = (value) =>
  `₦${Number(value || 0).toLocaleString("en-NG", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`;

const getStatusLabel = (status) => {
  if (!status) return "pending";
  return String(status).toLowerCase();
};

const getOrderType = (order) => {
  return order.provider === "smspool" && order.serviceId ? "rent" : "otp";
};

const getOrderTypeLabel = (order) => {
  return getOrderType(order) === "rent" ? "Rent Order" : "OTP Order";
};

const isActiveOtpOrder = (order) => {
  const status = getStatusLabel(order.status);
  const orderType = getOrderType(order);

  return (
    orderType === "otp" &&
    !order.otpCode &&
    ["pending", "active", "waiting_sms"].includes(status)
  );
};

const getPaginatedOrders = () => {
  const startIndex = (currentPage - 1) * ROWS_PER_PAGE;
  const endIndex = startIndex + ROWS_PER_PAGE;
  return orders.slice(startIndex, endIndex);
};

const getTotalPages = () => {
  return Math.max(1, Math.ceil(orders.length / ROWS_PER_PAGE));
};

const renderEmptyOrders = (
  message = "Your purchased numbers and OTP activity will appear here."
) => {
  if (!ordersContainer) return;

  ordersContainer.innerHTML = `
    <div class="empty-orders-box">
      <i class="fa-solid fa-box-open"></i>
      <h3>No orders yet</h3>
      <p>${message}</p>
    </div>
  `;
};

const copyText = async (text, successMessage) => {
  if (!text || text === "Waiting..." || text === "Pending..." || text === "-") {
    return;
  }

  try {
    await navigator.clipboard.writeText(String(text));

    if (typeof showToast === "function") {
      showToast("success", "Copied", successMessage);
    } else {
      alert(successMessage);
    }
  } catch (error) {
    console.log("Copy failed:", error.message);
  }
};

const sortOrdersByDate = (items = []) => {
  return [...items].sort(
    (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
  );
};

const renderPagination = () => {
  const totalPages = getTotalPages();

  if (totalPages <= 1) {
    return "";
  }

  let pageButtons = "";

  for (let page = 1; page <= totalPages; page += 1) {
    pageButtons += `
      <button
        type="button"
        class="pagination-btn ${page === currentPage ? "is-active" : ""}"
        data-page="${page}"
      >
        ${page}
      </button>
    `;
  }

  return `
    <div class="orders-pagination">
      <button
        type="button"
        class="pagination-btn pagination-nav"
        data-page="${currentPage - 1}"
        ${currentPage === 1 ? "disabled" : ""}
      >
        <i class="fa-solid fa-chevron-left"></i>
        Prev
      </button>

      <div class="pagination-pages">
        ${pageButtons}
      </div>

      <button
        type="button"
        class="pagination-btn pagination-nav"
        data-page="${currentPage + 1}"
        ${currentPage === totalPages ? "disabled" : ""}
      >
        Next
        <i class="fa-solid fa-chevron-right"></i>
      </button>
    </div>
  `;
};

const renderOrders = () => {
  if (!ordersContainer) return;

  if (!orders.length) {
    renderEmptyOrders();
    return;
  }

  const visibleOrders = getPaginatedOrders();

  const rows = visibleOrders
    .map((order) => {
      const orderStatus = getStatusLabel(order.status);
      const orderType = getOrderType(order);
      const canCancel =
        orderType === "otp" &&
        !["completed", "cancelled", "expired", "failed"].includes(orderStatus);

      const hasOtp = Boolean(order.otpCode);
      const hasNumber = Boolean(order.assignedNumber);
      const isAutoWaiting = isActiveOtpOrder(order);

      return `
        <tr>
          <td class="order-id-cell">
            <span class="order-id-main">${order._id || "-"}</span>
            <span class="order-id-sub">${formatDate(order.createdAt)}</span>
          </td>

          <td class="order-service-cell">
            <strong>${(order.serviceName || "Service").toUpperCase()}</strong>
            <span class="order-type-badge">
              <i class="fa-solid ${
                orderType === "rent" ? "fa-phone-volume" : "fa-bolt"
              }"></i>
              ${getOrderTypeLabel(order)}
            </span>
          </td>

          <td class="order-country-cell">
            <strong>${order.country || "-"}</strong>
            <span>${order.providerOrderId || "-"}</span>
          </td>

          <td class="order-provider-cell">
            <strong>${order.provider || "-"}</strong>
            <span>${order.providerOperator || "any"}</span>
          </td>

          <td class="order-number-cell">
            <strong>${order.assignedNumber || "Pending..."}</strong>
            <button
              class="copy-table-btn ${hasNumber ? "" : "is-disabled"}"
              type="button"
              data-copy-number="${order._id}"
              ${hasNumber ? "" : "disabled"}
            >
              <i class="fa-regular fa-copy"></i>
              Copy
            </button>
          </td>

          <td class="order-otp-cell">
            <strong class="${hasOtp ? "order-otp-live" : ""}">
              ${order.otpCode || "Waiting..."}
            </strong>
            <button
              class="copy-table-btn ${hasOtp ? "" : "is-disabled"}"
              type="button"
              data-copy-otp="${order._id}"
              ${hasOtp ? "" : "disabled"}
            >
              <i class="fa-regular fa-copy"></i>
              Copy
            </button>
          </td>

          <td class="order-price-cell">
            <strong>${formatMoney(order.price)}</strong>
            <span>${orderStatus}</span>
          </td>

          <td>
            <span class="status status-${orderStatus}">${orderStatus}</span>
          </td>

          <td>
            <div class="table-actions">
              <button
                class="mini-table-btn"
                data-id="${order._id}"
                data-type="${orderType}"
                type="button"
              >
                <i class="fa-solid fa-rotate-right ${isAutoWaiting ? "fa-spin" : ""}"></i>
                ${isAutoWaiting ? "Checking" : "Refresh"}
              </button>

              ${
                canCancel
                  ? `
                    <button
                      class="cancel-table-btn"
                      data-id="${order._id}"
                      type="button"
                    >
                      <i class="fa-solid fa-ban"></i>
                      Cancel
                    </button>
                  `
                  : ""
              }
            </div>
          </td>
        </tr>
      `;
    })
    .join("");

  ordersContainer.innerHTML = `
    <div class="orders-table-card">
      <div class="orders-table-wrap">
        <table class="orders-table">
          <thead>
            <tr>
              <th>Order ID / Date</th>
              <th>Service / Type</th>
              <th>Country / Provider ID</th>
              <th>Provider / Operator</th>
              <th>Assigned Number</th>
              <th>OTP Code</th>
              <th>Price</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            ${rows}
          </tbody>
        </table>
      </div>
    </div>

    ${renderPagination()}
  `;

  bindRefreshButtons();
  bindCancelButtons();
  bindCopyButtons();
  bindPaginationButtons();
};

const fetchOtpOrders = async (token) => {
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

const fetchRentOrders = async (token) => {
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

const fetchOrders = async () => {
  try {
    const token = getToken();

    if (!token) {
      stopAutoPolling();

      if (ordersContainer) {
        ordersContainer.innerHTML = `
          <div class="empty-orders-box">
            <i class="fa-solid fa-lock"></i>
            <h3>Login required</h3>
            <p>You need to sign in before viewing your orders.</p>
          </div>
        `;
      }

      return;
    }

    ordersContainer.innerHTML = `
      <div class="empty-orders-box">
        <i class="fa-solid fa-spinner fa-spin"></i>
        <h3>Loading orders</h3>
        <p>Please wait while we fetch your latest orders.</p>
      </div>
    `;

    const [otpOrders, rentOrders] = await Promise.all([
      fetchOtpOrders(token).catch(() => []),
      fetchRentOrders(token).catch(() => [])
    ]);

    orders = sortOrdersByDate([...otpOrders, ...rentOrders]);

    const totalPages = getTotalPages();

    if (currentPage > totalPages) {
      currentPage = totalPages;
    }

    renderOrders();
    startAutoPolling();
  } catch (error) {
    stopAutoPolling();

    if (ordersContainer) {
      ordersContainer.innerHTML = `
        <div class="empty-orders-box">
          <i class="fa-solid fa-triangle-exclamation"></i>
          <h3>Could not load orders</h3>
          <p>${error.message || "Something went wrong."}</p>
        </div>
      `;
    }
  }
};

const fetchOrderStatus = async (orderId, type, options = {}) => {
  try {
    const token = getToken();
    if (!token) return;

    const url =
      type === "rent"
        ? `${API_BASE_URL}/api/rent/orders/${orderId}/status`
        : `${API_BASE_URL}/api/orders/${orderId}/status`;

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    const data = await response.json();

    if (!response.ok) {
      return;
    }

    const index = orders.findIndex((order) => order._id === orderId);

    if (index !== -1) {
      const previousOtpCode = orders[index].otpCode;
      const previousStatus = orders[index].status;

      orders[index] = {
        ...orders[index],
        ...data.order
      };

      orders = sortOrdersByDate(orders);
      renderOrders();

      const newOtpCode = data.order?.otpCode;
      const newStatus = data.order?.status;

      if (!previousOtpCode && newOtpCode && typeof showToast === "function") {
        showToast("success", "OTP received", "Your OTP code has arrived.");
      }

      if (
        !options.silent &&
        previousStatus !== newStatus &&
        newStatus &&
        typeof showToast === "function"
      ) {
        showToast("info", "Order updated", `Order status is now ${newStatus}.`);
      }
    }
  } catch (error) {
    console.log("Status check error:", error.message);
  }
};

const autoCheckActiveOrders = async () => {
  if (isAutoChecking) return;

  const activeOrders = orders.filter(isActiveOtpOrder);

  if (!activeOrders.length) {
    return;
  }

  isAutoChecking = true;

  try {
    await Promise.all(
      activeOrders.map((order) =>
        fetchOrderStatus(order._id, "otp", { silent: true })
      )
    );
  } finally {
    isAutoChecking = false;
  }
};

const startAutoPolling = () => {
  if (autoPollingTimer) {
    clearInterval(autoPollingTimer);
  }

  const hasActiveOrders = orders.some(isActiveOtpOrder);

  if (!hasActiveOrders) {
    autoPollingTimer = null;
    return;
  }

  autoPollingTimer = setInterval(() => {
    autoCheckActiveOrders();
  }, AUTO_POLL_INTERVAL);
};

const stopAutoPolling = () => {
  if (autoPollingTimer) {
    clearInterval(autoPollingTimer);
    autoPollingTimer = null;
  }

  isAutoChecking = false;
};

const cancelOrder = async (orderId) => {
  try {
    const token = getToken();
    if (!token) return;

    const response = await fetch(`${API_BASE_URL}/api/orders/${orderId}/cancel`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Failed to cancel order");
    }

    const index = orders.findIndex((order) => order._id === orderId);

    if (index !== -1) {
      orders[index] = data.order;
      orders = sortOrdersByDate(orders);
      renderOrders();
      startAutoPolling();
    }

    if (typeof showToast === "function") {
      showToast(
        "success",
        "Cancelled",
        data.refunded
          ? "Order cancelled and refunded successfully."
          : "Order cancelled successfully."
      );
    }
  } catch (error) {
    if (typeof showToast === "function") {
      showToast(
        "error",
        "Cancel failed",
        error.message || "Could not cancel order."
      );
    } else {
      alert(error.message || "Could not cancel order.");
    }
  }
};

const bindRefreshButtons = () => {
  document.querySelectorAll(".mini-table-btn").forEach((button) => {
    button.addEventListener("click", () => {
      const orderId = button.dataset.id;
      const type = button.dataset.type;
      fetchOrderStatus(orderId, type);
    });
  });
};

const bindCancelButtons = () => {
  document.querySelectorAll(".cancel-table-btn").forEach((button) => {
    button.addEventListener("click", () => {
      const orderId = button.dataset.id;
      cancelOrder(orderId);
    });
  });
};

const bindCopyButtons = () => {
  document.querySelectorAll("[data-copy-number]").forEach((button) => {
    button.addEventListener("click", () => {
      const orderId = button.dataset.copyNumber;
      const order = orders.find((item) => item._id === orderId);
      if (!order) return;

      copyText(order.assignedNumber, "Number copied successfully.");
    });
  });

  document.querySelectorAll("[data-copy-otp]").forEach((button) => {
    button.addEventListener("click", () => {
      const orderId = button.dataset.copyOtp;
      const order = orders.find((item) => item._id === orderId);
      if (!order) return;

      copyText(order.otpCode, "OTP copied successfully.");
    });
  });
};

const bindPaginationButtons = () => {
  document.querySelectorAll(".pagination-btn[data-page]").forEach((button) => {
    button.addEventListener("click", () => {
      const nextPage = Number(button.dataset.page || 1);
      const totalPages = getTotalPages();

      if (nextPage < 1 || nextPage > totalPages) {
        return;
      }

      currentPage = nextPage;
      renderOrders();
    });
  });
};

refreshOrdersBtn?.addEventListener("click", async () => {
  currentPage = 1;
  await fetchOrders();

  if (typeof showToast === "function") {
    showToast("success", "Refreshed", "Orders refreshed successfully.");
  }
});

document.addEventListener("visibilitychange", () => {
  if (document.hidden) {
    stopAutoPolling();
    return;
  }

  startAutoPolling();
});

window.addEventListener("beforeunload", () => {
  stopAutoPolling();
});

fetchOrders();