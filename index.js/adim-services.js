const adminServiceSearchInput = document.getElementById("adminServiceSearchInput");
const adminServiceCategoryFilter = document.getElementById("adminServiceCategoryFilter");
const adminServiceStatusFilter = document.getElementById("adminServiceStatusFilter");
const adminServiceRows = Array.from(document.querySelectorAll("#adminServicesTableBody tr"));
const adminServicesEmptyMessage = document.getElementById("adminServicesEmptyMessage");
const adminServicesPrevBtn = document.getElementById("adminServicesPrevBtn");
const adminServicesNextBtn = document.getElementById("adminServicesNextBtn");
const adminServicesPageInfo = document.getElementById("adminServicesPageInfo");
const adminServicesPagination = document.getElementById("adminServicesPagination");
const openAddServiceModalBtn = document.getElementById("openAddServiceModalBtn");

const ADMIN_SERVICES_PER_PAGE = 4;
let adminServicesCurrentPage = 1;
let filteredAdminServiceRows = [...adminServiceRows];

function renderAdminServicesPage() {
  const totalPages = Math.max(1, Math.ceil(filteredAdminServiceRows.length / ADMIN_SERVICES_PER_PAGE));
  if (adminServicesCurrentPage > totalPages) adminServicesCurrentPage = totalPages;

  const start = (adminServicesCurrentPage - 1) * ADMIN_SERVICES_PER_PAGE;
  const end = start + ADMIN_SERVICES_PER_PAGE;

  adminServiceRows.forEach((row) => (row.style.display = "none"));
  filteredAdminServiceRows.slice(start, end).forEach((row) => (row.style.display = ""));

  if (adminServicesPageInfo) {
    adminServicesPageInfo.textContent = `Page ${adminServicesCurrentPage} of ${totalPages}`;
  }

  if (adminServicesPrevBtn) {
    adminServicesPrevBtn.disabled = adminServicesCurrentPage === 1;
  }

  if (adminServicesNextBtn) {
    adminServicesNextBtn.disabled = adminServicesCurrentPage === totalPages;
  }

  if (adminServicesEmptyMessage) {
    adminServicesEmptyMessage.style.display = filteredAdminServiceRows.length === 0 ? "block" : "none";
  }

  if (adminServicesPagination) {
    adminServicesPagination.style.display = filteredAdminServiceRows.length === 0 ? "none" : "flex";
  }
}

function filterAdminServices() {
  const searchValue = (adminServiceSearchInput?.value || "").toLowerCase().trim();
  const categoryValue = adminServiceCategoryFilter?.value || "all";
  const statusValue = adminServiceStatusFilter?.value || "all";

  filteredAdminServiceRows = adminServiceRows.filter((row) => {
    const rowText = row.textContent.toLowerCase();
    const rowCategory = row.dataset.category || "";
    const rowStatus = row.dataset.status || "";

    const matchesSearch = rowText.includes(searchValue);
    const matchesCategory = categoryValue === "all" || rowCategory === categoryValue;
    const matchesStatus = statusValue === "all" || rowStatus === statusValue;

    return matchesSearch && matchesCategory && matchesStatus;
  });

  adminServicesCurrentPage = 1;
  renderAdminServicesPage();
}

adminServiceSearchInput?.addEventListener("input", filterAdminServices);
adminServiceCategoryFilter?.addEventListener("change", filterAdminServices);
adminServiceStatusFilter?.addEventListener("change", filterAdminServices);

adminServicesPrevBtn?.addEventListener("click", () => {
  if (adminServicesCurrentPage > 1) {
    adminServicesCurrentPage--;
    renderAdminServicesPage();
  }
});

adminServicesNextBtn?.addEventListener("click", () => {
  const totalPages = Math.ceil(filteredAdminServiceRows.length / ADMIN_SERVICES_PER_PAGE);
  if (adminServicesCurrentPage < totalPages) {
    adminServicesCurrentPage++;
    renderAdminServicesPage();
  }
});

openAddServiceModalBtn?.addEventListener("click", () => {
  showToast("info", "Add service", "Service creation form can be connected here later.");
});

filterAdminServices();