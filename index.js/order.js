const orderSearchInput = document.getElementById("orderSearchInput");
const orderStatusFilter = document.getElementById("orderStatusFilter");
const orderRows = Array.from(document.querySelectorAll("#ordersTableBody tr"));
const ordersEmptyMessage = document.getElementById("ordersEmptyMessage");
const ordersPrevBtn = document.getElementById("ordersPrevBtn");
const ordersNextBtn = document.getElementById("ordersNextBtn");
const ordersPageInfo = document.getElementById("ordersPageInfo");
const ordersPagination = document.getElementById("ordersPagination");

const ORDERS_PER_PAGE = 4;
let ordersCurrentPage = 1;
let filteredOrderRows = [...orderRows];

function renderOrdersPage() {
  const totalPages = Math.max(1, Math.ceil(filteredOrderRows.length / ORDERS_PER_PAGE));
  if (ordersCurrentPage > totalPages) ordersCurrentPage = totalPages;

  const start = (ordersCurrentPage - 1) * ORDERS_PER_PAGE;
  const end = start + ORDERS_PER_PAGE;

  orderRows.forEach((row) => {
    row.style.display = "none";
  });

  filteredOrderRows.slice(start, end).forEach((row) => {
    row.style.display = "";
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
    ordersEmptyMessage.style.display = filteredOrderRows.length === 0 ? "block" : "none";
  }

  if (ordersPagination) {
    ordersPagination.style.display = filteredOrderRows.length === 0 ? "none" : "flex";
  }
}

function filterOrders() {
  const searchValue = (orderSearchInput?.value || "").toLowerCase().trim();
  const statusValue = orderStatusFilter?.value || "all";

  filteredOrderRows = orderRows.filter((row) => {
    const rowText = row.textContent.toLowerCase();
    const rowStatus = row.dataset.status || "";

    const matchesSearch = rowText.includes(searchValue);
    const matchesStatus = statusValue === "all" || rowStatus === statusValue;

    return matchesSearch && matchesStatus;
  });

  ordersCurrentPage = 1;
  renderOrdersPage();
  return filteredOrderRows.length;
}

if (orderSearchInput) {
  orderSearchInput.addEventListener("input", filterOrders);
}

if (orderStatusFilter) {
  orderStatusFilter.addEventListener("change", () => {
    const count = filterOrders();
    showToast("info", "Orders filtered", `${count} matching order(s) found.`);
  });
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
    const totalPages = Math.ceil(filteredOrderRows.length / ORDERS_PER_PAGE);
    if (ordersCurrentPage < totalPages) {
      ordersCurrentPage++;
      renderOrdersPage();
    }
  });
}

filterOrders();