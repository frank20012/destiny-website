import { getStoredToken } from "./auth-storage.js";

const API_BASE_URL = CONFIG.API_BASE_URL;

const getToken = () => getStoredToken();

const focusServiceSearchBtn = document.getElementById("focusServiceSearchBtn");
const showActiveServicesBtn = document.getElementById("showActiveServicesBtn");

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

const servicesTotalCount = document.getElementById("servicesTotalCount");
const servicesActiveCount = document.getElementById("servicesActiveCount");
const servicesDraftCount = document.getElementById("servicesDraftCount");
const servicesDisabledCount = document.getElementById("servicesDisabledCount");

const ADMIN_SERVICES_PER_PAGE = 6;

let adminServicesCurrentPage = 1;
let allAdminServices = [];
let filteredAdminServices = [];

const escapeHtml = (value = "") => {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
};

const normalizeStatus = (status = "draft") => {
  return String(status || "draft").trim().toLowerCase();
};

const normalizeCategory = (category = "otp") => {
  return String(category || "otp").trim().toLowerCase();
};

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

const showTableMessage = (message, type = "normal") => {
  if (!adminServicesTableBody) return;

  const color = type === "error" ? "#ef4444" : "var(--muted)";

  adminServicesTableBody.innerHTML = `
    <tr>
      <td colspan="6" style="text-align:center; color:${color}; padding: 24px;">
        ${escapeHtml(message)}
      </td>
    </tr>
  `;
};

const formatPrice = (value) => {
  return `₦${Number(value || 0).toLocaleString("en-NG", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`;
};

const getStatusClass = (status) => {
  const normalizedStatus = normalizeStatus(status);

  const map = {
    active: "completed",
    draft: "pending",
    disabled: "cancelled"
  };

  return map[normalizedStatus] || "pending";
};

const renderServiceCounts = () => {
  const activeCount = allAdminServices.filter(
    (service) => normalizeStatus(service.status) === "active"
  ).length;

  const draftCount = allAdminServices.filter(
    (service) => normalizeStatus(service.status) === "draft"
  ).length;

  const disabledCount = allAdminServices.filter(
    (service) => normalizeStatus(service.status) === "disabled"
  ).length;

  if (servicesTotalCount) servicesTotalCount.textContent = allAdminServices.length;
  if (servicesActiveCount) servicesActiveCount.textContent = activeCount;
  if (servicesDraftCount) servicesDraftCount.textContent = draftCount;
  if (servicesDisabledCount) servicesDisabledCount.textContent = disabledCount;
};

