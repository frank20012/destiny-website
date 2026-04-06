const API_BASE_URL = CONFIG.API_BASE_URL;
import { getStoredToken, getStoredUser } from "./auth-storage.js";


const token = getStoredToken();
const user = getStoredUser();

const adminNumberSearchInput = document.getElementById("adminNumberSearchInput");
const adminNumberTypeFilter = document.getElementById("adminNumberTypeFilter");
const adminNumberStatusFilter = document.getElementById("adminNumberStatusFilter");
const adminNumbersTableBody = document.getElementById("adminNumbersTableBody");
const adminNumbersEmptyMessage = document.getElementById("adminNumbersEmptyMessage");
const adminNumbersPrevBtn = document.getElementById("adminNumbersPrevBtn");
const adminNumbersNextBtn = document.getElementById("adminNumbersNextBtn");
const adminNumbersPageInfo = document.getElementById("adminNumbersPageInfo");
const adminNumbersPagination = document.getElementById("adminNumbersPagination");

const openAddNumberFormBtn = document.getElementById("openAddNumberFormBtn");
const closeAddNumberFormBtn = document.getElementById("closeAddNumberFormBtn");
const cancelAddNumberFormBtn = document.getElementById("cancelAddNumberFormBtn");
const adminNumberFormCard = document.getElementById("adminNumberFormCard");
const adminNumberForm = document.getElementById("adminNumberForm");
const adminNumberMessage = document.getElementById("adminNumberMessage");

const adminNumberCountry = document.getElementById("adminNumberCountry");
const adminNumberValue = document.getElementById("adminNumberValue");
const adminNumberProvider = document.getElementById("adminNumberProvider");
const adminNumberServiceType = document.getElementById("adminNumberServiceType");
const adminNumberStatus = document.getElementById("adminNumberStatus");

const numbersTotalCount = document.getElementById("numbersTotalCount");
const numbersAvailableCount = document.getElementById("numbersAvailableCount");
const numbersAssignedCount = document.getElementById("numbersAssignedCount");
const numbersClosedCount = document.getElementById("numbersClosedCount");

const ADMIN_NUMBERS_PER_PAGE = 6;
let adminNumbersCurrentPage = 1;
let allAdminNumbers = [];
let filteredAdminNumbers = [];

const showMessage = (text, type = "error") => {
  if (!adminNumberMessage) return;
  adminNumberMessage.textContent = text;
  adminNumberMessage.className = `form-message ${type}`;
};

const clearMessage = () => {
  if (!adminNumberMessage) return;
  adminNumberMessage.textContent = "";
  adminNumberMessage.className = "form-message";
};

const getStatusClass = (status) => {
  const map = {
    available: "completed",
    assigned: "processing",
    used: "pending",
    disabled: "cancelled"
  };
  return map[status] || "pending";
};

const renderCounts = () => {
  const availableCount = allAdminNumbers.filter((n) => n.status === "available").length;
  const assignedCount = allAdminNumbers.filter((n) => n.status === "assigned").length;
  const closedCount = allAdminNumbers.filter((n) => n.status === "used" || n.status === "disabled").length;

  if (numbersTotalCount) numbersTotalCount.textContent = allAdminNumbers.length;
  if (numbersAvailableCount) numbersAvailableCount.textContent = availableCount;
  if (numbersAssignedCount) numbersAssignedCount.textContent = assignedCount;
  if (numbersClosedCount) numbersClosedCount.textContent = closedCount;
};

