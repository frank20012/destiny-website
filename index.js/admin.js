const API_BASE_URL = "http://localhost:5000";
const token = localStorage.getItem("token");

const adminTotalUsers = document.getElementById("adminTotalUsers");
const adminTotalServices = document.getElementById("adminTotalServices");
const adminTotalOrders = document.getElementById("adminTotalOrders");
const adminTotalTransactions = document.getElementById("adminTotalTransactions");
const adminTotalTickets = document.getElementById("adminTotalTickets");
const adminSupportQueueCount = document.getElementById("adminSupportQueueCount");

const adminRecentUsersBody = document.getElementById("adminRecentUsersBody");
const adminRecentOrdersBody = document.getElementById("adminRecentOrdersBody");
const adminRecentTicketsList = document.getElementById("adminRecentTicketsList");
const refreshAdminOverviewBtn = document.getElementById("refreshAdminOverviewBtn");

const getStatusClass = (status) => {
  const map = {
    pending: "pending",
    active: "processing",
    completed: "completed",
    cancelled: "cancelled",
    expired: "cancelled",
    open: "pending",
    review: "processing",
    resolved: "completed"
  };
  return map[status] || "pending";
};

const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString();
};

const renderRecentUsers = (users) => {
  if (!adminRecentUsersBody) return;

  if (!users.length) {
    adminRecentUsersBody.innerHTML = `
      <tr>
        <td colspan="5" style="text-align:center; color: var(--muted);">No users found.</td>
      </tr>
    `;
    return;
  }

  adminRecentUsersBody.innerHTML = "";

  users.forEach((user) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>#${user._id.slice(-6).toUpperCase()}</td>
      <td>${user.firstName} ${user.lastName}</td>
      <td>${user.email}</td>
      <td>${user.role}</td>
      <td>${formatDate(user.createdAt)}</td>
    `;
    adminRecentUsersBody.appendChild(tr);
  });
};

const renderRecentOrders = (orders) => {
  if (!adminRecentOrdersBody) return;

  if (!orders.length) {
    adminRecentOrdersBody.innerHTML = `
      <tr>
        <td colspan="5" style="text-align:center; color: var(--muted);">No orders found.</td>
      </tr>
    `;
    return;
  }

  adminRecentOrdersBody.innerHTML = "";

  orders.forEach((order) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>#${order._id.slice(-6).toUpperCase()}</td>
      <td>${order.user ? `${order.user.firstName} ${order.user.lastName}` : "-"}</td>
      <td>${order.service?.name || "-"}</td>
      <td><span class="status ${getStatusClass(order.status)}">${order.status}</span></td>
      <td>${order.numberInventory?.number || "-"}</td>
    `;
    adminRecentOrdersBody.appendChild(tr);
  });
};

const renderRecentTickets = (tickets) => {
  if (!adminRecentTicketsList) return;

  if (!tickets.length) {
    adminRecentTicketsList.innerHTML = `
      <div class="activity-item">
        <div>
          <h4>No recent tickets</h4>
          <p>Support activity will appear here.</p>
        </div>
      </div>
    `;
    return;
  }

  adminRecentTicketsList.innerHTML = "";

  tickets.forEach((ticket) => {
    const item = document.createElement("div");
    item.className = "activity-item";

    item.innerHTML = `
      <div>
        <h4>${ticket.subject}</h4>
        <p>${ticket.user ? `${ticket.user.firstName} ${ticket.user.lastName}` : "Unknown User"} • ${ticket.category}</p>
      </div>
      <span class="mini-badge ${getStatusClass(ticket.status)}">${ticket.status}</span>
    `;

    adminRecentTicketsList.appendChild(item);
  });
};

const fetchAdminOverview = async () => {
  if (!token) {
    window.location.href = "signin.html";
    return;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/api/admin`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Failed to fetch admin overview");
    }

    const stats = data.stats || {};

    if (adminTotalUsers) adminTotalUsers.textContent = stats.totalUsers || 0;
    if (adminTotalServices) adminTotalServices.textContent = stats.totalServices || 0;
    if (adminTotalOrders) adminTotalOrders.textContent = stats.totalOrders || 0;
    if (adminTotalTransactions) adminTotalTransactions.textContent = stats.totalTransactions || 0;
    if (adminTotalTickets) adminTotalTickets.textContent = stats.totalTickets || 0;
    if (adminSupportQueueCount) {
      const queueCount = (data.recentTickets || []).filter(
        (ticket) => ticket.status === "open" || ticket.status === "review"
      ).length;
      adminSupportQueueCount.textContent = queueCount;
    }

    renderRecentUsers(data.recentUsers || []);
    renderRecentOrders(data.recentOrders || []);
    renderRecentTickets(data.recentTickets || []);
  } catch (error) {
    console.error(error.message);

    if (typeof showToast === "function") {
      showToast("error", "Load failed", error.message || "Could not load admin overview.");
    }
  }
};

refreshAdminOverviewBtn?.addEventListener("click", fetchAdminOverview);

fetchAdminOverview();