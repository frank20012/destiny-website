const adminUserSearchInput = document.getElementById("adminUserSearchInput");
const adminUserStatusFilter = document.getElementById("adminUserStatusFilter");
const adminUserRows = Array.from(document.querySelectorAll("#adminUsersTableBody tr"));
const adminUsersEmptyMessage = document.getElementById("adminUsersEmptyMessage");
const adminUsersPrevBtn = document.getElementById("adminUsersPrevBtn");
const adminUsersNextBtn = document.getElementById("adminUsersNextBtn");
const adminUsersPageInfo = document.getElementById("adminUsersPageInfo");
const adminUsersPagination = document.getElementById("adminUsersPagination");

const ADMIN_USERS_PER_PAGE = 4;
let adminUsersCurrentPage = 1;
let filteredAdminUserRows = [...adminUserRows];

function renderAdminUsersPage() {
  const totalPages = Math.max(1, Math.ceil(filteredAdminUserRows.length / ADMIN_USERS_PER_PAGE));
  if (adminUsersCurrentPage > totalPages) adminUsersCurrentPage = totalPages;

  const start = (adminUsersCurrentPage - 1) * ADMIN_USERS_PER_PAGE;
  const end = start + ADMIN_USERS_PER_PAGE;

  adminUserRows.forEach((row) => (row.style.display = "none"));
  filteredAdminUserRows.slice(start, end).forEach((row) => (row.style.display = ""));

  adminUsersPageInfo.textContent = `Page ${adminUsersCurrentPage} of ${totalPages}`;
  adminUsersPrevBtn.disabled = adminUsersCurrentPage === 1;
  adminUsersNextBtn.disabled = adminUsersCurrentPage === totalPages;
  adminUsersEmptyMessage.style.display = filteredAdminUserRows.length === 0 ? "block" : "none";
  adminUsersPagination.style.display = filteredAdminUserRows.length === 0 ? "none" : "flex";
}

function filterAdminUsers() {
  const searchValue = (adminUserSearchInput?.value || "").toLowerCase().trim();
  const statusValue = adminUserStatusFilter?.value || "all";

  filteredAdminUserRows = adminUserRows.filter((row) => {
    const rowText = row.textContent.toLowerCase();
    const rowStatus = row.dataset.status || "";
    return rowText.includes(searchValue) && (statusValue === "all" || rowStatus === statusValue);
  });

  adminUsersCurrentPage = 1;
  renderAdminUsersPage();
}

adminUserSearchInput?.addEventListener("input", filterAdminUsers);
adminUserStatusFilter?.addEventListener("change", filterAdminUsers);
adminUsersPrevBtn?.addEventListener("click", () => {
  if (adminUsersCurrentPage > 1) {
    adminUsersCurrentPage--;
    renderAdminUsersPage();
  }
});
adminUsersNextBtn?.addEventListener("click", () => {
  const totalPages = Math.ceil(filteredAdminUserRows.length / ADMIN_USERS_PER_PAGE);
  if (adminUsersCurrentPage < totalPages) {
    adminUsersCurrentPage++;
    renderAdminUsersPage();
  }
});

filterAdminUsers();