const renderAdminServicesPage = () => {
  if (!adminServicesTableBody) return;

  const totalPages = Math.max(
    1,
    Math.ceil(filteredAdminServices.length / ADMIN_SERVICES_PER_PAGE)
  );

  if (adminServicesCurrentPage > totalPages) {
    adminServicesCurrentPage = totalPages;
  }

  const start = (adminServicesCurrentPage - 1) * ADMIN_SERVICES_PER_PAGE;
  const end = start + ADMIN_SERVICES_PER_PAGE;
  const currentServices = filteredAdminServices.slice(start, end);

  adminServicesTableBody.innerHTML = "";

  currentServices.forEach((service) => {
    const tr = document.createElement("tr");

    const serviceId = String(service._id || "");
    const status = normalizeStatus(service.status);
    const category = normalizeCategory(service.category);

    tr.innerHTML = `
      <td>#${escapeHtml(serviceId.slice(-6).toUpperCase())}</td>
      <td>
        <strong>${escapeHtml(service.name || "Service")}</strong>
        <br />
        <small>${escapeHtml(service.serviceCode || "-")}</small>
      </td>
      <td>${escapeHtml(service.country || "-")}</td>
      <td>${escapeHtml(category)}</td>
      <td>${formatPrice(service.price)}</td>
      <td>
        <span class="status ${getStatusClass(status)}">
          ${escapeHtml(status)}
        </span>
      </td>
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
    adminServicesEmptyMessage.style.display =
      filteredAdminServices.length === 0 ? "block" : "none";
  }

  if (adminServicesPagination) {
    adminServicesPagination.style.display =
      filteredAdminServices.length === 0 ? "none" : "flex";
  }
};

const filterAdminServices = () => {
  const searchValue = (adminServiceSearchInput?.value || "").toLowerCase().trim();
  const categoryValue = adminServiceCategoryFilter?.value || "all";
  const statusValue = adminServiceStatusFilter?.value || "all";

  filteredAdminServices = allAdminServices.filter((service) => {
    const text = `
      ${service.name || ""}
      ${service.country || ""}
      ${service.serviceCode || ""}
      ${service.category || ""}
      ${service.status || ""}
    `.toLowerCase();

    const matchesSearch = text.includes(searchValue);

    const matchesCategory =
      categoryValue === "all" ||
      normalizeCategory(service.category) === categoryValue;

    const matchesStatus =
      statusValue === "all" ||
      normalizeStatus(service.status) === statusValue;

    return matchesSearch && matchesCategory && matchesStatus;
  });

  adminServicesCurrentPage = 1;
  renderAdminServicesPage();
};

const fetchAdminServices = async () => {
  const token = getToken();

  if (!token) {
    showTableMessage("Admin login required.", "error");
    return;
  }

  showTableMessage("Loading services...");

  try {
    const response = await fetch(`${API_BASE_URL}/api/admin/services`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Failed to fetch admin services");
    }

    allAdminServices = Array.isArray(data.services) ? data.services : [];
    filteredAdminServices = [...allAdminServices];

    renderServiceCounts();
    renderAdminServicesPage();
  } catch (error) {
    console.error("Admin services fetch error:", error.message);

    showTableMessage(error.message || "Could not load services.", "error");

    if (adminServicesPagination) {
      adminServicesPagination.style.display = "none";
    }
  }
};

const openForm = () => {
  if (adminServiceFormCard) {
    adminServiceFormCard.style.display = "block";
    adminServiceFormCard.scrollIntoView({ behavior: "smooth", block: "start" });
  }
};

const closeForm = () => {
  if (adminServiceFormCard) {
    adminServiceFormCard.style.display = "none";
  }

  clearMessage();
};

const setSubmitLoading = (isLoading) => {
  const submitButton = adminServiceForm?.querySelector('button[type="submit"]');

  if (!submitButton) return;

  if (isLoading) {
    submitButton.disabled = true;
    submitButton.dataset.originalText = submitButton.innerHTML;
    submitButton.innerHTML = `
      <i class="fa-solid fa-spinner fa-spin"></i>
      Creating...
    `;
    return;
  }

  submitButton.disabled = false;

  if (submitButton.dataset.originalText) {
    submitButton.innerHTML = submitButton.dataset.originalText;
  }
};

openAddServiceFormBtn?.addEventListener("click", openForm);
closeAddServiceFormBtn?.addEventListener("click", closeForm);
cancelAddServiceFormBtn?.addEventListener("click", closeForm);

focusServiceSearchBtn?.addEventListener("click", () => {
  adminServiceSearchInput?.focus();
});

showActiveServicesBtn?.addEventListener("click", () => {
  if (!adminServiceStatusFilter) return;

  adminServiceStatusFilter.value = "active";
  adminServiceStatusFilter.dispatchEvent(new Event("change", { bubbles: true }));
});

adminServiceForm?.addEventListener("submit", async (event) => {
  event.preventDefault();

  const token = getToken();

  if (!token) {
    showMessage("Admin login required.");
    return;
  }

  clearMessage();

  const payload = {
    name: adminServiceName?.value.trim() || "",
    serviceCode: adminServiceCode?.value.trim() || "",
    country: adminServiceCountry?.value.trim() || "",
    price: Number(adminServicePrice?.value || 0),
    category: adminServiceCategory?.value || "otp",
    deliveryType: adminServiceDeliveryType?.value || "sms",
    status: adminServiceStatus?.value || "active",
    description: adminServiceDescription?.value.trim() || ""
  };

  if (!payload.name || !payload.serviceCode || !payload.country || payload.price <= 0) {
    showMessage("Name, service code, country, and valid price are required.");
    return;
  }

  try {
    setSubmitLoading(true);

    const response = await fetch(`${API_BASE_URL}/api/admin/services`, {
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

    if (typeof showToast === "function") {
      showToast("success", "Service created", "New service added successfully.");
    }

    await fetchAdminServices();

    setTimeout(() => {
      closeForm();
    }, 700);
  } catch (error) {
    console.error("Admin service create error:", error.message);

    showMessage(error.message || "Something went wrong.");

    if (typeof showToast === "function") {
      showToast("error", "Create failed", error.message || "Could not create service.");
    }
  } finally {
    setSubmitLoading(false);
  }
});

adminServiceSearchInput?.addEventListener("input", filterAdminServices);
adminServiceCategoryFilter?.addEventListener("change", filterAdminServices);
adminServiceStatusFilter?.addEventListener("change", filterAdminServices);

adminServicesPrevBtn?.addEventListener("click", () => {
  if (adminServicesCurrentPage > 1) {
    adminServicesCurrentPage -= 1;
    renderAdminServicesPage();
  }
});

adminServicesNextBtn?.addEventListener("click", () => {
  const totalPages = Math.ceil(
    filteredAdminServices.length / ADMIN_SERVICES_PER_PAGE
  );

  if (adminServicesCurrentPage < totalPages) {
    adminServicesCurrentPage += 1;
    renderAdminServicesPage();
  }
});

fetchAdminServices();