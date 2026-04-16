import { getStoredToken } from "./auth-storage.js";

const API_BASE_URL = CONFIG.API_BASE_URL;

const countryFilter = document.getElementById("countryFilter");
const serviceFilter = document.getElementById("serviceFilter");
const selectedServiceBox = document.getElementById("selectedServiceBox");
const servicesGrid = document.getElementById("servicesGrid");
const servicesEmptyMessage = document.getElementById("servicesEmptyMessage");
const servicesCountriesCount = document.getElementById("servicesCountriesCount");
const servicesTotalCount = document.getElementById("servicesTotalCount");

let allCountries = [];
let currentServices = [];
let selectedServiceData = null;

const getToken = () => getStoredToken();

const formatPrice = (price) => {
  return `₦${Number(price || 0).toLocaleString("en-NG", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`;
};

const prettifyText = (value) => {
  if (!value) return "";
  return String(value)
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
};

const showMessage = (type, title, message) => {
  if (typeof showToast === "function") {
    showToast(type, title, message);
  } else {
    alert(message);
  }
};

const isOutOfStockMessage = (message) => {
  const text = String(message || "").toLowerCase();
  return (
    text.includes("out of stock") ||
    text.includes("no free phones") ||
    text.includes("service is currently out of stock")
  );
};

const updateSummaryCounts = (visibleServices = []) => {
  if (servicesCountriesCount) {
    servicesCountriesCount.textContent = allCountries.length;
  }

  if (servicesTotalCount) {
    servicesTotalCount.textContent = visibleServices.length || currentServices.length;
  }
};

const renderEmptySelection = (
  message = "Select a country, then choose a service to see details here."
) => {
  if (!selectedServiceBox) return;

  selectedServiceBox.innerHTML = `
    <div class="selected-service-empty">
      <i class="fa-solid fa-hand-pointer"></i>
      <h3>No service selected</h3>
      <p>${message}</p>
    </div>
  `;
};

const getVisibleServices = () => {
  const selectedName = serviceFilter?.value || "";

  if (!selectedName) {
    return currentServices;
  }

  return currentServices.filter(
    (service) =>
      String(service.name).toLowerCase() === String(selectedName).toLowerCase()
  );
};

const renderServicesGrid = () => {
  if (!servicesGrid) return;

  const visibleServices = getVisibleServices();

  updateSummaryCounts(visibleServices);
  servicesGrid.innerHTML = "";

  if (!visibleServices.length) {
    if (servicesEmptyMessage) {
      servicesEmptyMessage.style.display = "block";
    }
    return;
  }

  if (servicesEmptyMessage) {
    servicesEmptyMessage.style.display = "none";
  }

  visibleServices.forEach((service) => {
    const article = document.createElement("article");
    article.className = "service-card";

    const isAvailable = Boolean(service.available);

    article.innerHTML = `
      <div class="service-card-top">
        <span class="service-tag">${prettifyText(service.country)} • ${prettifyText(service.name)}</span>
        <span class="service-price">${formatPrice(service.price)}</span>
      </div>

      <h3>${prettifyText(service.name)}</h3>
      <p>Live provider service available for ${prettifyText(service.country)}.</p>

      <div class="service-meta-list">
        <div class="service-meta-item">
          <span class="meta-label">Country</span>
          <strong>${prettifyText(service.country)}</strong>
        </div>

        <div class="service-meta-item">
          <span class="meta-label">Service</span>
          <strong>${prettifyText(service.name)}</strong>
        </div>

        <div class="service-meta-item">
          <span class="meta-label">Availability</span>
          <strong class="service-status ${isAvailable ? "is-active" : "is-inactive"}">
            ${isAvailable ? `${service.count || 0} available` : "Out of stock"}
          </strong>
        </div>
      </div>

      <button
        class="service-card-btn ${isAvailable ? "" : "disabled-link"}"
        data-service="${service.name}"
        ${isAvailable ? "" : "disabled"}
      >
        ${isAvailable ? "Select Service" : "Out of Stock"}
      </button>
    `;

    servicesGrid.appendChild(article);
  });

  bindServiceSelectButtons();
};

const renderSelectedService = (service) => {
  if (!selectedServiceBox || !service) return;

  selectedServiceData = service;

  const isAvailable = Boolean(service.available);

  selectedServiceBox.innerHTML = `
    <div class="selected-service-card">
      <div class="selected-service-top">
        <div>
          <span class="selected-service-badge">${prettifyText(service.country)}</span>
          <h3>${prettifyText(service.name)}</h3>
        </div>
        <div class="selected-service-price">${formatPrice(service.price)}</div>
      </div>

      <div class="selected-service-meta">
        <div class="selected-meta-box">
          <span>Status</span>
          <strong class="${isAvailable ? "text-success" : "text-danger"}">
            ${isAvailable ? "Available" : "Out of stock"}
          </strong>
        </div>

        <div class="selected-meta-box">
          <span>Stock</span>
          <strong>${service.count || 0}</strong>
        </div>

        <div class="selected-meta-box">
          <span>Service</span>
          <strong>${prettifyText(service.name)}</strong>
        </div>
      </div>

      <div class="selected-service-actions">
        <button
          class="selected-service-btn ${isAvailable ? "" : "disabled-link"}"
          id="buySelectedServiceBtn"
          ${isAvailable ? "" : "disabled"}
        >
          ${isAvailable ? `Buy for ${formatPrice(service.price)}` : "Currently Out of Stock"}
        </button>
      </div>
    </div>
  `;

  document
    .getElementById("buySelectedServiceBtn")
    ?.addEventListener("click", buySelectedService);
};

