import { getStoredToken } from "./auth-storage.js";

const API_BASE_URL = CONFIG.API_BASE_URL;

const ordersContainer = document.getElementById("ordersContainer");
const refreshOrdersBtn = document.getElementById("refreshOrdersBtn");

const ordersTotalCount = document.getElementById("ordersTotalCount");
const ordersActiveCount = document.getElementById("ordersActiveCount");
const ordersCompletedCount = document.getElementById("ordersCompletedCount");
const ordersClosedCount = document.getElementById("ordersClosedCount");

let orders = [];

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
  if (order.provider === "smspool") return "rent";
  return "otp";
};

const getOrderTypeLabel = (order) => {
  return getOrderType(order) === "rent" ? "Rent Order" : "OTP Order";
};

const getOrderProgressText = (order) => {
  const status = getStatusLabel(order.status);
  const type = getOrderType(order);

  if (status === "completed") return "OTP received successfully.";
  if (status === "cancelled") return "Order cancelled.";
  if (status === "expired") return "Order expired.";
  if (status === "failed") return "Order failed.";
  if (status === "active") {
    return type === "rent"
      ? "Waiting for SMSPool update or incoming OTP."
      : "Waiting for OTP from provider.";
  }
  return "Preparing order...";
};

const renderCounts = () => {
  const active = orders.filter(
    (order) => ["active", "pending"].includes(getStatusLabel(order.status))
  ).length;

  const completed = orders.filter(
    (order) => getStatusLabel(order.status) === "completed"
  ).length;

  const closed = orders.filter(
    (order) =>
      ["cancelled", "expired", "failed"].includes(getStatusLabel(order.status))
  ).length;

  if (ordersTotalCount) ordersTotalCount.textContent = orders.length;
  if (ordersActiveCount) ordersActiveCount.textContent = active;
  if (ordersCompletedCount) ordersCompletedCount.textContent = completed;
  if (ordersClosedCount) ordersClosedCount.textContent = closed;
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
  if (!text || text === "Waiting..." || text === "Pending..." || text === "-")
    return;

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

const renderOrders = () => {
  if (!ordersContainer) return;

  renderCounts();

  if (!orders.length) {
    renderEmptyOrders();
    return;
  }

  ordersContainer.innerHTML = "";

  orders.forEach((order) => {
    const orderStatus = getStatusLabel(order.status);
    const orderType = getOrderType(order);
    const canCancel =
      orderType === "otp" &&
      !["completed", "cancelled", "expired", "failed"].includes(orderStatus);

    const hasOtp = Boolean(order.otpCode);
    const hasNumber = Boolean(order.assignedNumber);

    const div = document.createElement("div");
    div.className = "order-card";

    div.innerHTML = `
      <div class="order-top">
        <div class="order-title">
          <h3>${(order.serviceName || "Service").toUpperCase()}</h3>
          <p>${order.country || "-"} • ${formatDate(order.createdAt)}</p>
          <span class="order-type-badge">
            <i class="fa-solid ${
              orderType === "rent" ? "fa-phone-volume" : "fa-bolt"
            }"></i>
            ${getOrderTypeLabel(order)}
          </span>
        </div>

        <div class="order-status">
          <span class="status status-${orderStatus}">${orderStatus}</span>
        </div>
      </div>

      <div class="order-progress-text">
        ${getOrderProgressText(order)}
      </div>

      <div class="order-body">
        <div class="order-meta">
          <span>Assigned Number</span>
          <strong>${order.assignedNumber || "Pending..."}</strong>
          <button
            class="mini-action-btn ${hasNumber ? "" : "is-disabled"}"
            type="button"
            data-copy-number="${order._id}"
            ${hasNumber ? "" : "disabled"}
          >
            <i class="fa-regular fa-copy"></i>
            <span>Copy Number</span>
          </button>
        </div>

        <div class="order-meta">
          <span>OTP Code</span>
          <strong class="${hasOtp ? "order-otp" : ""}">
            ${order.otpCode || "Waiting..."}
          </strong>
          <button
            class="mini-action-btn ${hasOtp ? "" : "is-disabled"}"
            type="button"
            data-copy-otp="${order._id}"
            ${hasOtp ? "" : "disabled"}
          >
            <i class="fa-regular fa-copy"></i>
            <span>Copy OTP</span>
          </button>
        </div>

        <div class="order-meta">
          <span>Provider Order ID</span>
          <strong>${order.providerOrderId || "-"}</strong>
        </div>

        <div class="order-meta">
          <span>Price</span>
          <strong>${formatMoney(order.price)}</strong>
        </div>
      </div>

      <div class="order-actions">
        <button class="refresh-btn" data-id="${order._id}" data-type="${orderType}" type="button">
          Refresh OTP
        </button>

        ${
          canCancel
            ? `<button class="cancel-btn" data-id="${order._id}" type="button">Cancel Order</button>`
            : ""
        }

        <span class="order-note">
          ${
            orderType === "rent"
              ? "Use refresh to check the latest SMSPool update."
              : "Use refresh to check the latest provider update."
          }
        </span>
      </div>
    `;

    ordersContainer.appendChild(div);
  });

  bindRefreshButtons();
  bindCancelButtons();
  bindCopyButtons();
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
    renderOrders();
  } catch (error) {
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

const fetchOrderStatus = async (orderId, type) => {
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
      orders[index] = {
        ...orders[index],
        ...data.order
      };
      renderOrders();
    }
  } catch (error) {
    console.log("Status check error:", error.message);
  }
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
      renderOrders();
    }

    if (typeof showToast === "function") {
      showToast("success", "Cancelled", "Order cancelled successfully.");
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
  document.querySelectorAll(".refresh-btn").forEach((button) => {
    button.addEventListener("click", () => {
      const orderId = button.dataset.id;
      const type = button.dataset.type;
      fetchOrderStatus(orderId, type);
    });
  });
};

const bindCancelButtons = () => {
  document.querySelectorAll(".cancel-btn").forEach((button) => {
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

refreshOrdersBtn?.addEventListener("click", async () => {
  await fetchOrders();

  if (typeof showToast === "function") {
    showToast("success", "Refreshed", "Orders refreshed successfully.");
  }
});

fetchOrders();