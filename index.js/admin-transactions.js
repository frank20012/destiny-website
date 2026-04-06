const API_BASE_URL = CONFIG.API_BASE_URL;
import { getStoredToken, getStoredUser } from "./auth-storage.js";

const token = getStoredToken();
const user = getStoredUser();

const adminTransactionSearchInput = document.getElementById("adminTransactionSearchInput");
const adminTransactionTypeFilter = document.getElementById("adminTransactionTypeFilter");
const adminTransactionStatusFilter = document.getElementById("adminTransactionStatusFilter");
const adminTransactionsTableBody = document.getElementById("adminTransactionsTableBody");
const adminTransactionsEmptyMessage = document.getElementById("adminTransactionsEmptyMessage");
const adminTransactionsPrevBtn = document.getElementById("adminTransactionsPrevBtn");
const adminTransactionsNextBtn = document.getElementById("adminTransactionsNextBtn");
const adminTransactionsPageInfo = document.getElementById("adminTransactionsPageInfo");
const adminTransactionsPagination = document.getElementById("adminTransactionsPagination");
const refreshTransactionsBtn = document.getElementById("refreshTransactionsBtn");

const transactionsTotalCount = document.getElementById("transactionsTotalCount");
const transactionsCreditAmount = document.getElementById("transactionsCreditAmount");
const transactionsDebitAmount = document.getElementById("transactionsDebitAmount");
const transactionsRefundAmount = document.getElementById("transactionsRefundAmount");

const ADMIN_TRANSACTIONS_PER_PAGE = 6;
let adminTransactionsCurrentPage = 1;
let allAdminTransactions = [];
let filteredAdminTransactions = [];

const formatPrice = (value) => `$${Number(value || 0).toFixed(2)}`;

const formatDate = (dateString) => {
  if (!dateString) return "-";
  const date = new Date(dateString);
  return date.toLocaleDateString();
};

const getStatusClass = (status) => {
  const map = {
    completed: "completed",
    pending: "pending",
    failed: "cancelled"
  };
  return map[status] || "pending";
};

const getAmountClass = (type) => {
  return type === "credit" || type === "refund" ? "positive" : "negative";
};

const getAmountPrefix = (type) => {
  return type === "credit" || type === "refund" ? "+" : "-";
};

const renderCounts = () => {
  let creditTotal = 0;
  let debitTotal = 0;
  let refundTotal = 0;

  allAdminTransactions.forEach((transaction) => {
    if (transaction.type === "credit" && transaction.status === "completed") {
      creditTotal += Number(transaction.amount || 0);
    }

    if (transaction.type === "debit" && transaction.status === "completed") {
      debitTotal += Number(transaction.amount || 0);
    }

    if (transaction.type === "refund" && transaction.status === "completed") {
      refundTotal += Number(transaction.amount || 0);
    }
  });

  if (transactionsTotalCount) transactionsTotalCount.textContent = allAdminTransactions.length;
  if (transactionsCreditAmount) transactionsCreditAmount.textContent = formatPrice(creditTotal);
  if (transactionsDebitAmount) transactionsDebitAmount.textContent = formatPrice(debitTotal);
  if (transactionsRefundAmount) transactionsRefundAmount.textContent = formatPrice(refundTotal);
};