const populateCountryDropdown = (countries) => {
  if (!countryFilter) return;

  countryFilter.innerHTML = `<option value="">Select Country</option>`;

  countries.forEach((country) => {
    const option = document.createElement("option");
    option.value = country;
    option.textContent = prettifyText(country);
    countryFilter.appendChild(option);
  });
};

const populateServiceDropdown = (services) => {
  if (!serviceFilter) return;

  serviceFilter.innerHTML = `<option value="">Select Service</option>`;

  services.forEach((service) => {
    const option = document.createElement("option");
    option.value = service.name;
    option.textContent = `${prettifyText(service.name)} (${formatPrice(service.price)})`;
    serviceFilter.appendChild(option);
  });

  serviceFilter.disabled = services.length === 0;
};

const loadCountries = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/services`);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Failed to load countries");
    }

    allCountries = data.data || [];
    populateCountryDropdown(allCountries);
    updateSummaryCounts([]);
  } catch (error) {
    console.error(error.message);
    showMessage(
      "error",
      "Countries failed",
      error.message || "Could not load countries."
    );
  }
};

const loadServicesByCountry = async (country) => {
  if (!servicesGrid) return;

  servicesGrid.innerHTML = `<p style="color: var(--muted);">Loading services...</p>`;
  renderEmptySelection();

  try {
    const response = await fetch(
      `${API_BASE_URL}/api/services?country=${encodeURIComponent(country)}`
    );
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Failed to load services");
    }

    currentServices = data.services || [];
    populateServiceDropdown(currentServices);
    updateSummaryCounts(currentServices);
    renderServicesGrid();
  } catch (error) {
    console.error(error.message);
    servicesGrid.innerHTML = `<p style="color: #ef4444;">${
      error.message || "Could not load services."
    }</p>`;
    currentServices = [];
    selectedServiceData = null;
    populateServiceDropdown([]);
    updateSummaryCounts([]);
  }
};

const refreshCurrentCountryServices = async () => {
  const selectedCountry = countryFilter?.value || "";

  if (!selectedCountry) return;

  selectedServiceData = null;

  if (serviceFilter) {
    serviceFilter.value = "";
  }

  renderEmptySelection(
    "Service availability has been refreshed. Please choose again."
  );
  await loadServicesByCountry(selectedCountry);
};

const bindServiceSelectButtons = () => {
  document.querySelectorAll(".service-card-btn").forEach((button) => {
    button.addEventListener("click", () => {
      if (button.disabled) return;

      const serviceName = button.dataset.service;
      const selected = currentServices.find(
        (service) =>
          String(service.name).toLowerCase() === String(serviceName).toLowerCase()
      );

      if (!selected) return;

      if (serviceFilter) {
        serviceFilter.value = selected.name;
      }

      renderServicesGrid();
      renderSelectedService(selected);
    });
  });
};

const buySelectedService = async () => {
  if (!selectedServiceData) return;

  if (!selectedServiceData.available) {
    showMessage(
      "error",
      "Out of stock",
      "This service is currently out of stock."
    );
    await refreshCurrentCountryServices();
    return;
  }

  const token = getToken();

  if (!token) {
    showMessage("error", "Login required", "You must be logged in.");
    window.location.href = "signin.html";
    return;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/api/orders/buy`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        country: selectedServiceData.country,
        serviceName: selectedServiceData.name
      })
    });

    const data = await response.json();

    if (!response.ok) {
      if (isOutOfStockMessage(data.message)) {
        showMessage(
          "error",
          "Out of stock",
          data.message ||
            "This service is currently out of stock. Please try another service or country."
        );

        await refreshCurrentCountryServices();
        return;
      }

      throw new Error(data.message || "Failed to buy number");
    }

    showMessage(
      "success",
      "Purchase successful",
      `Number purchased for ${formatPrice(
        data.order?.price || selectedServiceData.price
      )}.`
    );

    window.location.href = "orders.html";
  } catch (error) {
    showMessage(
      "error",
      "Purchase failed",
      error.message || "Something went wrong."
    );
  }
};

countryFilter?.addEventListener("change", () => {
  const selectedCountry = countryFilter.value;

  if (!selectedCountry) {
    currentServices = [];
    selectedServiceData = null;
    populateServiceDropdown([]);
    renderEmptySelection();
    renderServicesGrid();
    updateSummaryCounts([]);
    return;
  }

  selectedServiceData = null;
  loadServicesByCountry(selectedCountry);
});

serviceFilter?.addEventListener("change", () => {
  const selectedName = serviceFilter.value;

  renderServicesGrid();

  if (!selectedName) {
    selectedServiceData = null;
    renderEmptySelection();
    return;
  }

  const selectedService = currentServices.find(
    (service) =>
      String(service.name).toLowerCase() === String(selectedName).toLowerCase()
  );

  if (!selectedService) {
    selectedServiceData = null;
    renderEmptySelection();
    return;
  }

  renderSelectedService(selectedService);
});

renderEmptySelection();
loadCountries();