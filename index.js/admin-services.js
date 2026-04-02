const API_BASE_URL = "http://localhost:5000";
const token = localStorage.getItem("token");

const adminServiceSearchInput = document.getElementById("adminServiceSearchInput");
const adminServiceCategoryFilter = document.getElementById("adminServiceCategoryFilter");
const adminServiceStatusFilter = document.getElementById("adminServiceStatusFilter");
const adminServicesTableBody = document.getElementById("adminServicesTableBody");
const adminServicesEmptyMessage = document.getElementById("adminServicesEmptyMessage");
const adminServicesPrevBtn = document.getElementById("adminServicesPrevBtn");
const adminServicesNextBtn = document.getElementById("adminServicesNextBtn");
const adminServicesPageInfo = document.getElementById("adminServicesPageInfo");
const adminServicesPagination = document.getElementById("adminServicesPagination");

const openAddServiceFormBtn = document.getElementById("openAddServiceFormBtn");
const closeAddServiceFormBtn = document.getElementById("closeAddServiceFormBtn");
const cancelAddServiceFormBtn = document.getElementById("cancelAddServiceFormBtn");
const adminServiceFormCard = document.getElementById("adminServiceFormCard");
const adminServiceForm = document.getElementById("adminServiceForm");
const adminServiceMessage = document.getElementById("adminServiceMessage");

const adminServiceName = document.getElementById("adminServiceName");
const adminServiceCode = document.getElementById("adminServiceCode");
const adminServiceCountry = document.getElementById("adminServiceCountry");
const adminServicePrice = document.getElementById("adminServicePrice");
const adminServiceCategory = document.getElementById("adminServiceCategory");
const adminServiceDeliveryType = document.getElementById("adminServiceDeliveryType");
const adminServiceStatus = document.getElementById("adminServiceStatus");
const adminServiceDescription = document.getElementById("adminServiceDescription");

const ADMIN_SERVICES_PER_PAGE = 6;
let adminServicesCurrentPage = 1;
let allAdminServices = [];
let filteredAdminServices = [];

const showMessage = (text, type = "error") => {
  if (!adminServiceMessage) return;
  adminServiceMessage.textContent = text;
  adminServiceMessage.className = `form-message ${type}`;
};

const clearMessage = () => {
  if (!adminServiceMessage) return;
  adminServiceMessage.textContent = "";
  adminServiceMessage.className = "form-message";
};

const formatPrice = (value) => `$${Number(value || 0).toFixed(2)}`;

const getStatusClass = (status) => {
  const map = {
    active: "completed",
    draft: "pending",
    disabled: "cancelled"
  };
  return map[status] || "pending";
};

const renderAdminServicesPage = () => {
  if (!adminServicesTableBody) return;

  const totalPages = Math.max(1, Math.ceil(filteredAdminServices.length / ADMIN_SERVICES_PER_PAGE));
  if (adminServicesCurrentPage > totalPages) adminServicesCurrentPage = totalPages;

  const start = (adminServicesCurrentPage - 1) * ADMIN_SERVICES_PER_PAGE;
  const end = start + ADMIN_SERVICES_PER_PAGE;
  const currentServices = filteredAdminServices.slice(start, end);

  adminServicesTableBody.innerHTML = "";

  currentServices.forEach((service) => {
    const tr = document.createElement("tr");
    tr.dataset.category = service.category;
    tr.dataset.status = service.status;

    tr.innerHTML = `
      <td>#${service._id.slice(-6).toUpperCase()}</td>
      <td>${service.name}</td>
      <td>${service.country}</td>
      <td>${service.category}</td>
      <td>${formatPrice(service.price)}</td>
      <td><span class="status ${getStatusClass(service.status)}">${service.status}</span></td>
    `;

    adminServicesTableBody.appendChild(tr);
  });

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
    adminServicesEmptyMessage.style.display = filteredAdminServices.length === 0 ? "block" : "none";
  }

  if (adminServicesPagination) {
    adminServicesPagination.style.display = filteredAdminServices.length === 0 ? "none" : "flex";
  }
};

const filterAdminServices = () => {
  const searchValue = (adminServiceSearchInput?.value || "").toLowerCase().trim();
  const categoryValue = adminServiceCategoryFilter?.value || "all";
  const statusValue = adminServiceStatusFilter?.value || "all";

  filteredAdminServices = allAdminServices.filter((service) => {
    const text = `${service.name} ${service.country} ${service.serviceCode}`.toLowerCase();
    const matchesSearch = text.includes(searchValue);
    const matchesCategory = categoryValue === "all" || service.category === categoryValue;
    const matchesStatus = statusValue === "all" || service.status === statusValue;

    return matchesSearch && matchesCategory && matchesStatus;
  });

  adminServicesCurrentPage = 1;
  renderAdminServicesPage();
};

const fetchAdminServices = async () => {
  if (!token) return;

  if (adminServicesTableBody) {
    adminServicesTableBody.innerHTML = `
      <tr>
        <td colspan="6" style="text-align:center; color: var(--muted);">Loading services...</td>
      </tr>
    `;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/api/services/admin/all`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Failed to fetch admin services");
    }

    allAdminServices = data.services || [];
    filteredAdminServices = [...allAdminServices];
    renderAdminServicesPage();
  } catch (error) {
    if (adminServicesTableBody) {
      adminServicesTableBody.innerHTML = `
        <tr>
          <td colspan="6" style="text-align:center; color: #ef4444;">${error.message || "Could not load services."}</td>
        </tr>
      `;
    }
    if (adminServicesPagination) {
      adminServicesPagination.style.display = "none";
    }
  }
};

const openForm = () => {
  if (adminServiceFormCard) adminServiceFormCard.style.display = "block";
};

const closeForm = () => {
  if (adminServiceFormCard) adminServiceFormCard.style.display = "none";
  clearMessage();
};

openAddServiceFormBtn?.addEventListener("click", openForm);
closeAddServiceFormBtn?.addEventListener("click", closeForm);
cancelAddServiceFormBtn?.addEventListener("click", closeForm);

if (adminServiceForm) {
  adminServiceForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    clearMessage();

    const payload = {
      name: adminServiceName?.value.trim(),
      serviceCode: adminServiceCode?.value.trim(),
      country: adminServiceCountry?.value.trim(),
      price: Number(adminServicePrice?.value),
      category: adminServiceCategory?.value,
      deliveryType: adminServiceDeliveryType?.value,
      status: adminServiceStatus?.value,
      description: adminServiceDescription?.value.trim()
    };

    if (!payload.name || !payload.serviceCode || !payload.country || Number.isNaN(payload.price) || payload.price <= 0) {
      showMessage("Name, service code, country, and valid price are required.");
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/services`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to create service");
      }

      showMessage("Service created successfully.", "success");
      adminServiceForm.reset();
      await fetchAdminServices();

      if (typeof showToast === "function") {
        showToast("success", "Service created", "New OTP service added successfully.");
      }

      setTimeout(() => {
        closeForm();
      }, 800);
    } catch (error) {
      showMessage(error.message || "Something went wrong.");
    }
  });
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
  const totalPages = Math.ceil(filteredAdminServices.length / ADMIN_SERVICES_PER_PAGE);
  if (adminServicesCurrentPage < totalPages) {
    adminServicesCurrentPage++;
    renderAdminServicesPage();
  }
});

fetchAdminServices();