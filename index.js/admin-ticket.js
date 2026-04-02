const API_BASE_URL = "http://localhost:5000";
const token = localStorage.getItem("token");

const adminTicketSearchInput = document.getElementById("adminTicketSearchInput");
const adminTicketStatusFilter = document.getElementById("adminTicketStatusFilter");
const adminTicketsTableBody = document.getElementById("adminTicketsTableBody");
const adminTicketsEmptyMessage = document.getElementById("adminTicketsEmptyMessage");
const adminTicketsPrevBtn = document.getElementById("adminTicketsPrevBtn");
const adminTicketsNextBtn = document.getElementById("adminTicketsNextBtn");
const adminTicketsPageInfo = document.getElementById("adminTicketsPageInfo");
const adminTicketsPagination = document.getElementById("adminTicketsPagination");
const refreshTicketsBtn = document.getElementById("refreshTicketsBtn");

const ticketsTotalCount = document.getElementById("ticketsTotalCount");
const ticketsOpenCount = document.getElementById("ticketsOpenCount");
const ticketsReviewCount = document.getElementById("ticketsReviewCount");
const ticketsResolvedCount = document.getElementById("ticketsResolvedCount");

const ADMIN_TICKETS_PER_PAGE = 6;
let adminTicketsCurrentPage = 1;
let allAdminTickets = [];
let filteredAdminTickets = [];

const getStatusClass = (status) => {
  const map = {
    open: "pending",
    review: "processing",
    resolved: "completed"
  };
  return map[status] || "pending";
};

const formatPriority = (priority) => priority || "medium";

const renderCounts = () => {
  const openCount = allAdminTickets.filter((t) => t.status === "open").length;
  const reviewCount = allAdminTickets.filter((t) => t.status === "review").length;
  const resolvedCount = allAdminTickets.filter((t) => t.status === "resolved").length;

  if (ticketsTotalCount) ticketsTotalCount.textContent = allAdminTickets.length;
  if (ticketsOpenCount) ticketsOpenCount.textContent = openCount;
  if (ticketsReviewCount) ticketsReviewCount.textContent = reviewCount;
  if (ticketsResolvedCount) ticketsResolvedCount.textContent = resolvedCount;
};

const renderAdminTicketsPage = () => {
  if (!adminTicketsTableBody) return;

  const totalPages = Math.max(1, Math.ceil(filteredAdminTickets.length / ADMIN_TICKETS_PER_PAGE));
  if (adminTicketsCurrentPage > totalPages) adminTicketsCurrentPage = totalPages;

  const start = (adminTicketsCurrentPage - 1) * ADMIN_TICKETS_PER_PAGE;
  const end = start + ADMIN_TICKETS_PER_PAGE;
  const currentTickets = filteredAdminTickets.slice(start, end);

  adminTicketsTableBody.innerHTML = "";

  currentTickets.forEach((ticket) => {
    const tr = document.createElement("tr");

    tr.innerHTML = `
      <td>#${ticket._id.slice(-6).toUpperCase()}</td>
      <td>${ticket.user ? `${ticket.user.firstName} ${ticket.user.lastName}` : "-"}</td>
      <td>${ticket.subject}</td>
      <td>${ticket.category}</td>
      <td><span class="status ${getStatusClass(ticket.status)}">${ticket.status}</span></td>
      <td><span class="priority ${formatPriority(ticket.priority)}">${ticket.priority}</span></td>
      <td>
        <select class="ticket-status-select" data-id="${ticket._id}">
          <option value="open" ${ticket.status === "open" ? "selected" : ""}>Open</option>
          <option value="review" ${ticket.status === "review" ? "selected" : ""}>Review</option>
          <option value="resolved" ${ticket.status === "resolved" ? "selected" : ""}>Resolved</option>
        </select>
      </td>
    `;

    adminTicketsTableBody.appendChild(tr);
  });

  if (adminTicketsPageInfo) {
    adminTicketsPageInfo.textContent = `Page ${adminTicketsCurrentPage} of ${totalPages}`;
  }

  if (adminTicketsPrevBtn) {
    adminTicketsPrevBtn.disabled = adminTicketsCurrentPage === 1;
  }

  if (adminTicketsNextBtn) {
    adminTicketsNextBtn.disabled = adminTicketsCurrentPage === totalPages;
  }

  if (adminTicketsEmptyMessage) {
    adminTicketsEmptyMessage.style.display = filteredAdminTickets.length === 0 ? "block" : "none";
  }

  if (adminTicketsPagination) {
    adminTicketsPagination.style.display = filteredAdminTickets.length === 0 ? "none" : "flex";
  }

  bindStatusChangeEvents();
};

const filterAdminTickets = () => {
  const searchValue = (adminTicketSearchInput?.value || "").toLowerCase().trim();
  const statusValue = adminTicketStatusFilter?.value || "all";

  filteredAdminTickets = allAdminTickets.filter((ticket) => {
    const text = `${ticket.subject} ${ticket.category} ${ticket.user?.firstName || ""} ${ticket.user?.lastName || ""}`.toLowerCase();
    const matchesSearch = text.includes(searchValue);
    const matchesStatus = statusValue === "all" || ticket.status === statusValue;
    return matchesSearch && matchesStatus;
  });

  adminTicketsCurrentPage = 1;
  renderAdminTicketsPage();
};

const fetchAdminTickets = async () => {
  if (!token) return;

  if (adminTicketsTableBody) {
    adminTicketsTableBody.innerHTML = `
      <tr>
        <td colspan="7" style="text-align:center; color: var(--muted);">Loading tickets...</td>
      </tr>
    `;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/api/tickets/admin/all`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Failed to fetch tickets");
    }

    allAdminTickets = data.tickets || [];
    filteredAdminTickets = [...allAdminTickets];
    renderCounts();
    renderAdminTicketsPage();
  } catch (error) {
    if (adminTicketsTableBody) {
      adminTicketsTableBody.innerHTML = `
        <tr>
          <td colspan="7" style="text-align:center; color: #ef4444;">${error.message || "Could not load tickets."}</td>
        </tr>
      `;
    }
    if (adminTicketsPagination) {
      adminTicketsPagination.style.display = "none";
    }
  }
};

const updateTicketStatus = async (ticketId, status) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/tickets/${ticketId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ status })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Failed to update ticket");
    }

    if (typeof showToast === "function") {
      showToast("success", "Ticket updated", "Ticket status updated successfully.");
    }

    await fetchAdminTickets();
  } catch (error) {
    if (typeof showToast === "function") {
      showToast("error", "Update failed", error.message || "Could not update ticket.");
    }
  }
};

const bindStatusChangeEvents = () => {
  document.querySelectorAll(".ticket-status-select").forEach((select) => {
    select.addEventListener("change", () => {
      const ticketId = select.dataset.id;
      const status = select.value;
      updateTicketStatus(ticketId, status);
    });
  });
};

adminTicketSearchInput?.addEventListener("input", filterAdminTickets);
adminTicketStatusFilter?.addEventListener("change", filterAdminTickets);

adminTicketsPrevBtn?.addEventListener("click", () => {
  if (adminTicketsCurrentPage > 1) {
    adminTicketsCurrentPage--;
    renderAdminTicketsPage();
  }
});

adminTicketsNextBtn?.addEventListener("click", () => {
  const totalPages = Math.ceil(filteredAdminTickets.length / ADMIN_TICKETS_PER_PAGE);
  if (adminTicketsCurrentPage < totalPages) {
    adminTicketsCurrentPage++;
    renderAdminTicketsPage();
  }
});

refreshTicketsBtn?.addEventListener("click", fetchAdminTickets);

fetchAdminTickets();