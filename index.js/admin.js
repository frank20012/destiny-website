const API_BASE_URL = CONFIG.API_BASE_URL;
import { getStoredToken, getStoredUser } from "./auth-storage.js";

const token = getStoredToken();
const user = getStoredUser();

const usersCountEl = document.getElementById("adminUsersCount");
const ordersCountEl = document.getElementById("adminOrdersCount");
const transactionsCountEl = document.getElementById("adminTransactionsCount");
const ticketsCountEl = document.getElementById("adminTicketsCount");

const transactionsCountMirrorEl = document.getElementById("adminTransactionsCountMirror");
const supportQueueCountEl = document.getElementById("adminSupportQueueCount");

const recentUsersEl = document.getElementById("adminRecentUsers");
const recentOrdersEl = document.getElementById("adminRecentOrders");
const recentTicketsEl = document.getElementById("adminRecentTickets");
const refreshAdminOverviewBtn = document.getElementById("refreshAdminOverviewBtn");

const formatDate = (dateString) => {
  if (!dateString) return "-";
  return new Date(dateString).toLocaleDateString();
};

const getStatusClass = (status) => {
  const map = {
    pending: "pending",
    active: "processing",
    completed: "completed",
    cancelled: "cancelled",
    expired: "cancelled",
    open: "pending",
    review: "processing",
    resolved: "completed",
    failed: "cancelled"
  };
  return map[status] || "pending";
};

const getHeaders = () => ({
  Authorization: `Bearer ${token}`
});

const safeJson = async (response) => {
  try {
    return await response.json();
  } catch {
    return {};
  }
};

const renderUsers = (users) => {
  if (!recentUsersEl) return;

  if (!users.length) {
    recentUsersEl.innerHTML = `
      <div class="activity-item">
        <div>
          <h4>No users yet</h4>
          <p>Newly registered users will appear here.</p>
        </div>
      </div>
    `;
    return;
  }

  recentUsersEl.innerHTML = "";

  users.slice(0, 5).forEach((user) => {
    const div = document.createElement("div");
    div.className = "activity-item";

    div.innerHTML = `
      <div>
        <h4>${user.firstName || ""} ${user.lastName || ""}</h4>
        <p>${user.email || "-"}</p>
      </div>
      <span>${formatDate(user.createdAt)}</span>
    `;

    recentUsersEl.appendChild(div);
  });
};

const renderOrders = (orders) => {
  if (!recentOrdersEl) return;

  if (!orders.length) {
    recentOrdersEl.innerHTML = `
      <div class="activity-item">
        <div>
          <h4>No orders yet</h4>
          <p>Recent platform orders will appear here.</p>
        </div>
      </div>
    `;
    return;
  }

  recentOrdersEl.innerHTML = "";

  orders.slice(0, 5).forEach((order) => {
    const div = document.createElement("div");
    div.className = "activity-item";

    div.innerHTML = `
      <div>
        <h4>${order.service?.name || "Service"}</h4>
        <p>${order.user?.email || "Unknown user"}</p>
      </div>
      <span class="mini-badge ${getStatusClass(order.status)}">${order.status}</span>
    `;

    recentOrdersEl.appendChild(div);
  });
};

const renderTickets = (tickets) => {
  if (!recentTicketsEl) return;

  if (!tickets.length) {
    recentTicketsEl.innerHTML = `
      <div class="activity-item">
        <div>
          <h4>No recent tickets</h4>
          <p>Support requests will appear here.</p>
        </div>
      </div>
    `;
    return;
  }

  recentTicketsEl.innerHTML = "";

  tickets.slice(0, 5).forEach((ticket) => {
    const div = document.createElement("div");
    div.className = "activity-item";

    div.innerHTML = `
      <div>
        <h4>${ticket.subject || "Ticket"}</h4>
        <p>${ticket.user ? `${ticket.user.firstName || ""} ${ticket.user.lastName || ""}` : "Unknown user"}</p>
      </div>
      <span class="mini-badge ${getStatusClass(ticket.status)}">${ticket.status}</span>
    `;

    recentTicketsEl.appendChild(div);
  });
};

const loadAdminDashboard = async () => {
  if (!token) {
    window.location.href = "signin.html";
    return;
  }

  const requests = await Promise.allSettled([
    fetch(`${API_BASE_URL}/api/users/admin/all`, { headers: getHeaders() }),
    fetch(`${API_BASE_URL}/api/orders/admin`, { headers: getHeaders() }),
    fetch(`${API_BASE_URL}/api/transactions/admin`, { headers: getHeaders() }),
    fetch(`${API_BASE_URL}/api/tickets`, { headers: getHeaders() })
  ]);

  let users = [];
  let orders = [];
  let transactions = [];
  let tickets = [];

  if (requests[0].status === "fulfilled") {
    const res = requests[0].value;
    const data = await safeJson(res);
    console.log("Users response:", res.status, data);
    if (res.ok) users = data.users || [];
  }

  if (requests[1].status === "fulfilled") {
    const res = requests[1].value;
    const data = await safeJson(res);
    console.log("Orders response:", res.status, data);
    if (res.ok) orders = data.orders || [];
  }

  if (requests[2].status === "fulfilled") {
    const res = requests[2].value;
    const data = await safeJson(res);
    console.log("Transactions response:", res.status, data);
    if (res.ok) transactions = data.transactions || [];
  }

  if (requests[3].status === "fulfilled") {
    const res = requests[3].value;
    const data = await safeJson(res);
    console.log("Tickets response:", res.status, data);
    if (res.ok) tickets = data.tickets || [];
  }

  if (usersCountEl) usersCountEl.textContent = users.length;
  if (ordersCountEl) ordersCountEl.textContent = orders.length;
  if (transactionsCountEl) transactionsCountEl.textContent = transactions.length;
  if (ticketsCountEl) ticketsCountEl.textContent = tickets.length;

  if (transactionsCountMirrorEl) {
    transactionsCountMirrorEl.textContent = transactions.length;
  }

  if (supportQueueCountEl) {
    supportQueueCountEl.textContent = tickets.filter(
      (ticket) => ticket.status === "open" || ticket.status === "review"
    ).length;
  }

  renderUsers(users);
  renderOrders(orders);
  renderTickets(tickets);
};

refreshAdminOverviewBtn?.addEventListener("click", loadAdminDashboard);

loadAdminDashboard();