const renderAdminTransactionsPage = () => {
  if (!adminTransactionsTableBody) return;

  const totalPages = Math.max(1, Math.ceil(filteredAdminTransactions.length / ADMIN_TRANSACTIONS_PER_PAGE));
  if (adminTransactionsCurrentPage > totalPages) {
    adminTransactionsCurrentPage = totalPages;
  }

  const start = (adminTransactionsCurrentPage - 1) * ADMIN_TRANSACTIONS_PER_PAGE;
  const end = start + ADMIN_TRANSACTIONS_PER_PAGE;
  const currentTransactions = filteredAdminTransactions.slice(start, end);

  adminTransactionsTableBody.innerHTML = "";

  currentTransactions.forEach((transaction) => {
    const tr = document.createElement("tr");

    tr.innerHTML = `
      <td>${transaction.reference || "-"}</td>
      <td>${transaction.user ? `${transaction.user.firstName || ""} ${transaction.user.lastName || ""}`.trim() : "-"}</td>
      <td>${transaction.type || "-"}</td>
      <td>${transaction.description || "-"}</td>
      <td><span class="status ${getStatusClass(transaction.status)}">${transaction.status || "-"}</span></td>
      <td class="amount ${getAmountClass(transaction.type)}">${getAmountPrefix(transaction.type)}${formatPrice(transaction.amount)}</td>
      <td>${formatDate(transaction.createdAt)}</td>
    `;

    adminTransactionsTableBody.appendChild(tr);
  });

  if (adminTransactionsPageInfo) {
    adminTransactionsPageInfo.textContent = `Page ${adminTransactionsCurrentPage} of ${totalPages}`;
  }

  if (adminTransactionsPrevBtn) {
    adminTransactionsPrevBtn.disabled = adminTransactionsCurrentPage === 1;
  }

  if (adminTransactionsNextBtn) {
    adminTransactionsNextBtn.disabled = adminTransactionsCurrentPage === totalPages;
  }

  if (adminTransactionsEmptyMessage) {
    adminTransactionsEmptyMessage.style.display = filteredAdminTransactions.length === 0 ? "block" : "none";
  }

  if (adminTransactionsPagination) {
    adminTransactionsPagination.style.display = filteredAdminTransactions.length === 0 ? "none" : "flex";
  }
};

const filterAdminTransactions = () => {
  const searchValue = (adminTransactionSearchInput?.value || "").toLowerCase().trim();
  const typeValue = adminTransactionTypeFilter?.value || "all";
  const statusValue = adminTransactionStatusFilter?.value || "all";

  filteredAdminTransactions = allAdminTransactions.filter((transaction) => {
    const text = `${transaction.reference || ""} ${transaction.description || ""} ${transaction.user?.firstName || ""} ${transaction.user?.lastName || ""}`.toLowerCase();
    const matchesSearch = text.includes(searchValue);
    const matchesType = typeValue === "all" || transaction.type === typeValue;
    const matchesStatus = statusValue === "all" || transaction.status === statusValue;
    return matchesSearch && matchesType && matchesStatus;
  });

  adminTransactionsCurrentPage = 1;
  renderAdminTransactionsPage();
};

const fetchAdminTransactions = async () => {
  if (!token) return;

  if (adminTransactionsTableBody) {
    adminTransactionsTableBody.innerHTML = `
      <tr>
        <td colspan="7" style="text-align:center; color: var(--muted);">Loading transactions...</td>
      </tr>
    `;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/api/transactions/admin`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Failed to fetch transactions");
    }

    allAdminTransactions = data.transactions || [];
    filteredAdminTransactions = [...allAdminTransactions];
    renderCounts();
    renderAdminTransactionsPage();
  } catch (error) {
    if (adminTransactionsTableBody) {
      adminTransactionsTableBody.innerHTML = `
        <tr>
          <td colspan="7" style="text-align:center; color: #ef4444;">${error.message || "Could not load transactions."}</td>
        </tr>
      `;
    }

    if (adminTransactionsPagination) {
      adminTransactionsPagination.style.display = "none";
    }

    if (typeof showToast === "function") {
      showToast("error", "Load failed", error.message || "Could not load transactions.");
    }
  }
};

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
  const totalPages = Math.ceil(filteredAdminTransactions.length / ADMIN_TRANSACTIONS_PER_PAGE);
  if (adminTransactionsCurrentPage < totalPages) {
    adminTransactionsCurrentPage++;
    renderAdminTransactionsPage();
  }
});

refreshTransactionsBtn?.addEventListener("click", fetchAdminTransactions);

fetchAdminTransactions();