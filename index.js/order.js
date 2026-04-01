const API_BASE_URL = "http://localhost:5000";
const token = localStorage.getItem("token");

const orderSearchInput = document.getElementById("orderSearchInput");
const orderStatusFilter = document.getElementById("orderStatusFilter");
const ordersTableBody = document.getElementById("ordersTableBody");
const ordersEmptyMessage = document.getElementById("ordersEmptyMessage");
const ordersPrevBtn = document.getElementById("ordersPrevBtn");
const ordersNextBtn = document.getElementById("ordersNextBtn");
const ordersPageInfo = document.getElementById("ordersPageInfo");
const ordersPagination = document.getElementById("ordersPagination");

const ORDERS_PER_PAGE = 6;
let ordersCurrentPage = 1;
let allOrders = [];
let filteredOrders = [];

const formatPrice = (price) => `$${Number(price).toFixed(2)}`;

const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString();
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
      <td>${order.service?.country || "-"}</td>
      <td><span class="status ${getStatusClass(order.status)}">${order.status}</span></td>
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
    const country = (order.service?.country || "").toLowerCase();
    const status = order.status || "";

    const matchesSearch =
      orderId.includes(searchValue) ||
      serviceName.includes(searchValue) ||
      country.includes(searchValue);

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
        <td colspan="6" style="text-align:center; color: var(--muted);">Loading orders...</td>
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
    renderOrdersPage();
  } catch (error) {
    if (ordersTableBody) {
      ordersTableBody.innerHTML = `
        <tr>
          <td colspan="6" style="text-align:center; color: #ef4444;">${error.message || "Could not load orders."}</td>
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