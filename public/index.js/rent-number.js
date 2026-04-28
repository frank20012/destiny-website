import { getStoredToken } from "./auth-storage.js";

const API_BASE_URL = CONFIG.API_BASE_URL;

const rentCountryFilter = document.getElementById("rentCountryFilter");
const rentServiceFilter = document.getElementById("rentServiceFilter");
const rentNumberGrid = document.getElementById("rentNumberGrid");
const rentNumberEmptyMessage = document.getElementById("rentNumberEmptyMessage");
const selectedRentServiceBox = document.getElementById("selectedRentServiceBox");
const rentCountriesCount = document.getElementById("rentCountriesCount");
const rentServicesCount = document.getElementById("rentServicesCount");

let allCountries = [];
let currentServices = [];
let selectedRentService = null;

const DEFAULT_COUNTRIES = [
  "UNITED STATES",
  "UNITED KINGDOM",
  "CANADA",
  "NIGERIA",
  "AUSTRALIA",
  "GERMANY",
  "FRANCE",
  "NETHERLANDS",
  "SWEDEN",
  "INDIA"
];

const DEFAULT_RENT_SERVICES = [
  "whatsapp",
  "telegram",
  "facebook",
  "google",
  "instagram",
  "twitter",
  "tiktok",
  "gmail",
  "discord",
  "amazon",
  "microsoft",
  "linkedin",
  "wechat",
  "line",
  "yahoo"
];

const getToken = () => getStoredToken();