const renderAdminNumbersPage = () => {
  if (!adminNumbersTableBody) return;

  const totalPages = Math.max(1, Math.ceil(filteredAdminNumbers.length / ADMIN_NUMBERS_PER_PAGE));
  if (adminNumbersCurrentPage > totalPages) adminNumbersCurrentPage = totalPages;

  const start = (adminNumbersCurrentPage - 1) * ADMIN_NUMBERS_PER_PAGE;
  const end = start + ADMIN_NUMBERS_PER_PAGE;
  const currentNumbers = filteredAdminNumbers.slice(start, end);

  adminNumbersTableBody.innerHTML = "";

  currentNumbers.forEach((numberItem) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>#${numberItem._id.slice(-6).toUpperCase()}</td>
      <td>${numberItem.country}</td>
      <td>${numberItem.number}</td>
      <td>${numberItem.provider || "-"}</td>
      <td>${numberItem.serviceType}</td>
      <td><span class="status ${getStatusClass(numberItem.status)}">${numberItem.status}</span></td>
    `;
    adminNumbersTableBody.appendChild(tr);
  });

  if (adminNumbersPageInfo) {
    adminNumbersPageInfo.textContent = `Page ${adminNumbersCurrentPage} of ${totalPages}`;
  }

  if (adminNumbersPrevBtn) adminNumbersPrevBtn.disabled = adminNumbersCurrentPage === 1;
  if (adminNumbersNextBtn) adminNumbersNextBtn.disabled = adminNumbersCurrentPage === totalPages;

  if (adminNumbersEmptyMessage) {
    adminNumbersEmptyMessage.style.display = filteredAdminNumbers.length === 0 ? "block" : "none";
  }

  if (adminNumbersPagination) {
    adminNumbersPagination.style.display = filteredAdminNumbers.length === 0 ? "none" : "flex";
  }
};

const filterAdminNumbers = () => {
  const searchValue = (adminNumberSearchInput?.value || "").toLowerCase().trim();
  const typeValue = adminNumberTypeFilter?.value || "all";
  const statusValue = adminNumberStatusFilter?.value || "all";

  filteredAdminNumbers = allAdminNumbers.filter((numberItem) => {
    const text = `${numberItem.country} ${numberItem.number} ${numberItem.provider || ""}`.toLowerCase();
    const matchesSearch = text.includes(searchValue);
    const matchesType = typeValue === "all" || numberItem.serviceType === typeValue;
    const matchesStatus = statusValue === "all" || numberItem.status === statusValue;
    return matchesSearch && matchesType && matchesStatus;
  });

  adminNumbersCurrentPage = 1;
  renderAdminNumbersPage();
};

const fetchAdminNumbers = async () => {
  if (!token) return;

  if (adminNumbersTableBody) {
    adminNumbersTableBody.innerHTML = `
      <tr>
        <td colspan="6" style="text-align:center; color: var(--muted);">Loading numbers...</td>
      </tr>
    `;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/api/numbers`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Failed to fetch numbers");
    }

    allAdminNumbers = data.numbers || [];
    filteredAdminNumbers = [...allAdminNumbers];
    renderCounts();
    renderAdminNumbersPage();
  } catch (error) {
    if (adminNumbersTableBody) {
      adminNumbersTableBody.innerHTML = `
        <tr>
          <td colspan="6" style="text-align:center; color: #ef4444;">${error.message || "Could not load numbers."}</td>
        </tr>
      `;
    }
    if (adminNumbersPagination) {
      adminNumbersPagination.style.display = "none";
    }
  }
};

const openForm = () => {
  if (adminNumberFormCard) adminNumberFormCard.style.display = "block";
};

const closeForm = () => {
  if (adminNumberFormCard) adminNumberFormCard.style.display = "none";
  clearMessage();
};

openAddNumberFormBtn?.addEventListener("click", openForm);
closeAddNumberFormBtn?.addEventListener("click", closeForm);
cancelAddNumberFormBtn?.addEventListener("click", closeForm);

if (adminNumberForm) {
  adminNumberForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    clearMessage();

    const payload = {
      country: adminNumberCountry?.value.trim(),
      number: adminNumberValue?.value.trim(),
      provider: adminNumberProvider?.value.trim() || "internal",
      serviceType: adminNumberServiceType?.value,
      status: adminNumberStatus?.value
    };

    if (!payload.country || !payload.number) {
      showMessage("Country and number are required.");
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/numbers`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to create number");
      }

      showMessage("Number created successfully.", "success");
      adminNumberForm.reset();
      await fetchAdminNumbers();

      if (typeof showToast === "function") {
        showToast("success", "Number created", "New number added to inventory.");
      }

      setTimeout(() => {
        closeForm();
      }, 800);
    } catch (error) {
      showMessage(error.message || "Something went wrong.");
    }
  });
}

adminNumberSearchInput?.addEventListener("input", filterAdminNumbers);
adminNumberTypeFilter?.addEventListener("change", filterAdminNumbers);
adminNumberStatusFilter?.addEventListener("change", filterAdminNumbers);

adminNumbersPrevBtn?.addEventListener("click", () => {
  if (adminNumbersCurrentPage > 1) {
    adminNumbersCurrentPage--;
    renderAdminNumbersPage();
  }
});

adminNumbersNextBtn?.addEventListener("click", () => {
  const totalPages = Math.ceil(filteredAdminNumbers.length / ADMIN_NUMBERS_PER_PAGE);
  if (adminNumbersCurrentPage < totalPages) {
    adminNumbersCurrentPage++;
    renderAdminNumbersPage();
  }
});

fetchAdminNumbers();