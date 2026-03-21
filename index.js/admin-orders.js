const adminOrderSearchInput = document.getElementById("adminOrderSearchInput");
const adminOrderStatusFilter = document.getElementById("adminOrderStatusFilter");
const adminOrderRows = Array.from(document.querySelectorAll("#adminOrdersTableBody tr"));
const adminOrdersEmptyMessage = document.getElementById("adminOrdersEmptyMessage");
const adminOrdersPrevBtn = document.getElementById("adminOrdersPrevBtn");
const adminOrdersNextBtn = document.getElementById("adminOrdersNextBtn");
const adminOrdersPageInfo = document.getElementById("adminOrdersPageInfo");
const adminOrdersPagination = document.getElementById("adminOrdersPagination");

const ADMIN_ORDERS_PER_PAGE = 4;
let adminOrdersCurrentPage = 1;
let filteredAdminOrderRows = [...adminOrderRows];

function renderAdminOrdersPage() {
  const totalPages = Math.max(1, Math.ceil(filteredAdminOrderRows.length / ADMIN_ORDERS_PER_PAGE));
  if (adminOrdersCurrentPage > totalPages) adminOrdersCurrentPage = totalPages;

  const start = (adminOrdersCurrentPage - 1) * ADMIN_ORDERS_PER_PAGE;
  const end = start + ADMIN_ORDERS_PER_PAGE;

  adminOrderRows.forEach((row) => (row.style.display = "none"));
  filteredAdminOrderRows.slice(start, end).forEach((row) => (row.style.display = ""));

  adminOrdersPageInfo.textContent = `Page ${adminOrdersCurrentPage} of ${totalPages}`;
  adminOrdersPrevBtn.disabled = adminOrdersCurrentPage === 1;
  adminOrdersNextBtn.disabled = adminOrdersCurrentPage === totalPages;
  adminOrdersEmptyMessage.style.display = filteredAdminOrderRows.length === 0 ? "block" : "none";
  adminOrdersPagination.style.display = filteredAdminOrderRows.length === 0 ? "none" : "flex";
}

function filterAdminOrders() {
  const searchValue = (adminOrderSearchInput?.value || "").toLowerCase().trim();
  const statusValue = adminOrderStatusFilter?.value || "all";

  filteredAdminOrderRows = adminOrderRows.filter((row) => {
    const rowText = row.textContent.toLowerCase();
    const rowStatus = row.dataset.status || "";
    return rowText.includes(searchValue) && (statusValue === "all" || rowStatus === statusValue);
  });

  adminOrdersCurrentPage = 1;
  renderAdminOrdersPage();
}

adminOrderSearchInput?.addEventListener("input", filterAdminOrders);
adminOrderStatusFilter?.addEventListener("change", filterAdminOrders);
adminOrdersPrevBtn?.addEventListener("click", () => {
  if (adminOrdersCurrentPage > 1) {
    adminOrdersCurrentPage--;
    renderAdminOrdersPage();
  }
});
adminOrdersNextBtn?.addEventListener("click", () => {
  const totalPages = Math.ceil(filteredAdminOrderRows.length / ADMIN_ORDERS_PER_PAGE);
  if (adminOrdersCurrentPage < totalPages) {
    adminOrdersCurrentPage++;
    renderAdminOrdersPage();
  }
});

filterAdminOrders();