const formatPrice = (value) => {
  if (value === null || value === undefined || Number.isNaN(Number(value))) {
    return "Price unavailable";
  }

  return `₦${Number(value).toLocaleString("en-NG", {
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
    text.includes("no provider could supply") ||
    text.includes("no number available")
  );
};

const renderEmptySelectedService = (
  message = "Select a country and service to see full rental details here."
) => {
  if (!selectedRentServiceBox) return;

  selectedRentServiceBox.innerHTML = `
    <div class="selected-rent-empty">
      <i class="fa-solid fa-hand-pointer"></i>
      <h3>No service selected</h3>
      <p>${message}</p>
    </div>
  `;
};

const updateCounts = (visibleServices = []) => {
  if (rentCountriesCount) {
    rentCountriesCount.textContent = allCountries.length;
  }

  if (rentServicesCount) {
    rentServicesCount.textContent =
      visibleServices.length || currentServices.length;
  }
};

const populateCountryDropdown = () => {
  if (!rentCountryFilter) return;

  rentCountryFilter.innerHTML = `<option value="">Select Country</option>`;

  allCountries.forEach((country) => {
    const option = document.createElement("option");
    option.value = country;
    option.textContent = prettifyText(country);
    rentCountryFilter.appendChild(option);
  });
};

const populateServiceDropdown = () => {
  if (!rentServiceFilter) return;

  rentServiceFilter.innerHTML = `<option value="">Select Service</option>`;

  DEFAULT_RENT_SERVICES.forEach((service) => {
    const option = document.createElement("option");
    option.value = service;
    option.textContent = prettifyText(service);
    rentServiceFilter.appendChild(option);
  });

  rentServiceFilter.disabled = false;
};

const getVisibleServices = () => {
  const selectedServiceId = rentServiceFilter?.value || "";

  if (!selectedServiceId) {
    return currentServices;
  }

  return currentServices.filter(
    (service) => String(service.id).toLowerCase() === String(selectedServiceId).toLowerCase()
  );
};

const getAvailabilityText = (service) => {
  if (!service.available) return "Out of stock";
  if (service.available && !service.hasValidPrice) {
    return `${service.count || 0} in stock • price at checkout`;
  }
  return `${service.count || 0} in stock`;
};

const renderRentGrid = () => {
  if (!rentNumberGrid) return;

  const visibleServices = getVisibleServices();
  updateCounts(visibleServices);
  rentNumberGrid.innerHTML = "";

  if (!visibleServices.length) {
    if (rentNumberEmptyMessage) {
      rentNumberEmptyMessage.style.display = "block";
    }
    return;
  }

  if (rentNumberEmptyMessage) {
    rentNumberEmptyMessage.style.display = "none";
  }

  visibleServices.forEach((service) => {
    const card = document.createElement("div");
    card.className = "rent-card";

    const isAvailable = Boolean(service.available);
    const hasValidPrice = Boolean(service.hasValidPrice);

    card.innerHTML = `
      <div class="rent-card-top">
        <span class="rent-tag">${prettifyText(service.country)}</span>
        <strong class="rent-card-price">${hasValidPrice ? formatPrice(service.price) : "Price unavailable"}</strong>
      </div>

      <h3>${prettifyText(service.name)}</h3>
      <p>Rental number service available through ${prettifyText(service.provider)}.</p>

      <div class="rent-meta">
        <span>${prettifyText(service.country)}</span>
        <span>${getAvailabilityText(service)}</span>
        <span>Provider: ${prettifyText(service.provider)}</span>
      </div>

      <button
        type="button"
        class="primary-btn rent-btn ${isAvailable ? "" : "disabled-link"}"
        data-id="${service.id}"
        data-provider="${service.provider}"
        ${isAvailable ? "" : "disabled"}
      >
        ${isAvailable ? "Select Service" : "Out of Stock"}
      </button>
    `;

    rentNumberGrid.appendChild(card);
  });

  bindRentSelectButtons();
};

const renderSelectedService = (service) => {
  if (!selectedRentServiceBox || !service) return;

  selectedRentService = service;

  const isAvailable = Boolean(service.available);
  const hasValidPrice = Boolean(service.hasValidPrice);

  selectedRentServiceBox.innerHTML = `
    <div class="selected-rent-service-card">
      <div class="selected-rent-top">
        <div>
          <span class="selected-rent-badge">${prettifyText(service.country)}</span>
          <h3>${prettifyText(service.name)}</h3>
          <small>${prettifyText(service.provider)}</small>
        </div>
        <div class="selected-rent-price">${hasValidPrice ? formatPrice(service.price) : "Price unavailable"}</div>
      </div>

      <div class="selected-rent-meta">
        <div class="selected-rent-meta-box">
          <span>Country</span>
          <strong>${prettifyText(service.country)}</strong>
        </div>

        <div class="selected-rent-meta-box">
          <span>Service</span>
          <strong>${prettifyText(service.name)}</strong>
        </div>

        <div class="selected-rent-meta-box">
          <span>Status</span>
          <strong class="${isAvailable ? "text-success" : "text-danger"}">
            ${isAvailable ? "Available" : "Out of stock"}
          </strong>
        </div>
      </div>

      <div class="selected-rent-actions">
        <button
          type="button"
          class="primary-btn ${isAvailable ? "" : "disabled-link"}"
          id="buyRentServiceBtn"
          ${isAvailable ? "" : "disabled"}
        >
          ${
            !isAvailable
              ? "Currently Out of Stock"
              : hasValidPrice
              ? `Rent for ${formatPrice(service.price)}`
              : "Rent Number"
          }
        </button>

        ${
          isAvailable && !hasValidPrice
            ? `<p class="selected-rent-note">Provider stock is available. Final price will be resolved at checkout.</p>`
            : `<p class="selected-rent-note">The displayed price already includes your provider price plus markup.</p>`
        }
      </div>
    </div>
  `;

  document
    .getElementById("buyRentServiceBtn")
    ?.addEventListener("click", buySelectedRentService);
};

const loadCountries = async () => {
  allCountries = [...DEFAULT_COUNTRIES];
  populateCountryDropdown();
  updateCounts([]);
};

const loadRentPricing = async (country, service) => {
  const token = getToken();

  if (!token || !country || !service) return;

  rentNumberGrid.innerHTML = `<p style="color: var(--muted);">Loading rental services...</p>`;
  renderEmptySelectedService();

  try {
    const response = await fetch(
      `${API_BASE_URL}/api/rent/services?country=${encodeURIComponent(
        country
      )}&service=${encodeURIComponent(service)}`,
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Failed to fetch services");
    }

    currentServices = data.services || [];
    renderRentGrid();

    if (currentServices.length) {
      const bestAvailablePriced = currentServices.find(
        (item) => item.available && item.hasValidPrice
      );

      const bestAvailable = currentServices.find(
        (item) => item.available
      );

      const selected =
        bestAvailablePriced ||
        bestAvailable ||
        currentServices[0];

      if (selected) {
        renderSelectedService(selected);
      }
    }
  } catch (error) {
    currentServices = [];
    renderEmptySelectedService("Could not load rental services.");
    rentNumberGrid.innerHTML = `<p style="color:#ef4444;">${
      error.message || "Could not load rental services."
    }</p>`;
  }
};

const bindRentSelectButtons = () => {
  document.querySelectorAll(".rent-btn").forEach((button) => {
    button.addEventListener("click", () => {
      if (button.disabled) return;

      const serviceId = button.dataset.id;
      const providerName = button.dataset.provider;

      const selected = currentServices.find(
        (service) =>
          String(service.id).toLowerCase() === String(serviceId).toLowerCase() &&
          String(service.provider).toLowerCase() === String(providerName).toLowerCase()
      );

      if (!selected) return;

      renderRentGrid();
      renderSelectedService(selected);
    });
  });
};

const buySelectedRentService = async () => {
  const token = getToken();

  if (!selectedRentService) return;

  if (!selectedRentService.available) {
    showMessage(
      "error",
      "Out of stock",
      "This rental service is currently out of stock."
    );
    return;
  }

  if (!token) {
    window.location.href = "signin.html";
    return;
  }

  try {
    const payload = {
      countryId: selectedRentService.country,
      countryName: selectedRentService.country,
      serviceId: selectedRentService.id,
      serviceName: selectedRentService.name
    };

    const response = await fetch(`${API_BASE_URL}/api/rent/buy`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();

    if (!response.ok) {
      if (isOutOfStockMessage(data.message)) {
        showMessage(
          "error",
          "Out of stock",
          data.message || "This rental service is currently out of stock."
        );
        return;
      }

      throw new Error(data.message || "Failed to rent number");
    }

    showMessage(
      "success",
      "Success",
      `Number rented successfully for ${formatPrice(
        data.order?.price ?? selectedRentService.price
      )}.`
    );
    window.location.href = "orders.html";
  } catch (error) {
    showMessage("error", "Rent failed", error.message || "Something went wrong.");
    renderEmptySelectedService("Try another country or service.");
  }
};

rentCountryFilter?.addEventListener("change", async () => {
  const country = rentCountryFilter.value;
  const service = rentServiceFilter?.value || "";

  currentServices = [];
  selectedRentService = null;
  renderEmptySelectedService();
  renderRentGrid();
  updateCounts([]);

  if (country && service) {
    await loadRentPricing(country, service);
  }
});

rentServiceFilter?.addEventListener("change", async () => {
  const country = rentCountryFilter?.value || "";
  const service = rentServiceFilter.value;

  currentServices = [];
  selectedRentService = null;
  renderEmptySelectedService();
  renderRentGrid();
  updateCounts([]);

  if (!service) return;

  if (!country) {
    showMessage("error", "Country required", "Please select a country first.");
    return;
  }

  await loadRentPricing(country, service);
});

renderEmptySelectedService();
populateServiceDropdown();
loadCountries();