const adminTransactionSearchInput = document.getElementById("adminTransactionSearchInput");
const adminTransactionTypeFilter = document.getElementById("adminTransactionTypeFilter");
const adminTransactionStatusFilter = document.getElementById("adminTransactionStatusFilter");
const adminTransactionRows = Array.from(document.querySelectorAll("#adminTransactionsTableBody tr"));
const adminTransactionsEmptyMessage = document.getElementById("adminTransactionsEmptyMessage");
const adminTransactionsPrevBtn = document.getElementById("adminTransactionsPrevBtn");
const adminTransactionsNextBtn = document.getElementById("adminTransactionsNextBtn");
const adminTransactionsPageInfo = document.getElementById("adminTransactionsPageInfo");
const adminTransactionsPagination = document.getElementById("adminTransactionsPagination");

const ADMIN_TRANSACTIONS_PER_PAGE = 4;
let adminTransactionsCurrentPage = 1;
let filteredAdminTransactionRows = [...adminTransactionRows];

function renderAdminTransactionsPage() {
  const totalPages = Math.max(1, Math.ceil(filteredAdminTransactionRows.length / ADMIN_TRANSACTIONS_PER_PAGE));
  if (adminTransactionsCurrentPage > totalPages) adminTransactionsCurrentPage = totalPages;

  const start = (adminTransactionsCurrentPage - 1) * ADMIN_TRANSACTIONS_PER_PAGE;
  const end = start + ADMIN_TRANSACTIONS_PER_PAGE;

  adminTransactionRows.forEach((row) => (row.style.display = "none"));
  filteredAdminTransactionRows.slice(start, end).forEach((row) => (row.style.display = ""));

  adminTransactionsPageInfo.textContent = `Page ${adminTransactionsCurrentPage} of ${totalPages}`;
  adminTransactionsPrevBtn.disabled = adminTransactionsCurrentPage === 1;
  adminTransactionsNextBtn.disabled = adminTransactionsCurrentPage === totalPages;
  adminTransactionsEmptyMessage.style.display = filteredAdminTransactionRows.length === 0 ? "block" : "none";
  adminTransactionsPagination.style.display = filteredAdminTransactionRows.length === 0 ? "none" : "flex";
}

function filterAdminTransactions() {
  const searchValue = (adminTransactionSearchInput?.value || "").toLowerCase().trim();
  const typeValue = adminTransactionTypeFilter?.value || "all";
  const statusValue = adminTransactionStatusFilter?.value || "all";

  filteredAdminTransactionRows = adminTransactionRows.filter((row) => {
    const rowText = row.textContent.toLowerCase();
    const rowType = row.dataset.type || "";
    const rowStatus = row.dataset.status || "";
    return rowText.includes(searchValue)
      && (typeValue === "all" || rowType === typeValue)
      && (statusValue === "all" || rowStatus === statusValue);
  });

  adminTransactionsCurrentPage = 1;
  renderAdminTransactionsPage();
}

adminTransactionSearchInput?.addEventListener("input", filterAdminTransactions);
adminTransactionTypeFilter?.addEventListener("change", filterAdminTransactions);
adminTransactionStatusFilter?.addEventListener("change", filterAdminTransactions);
adminTransactionsPrevBtn?.addEventListener("click", () => {
  if (adminTransactionsCurrentPage > 1) {
    adminTransactionsCurrentPage--;
    renderAdminTransactionsPage();
  }
});
adminTransactionsNextBtn?.addEventListener("click", () => {
  const totalPages = Math.ceil(filteredAdminTransactionRows.length / ADMIN_TRANSACTIONS_PER_PAGE);
  if (adminTransactionsCurrentPage < totalPages) {
    adminTransactionsCurrentPage++;
    renderAdminTransactionsPage();
  }
});

filterAdminTransactions();