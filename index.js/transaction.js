const API_BASE_URL = "http://localhost:5000";
const token = localStorage.getItem("token");

const transactionSearchInput = document.getElementById("transactionSearchInput");
const transactionTypeFilter = document.getElementById("transactionTypeFilter");
const transactionStatusFilter = document.getElementById("transactionStatusFilter");
const transactionsTableBody = document.getElementById("transactionsTableBody");
const transactionsEmptyMessage = document.getElementById("transactionsEmptyMessage");
const transactionsPrevBtn = document.getElementById("transactionsPrevBtn");
const transactionsNextBtn = document.getElementById("transactionsNextBtn");
const transactionsPageInfo = document.getElementById("transactionsPageInfo");
const transactionsPagination = document.getElementById("transactionsPagination");

const TRANSACTIONS_PER_PAGE = 6;
let transactionsCurrentPage = 1;
let allTransactions = [];
let filteredTransactions = [];

const formatPrice = (value) => `$${Number(value || 0).toFixed(2)}`;

const formatDate = (dateString) => {
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
  if (type === "credit" || type === "refund") return "positive";
  return "negative";
};

const getAmountPrefix = (type) => {
  if (type === "credit" || type === "refund") return "+";
  return "-";
};

const renderTransactionsPage = () => {
  if (!transactionsTableBody) return;

  const totalPages = Math.max(
    1,
    Math.ceil(filteredTransactions.length / TRANSACTIONS_PER_PAGE)
  );

  if (transactionsCurrentPage > totalPages) {
    transactionsCurrentPage = totalPages;
  }

  const start = (transactionsCurrentPage - 1) * TRANSACTIONS_PER_PAGE;
  const end = start + TRANSACTIONS_PER_PAGE;
  const currentTransactions = filteredTransactions.slice(start, end);

  transactionsTableBody.innerHTML = "";

  currentTransactions.forEach((transaction) => {
    const tr = document.createElement("tr");
    tr.dataset.type = transaction.type;
    tr.dataset.status = transaction.status;

    tr.innerHTML = `
      <td>${transaction.reference}</td>
      <td>${transaction.type}</td>
      <td>${transaction.description || "-"}</td>
      <td><span class="status ${getStatusClass(transaction.status)}">${transaction.status}</span></td>
      <td class="amount ${getAmountClass(transaction.type)}">${getAmountPrefix(transaction.type)}${formatPrice(transaction.amount)}</td>
      <td>${formatDate(transaction.createdAt)}</td>
    `;

    transactionsTableBody.appendChild(tr);
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
    transactionsEmptyMessage.style.display =
      filteredTransactions.length === 0 ? "block" : "none";
  }

  if (transactionsPagination) {
    transactionsPagination.style.display =
      filteredTransactions.length === 0 ? "none" : "flex";
  }
};

const filterTransactions = () => {
  const searchValue = (transactionSearchInput?.value || "").toLowerCase().trim();
  const typeValue = transactionTypeFilter?.value || "all";
  const statusValue = transactionStatusFilter?.value || "all";

  filteredTransactions = allTransactions.filter((transaction) => {
    const reference = (transaction.reference || "").toLowerCase();
    const description = (transaction.description || "").toLowerCase();
    const type = transaction.type || "";
    const status = transaction.status || "";

    const matchesSearch =
      reference.includes(searchValue) || description.includes(searchValue);

    const matchesType = typeValue === "all" || type === typeValue;
    const matchesStatus = statusValue === "all" || status === statusValue;

    return matchesSearch && matchesType && matchesStatus;
  });

  transactionsCurrentPage = 1;
  renderTransactionsPage();
};

const fetchTransactions = async () => {
  if (!token) {
    if (transactionsEmptyMessage) {
      transactionsEmptyMessage.textContent =
        "Please sign in to view your transactions.";
      transactionsEmptyMessage.style.display = "block";
    }
    if (transactionsPagination) {
      transactionsPagination.style.display = "none";
    }
    return;
  }

  if (transactionsTableBody) {
    transactionsTableBody.innerHTML = `
      <tr>
        <td colspan="6" style="text-align:center; color: var(--muted);">Loading transactions...</td>
      </tr>
    `;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/api/transactions`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Failed to fetch transactions");
    }

    allTransactions = data.transactions || [];
    filteredTransactions = [...allTransactions];
    renderTransactionsPage();
  } catch (error) {
    if (transactionsTableBody) {
      transactionsTableBody.innerHTML = `
        <tr>
          <td colspan="6" style="text-align:center; color: #ef4444;">${error.message || "Could not load transactions."}</td>
        </tr>
      `;
    }
    if (transactionsPagination) {
      transactionsPagination.style.display = "none";
    }
  }
};

if (transactionSearchInput) {
  transactionSearchInput.addEventListener("input", filterTransactions);
}

if (transactionTypeFilter) {
  transactionTypeFilter.addEventListener("change", filterTransactions);
}

if (transactionStatusFilter) {
  transactionStatusFilter.addEventListener("change", filterTransactions);
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
    const totalPages = Math.ceil(
      filteredTransactions.length / TRANSACTIONS_PER_PAGE
    );
    if (transactionsCurrentPage < totalPages) {
      transactionsCurrentPage++;
      renderTransactionsPage();
    }
  });
}

fetchTransactions();