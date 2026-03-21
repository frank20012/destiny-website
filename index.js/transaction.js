const transactionSearchInput = document.getElementById("transactionSearchInput");
const transactionTypeFilter = document.getElementById("transactionTypeFilter");
const transactionStatusFilter = document.getElementById("transactionStatusFilter");
const transactionRows = Array.from(document.querySelectorAll("#transactionsTableBody tr"));
const transactionsEmptyMessage = document.getElementById("transactionsEmptyMessage");
const transactionsPrevBtn = document.getElementById("transactionsPrevBtn");
const transactionsNextBtn = document.getElementById("transactionsNextBtn");
const transactionsPageInfo = document.getElementById("transactionsPageInfo");
const transactionsPagination = document.getElementById("transactionsPagination");

const TRANSACTIONS_PER_PAGE = 4;
let transactionsCurrentPage = 1;
let filteredTransactionRows = [...transactionRows];

function renderTransactionsPage() {
  const totalPages = Math.max(1, Math.ceil(filteredTransactionRows.length / TRANSACTIONS_PER_PAGE));
  if (transactionsCurrentPage > totalPages) transactionsCurrentPage = totalPages;

  const start = (transactionsCurrentPage - 1) * TRANSACTIONS_PER_PAGE;
  const end = start + TRANSACTIONS_PER_PAGE;

  transactionRows.forEach((row) => {
    row.style.display = "none";
  });

  filteredTransactionRows.slice(start, end).forEach((row) => {
    row.style.display = "";
  });

  if (transactionsPageInfo) {
    transactionsPageInfo.textContent = `Page ${transactionsCurrentPage} of ${totalPages}`;
  }

  if (transactionsPrevBtn) {
    transactionsPrevBtn.disabled = transactionsCurrentPage === 1;
  }

  if (transactionsNextBtn) {
    transactionsNextBtn.disabled = transactionsCurrentPage === totalPages;
  }

  if (transactionsEmptyMessage) {
    transactionsEmptyMessage.style.display = filteredTransactionRows.length === 0 ? "block" : "none";
  }

  if (transactionsPagination) {
    transactionsPagination.style.display = filteredTransactionRows.length === 0 ? "none" : "flex";
  }
}

function filterTransactions() {
  const searchValue = (transactionSearchInput?.value || "").toLowerCase().trim();
  const typeValue = transactionTypeFilter?.value || "all";
  const statusValue = transactionStatusFilter?.value || "all";

  filteredTransactionRows = transactionRows.filter((row) => {
    const rowText = row.textContent.toLowerCase();
    const rowType = row.dataset.type || "";
    const rowStatus = row.dataset.status || "";

    const matchesSearch = rowText.includes(searchValue);
    const matchesType = typeValue === "all" || rowType === typeValue;
    const matchesStatus = statusValue === "all" || rowStatus === statusValue;

    return matchesSearch && matchesType && matchesStatus;
  });

  transactionsCurrentPage = 1;
  renderTransactionsPage();
  return filteredTransactionRows.length;
}

if (transactionSearchInput) {
  transactionSearchInput.addEventListener("input", filterTransactions);
}

if (transactionTypeFilter) {
  transactionTypeFilter.addEventListener("change", () => {
    const count = filterTransactions();
    showToast("info", "Transactions filtered", `${count} matching transaction(s) found.`);
  });
}

if (transactionStatusFilter) {
  transactionStatusFilter.addEventListener("change", () => {
    const count = filterTransactions();
    showToast("info", "Transactions filtered", `${count} matching transaction(s) found.`);
  });
}

if (transactionsPrevBtn) {
  transactionsPrevBtn.addEventListener("click", () => {
    if (transactionsCurrentPage > 1) {
      transactionsCurrentPage--;
      renderTransactionsPage();
    }
  });
}

if (transactionsNextBtn) {
  transactionsNextBtn.addEventListener("click", () => {
    const totalPages = Math.ceil(filteredTransactionRows.length / TRANSACTIONS_PER_PAGE);
    if (transactionsCurrentPage < totalPages) {
      transactionsCurrentPage++;
      renderTransactionsPage();
    }
  });
}

filterTransactions();