const adminTicketSearchInput = document.getElementById("adminTicketSearchInput");
const adminTicketStatusFilter = document.getElementById("adminTicketStatusFilter");
const adminTicketRows = Array.from(document.querySelectorAll("#adminTicketsTableBody tr"));
const adminTicketsEmptyMessage = document.getElementById("adminTicketsEmptyMessage");
const adminTicketsPrevBtn = document.getElementById("adminTicketsPrevBtn");
const adminTicketsNextBtn = document.getElementById("adminTicketsNextBtn");
const adminTicketsPageInfo = document.getElementById("adminTicketsPageInfo");
const adminTicketsPagination = document.getElementById("adminTicketsPagination");
const exportTicketsBtn = document.getElementById("exportTicketsBtn");

const ADMIN_TICKETS_PER_PAGE = 4;
let adminTicketsCurrentPage = 1;
let filteredAdminTicketRows = [...adminTicketRows];

function renderAdminTicketsPage() {
  const totalPages = Math.max(1, Math.ceil(filteredAdminTicketRows.length / ADMIN_TICKETS_PER_PAGE));
  if (adminTicketsCurrentPage > totalPages) adminTicketsCurrentPage = totalPages;

  const start = (adminTicketsCurrentPage - 1) * ADMIN_TICKETS_PER_PAGE;
  const end = start + ADMIN_TICKETS_PER_PAGE;

  adminTicketRows.forEach((row) => (row.style.display = "none"));
  filteredAdminTicketRows.slice(start, end).forEach((row) => (row.style.display = ""));

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
    adminTicketsEmptyMessage.style.display = filteredAdminTicketRows.length === 0 ? "block" : "none";
  }

  if (adminTicketsPagination) {
    adminTicketsPagination.style.display = filteredAdminTicketRows.length === 0 ? "none" : "flex";
  }
}

function filterAdminTickets() {
  const searchValue = (adminTicketSearchInput?.value || "").toLowerCase().trim();
  const statusValue = adminTicketStatusFilter?.value || "all";

  filteredAdminTicketRows = adminTicketRows.filter((row) => {
    const rowText = row.textContent.toLowerCase();
    const rowStatus = row.dataset.status || "";

    return rowText.includes(searchValue) && (statusValue === "all" || rowStatus === statusValue);
  });

  adminTicketsCurrentPage = 1;
  renderAdminTicketsPage();
}

adminTicketSearchInput?.addEventListener("input", filterAdminTickets);
adminTicketStatusFilter?.addEventListener("change", filterAdminTickets);

adminTicketsPrevBtn?.addEventListener("click", () => {
  if (adminTicketsCurrentPage > 1) {
    adminTicketsCurrentPage--;
    renderAdminTicketsPage();
  }
});

adminTicketsNextBtn?.addEventListener("click", () => {
  const totalPages = Math.ceil(filteredAdminTicketRows.length / ADMIN_TICKETS_PER_PAGE);
  if (adminTicketsCurrentPage < totalPages) {
    adminTicketsCurrentPage++;
    renderAdminTicketsPage();
  }
});

exportTicketsBtn?.addEventListener("click", () => {
  showToast("success", "Tickets exported", "Ticket export started successfully.");
});

filterAdminTickets();