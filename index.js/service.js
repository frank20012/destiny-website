import { getStoredToken } from "./auth-storage.js";

const API_BASE_URL = CONFIG.API_BASE_URL;

const selectedServiceBox = document.getElementById("selectedServiceBox");
const servicesGrid = document.getElementById("servicesGrid");
const servicesEmptyMessage = document.getElementById("servicesEmptyMessage");
const servicesCountriesCount = document.getElementById("servicesCountriesCount");
const servicesTotalCount = document.getElementById("servicesTotalCount");

const countryTrigger = document.getElementById("countryTrigger");
const countryDropdown = document.getElementById("countryDropdown");
const countrySearchInput = document.getElementById("countrySearchInput");
const countryOptionsList = document.getElementById("countryOptionsList");
const selectedCountryText = document.getElementById("selectedCountryText");
const selectedCountryFlag = document.getElementById("selectedCountryFlag");

const serviceTrigger = document.getElementById("serviceTrigger");
const serviceDropdown = document.getElementById("serviceDropdown");
const serviceSearchInput = document.getElementById("serviceSearchInput");
const serviceOptionsList = document.getElementById("serviceOptionsList");
const selectedServiceText = document.getElementById("selectedServiceText");

let allCountries = [];
let allServices = [];
let currentServices = [];

let selectedCountry = null;
let selectedService = null;
let selectedServiceData = null;

const getToken = () => getStoredToken();

const COUNTRY_CODE_MAP = {
  "UNITED STATES": "us",
  "USA": "us",
  "US": "us",
  "UNITED KINGDOM": "gb",
  "UK": "gb",
  "ENGLAND": "gb",
  "NIGERIA": "ng",
  "CANADA": "ca",
  "AUSTRALIA": "au",
  "GERMANY": "de",
  "FRANCE": "fr",
  "NETHERLANDS": "nl",
  "SWEDEN": "se",
  "INDIA": "in",
  "RUSSIA": "ru",
  "UKRAINE": "ua",
  "CHINA": "cn",
  "SPAIN": "es",
  "ITALY": "it",
  "BELGIUM": "be",
  "PORTUGAL": "pt",
  "POLAND": "pl",
  "BRAZIL": "br",
  "MEXICO": "mx",
  "SOUTH AFRICA": "za",
  "UNITED ARAB EMIRATES": "ae",
  "UAE": "ae"
};

const prettifyText = (value) => {
  if (!value) return "";
  return String(value)
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
};

const normalizeText = (value) =>
  String(value || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "")
    .replace(/[^a-z0-9]/g, "");

const formatPrice = (price) => {
  if (price === null || price === undefined || Number.isNaN(Number(price))) {
    return "Price unavailable";
  }

  return `₦${Number(price).toLocaleString("en-NG", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`;
};

const formatRawProviderPrice = (service) => {
  const price = Number(service?.providerPrice || 0);
  const currency = String(service?.providerCurrency || "").toUpperCase();

  if (!price || !currency) {
    return "Not available";
  }

  return `${price.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })} ${currency}`;
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
    text.includes("service is currently out of stock") ||
    text.includes("no provider could supply") ||
    text.includes("no numbers")
  );
};

const getCountryCode = (countryName) => {
  const normalized = String(countryName || "").trim().toUpperCase();
  return COUNTRY_CODE_MAP[normalized] || null;
};

const getFlagImg = (countryName, className = "flag-img") => {
  const code = getCountryCode(countryName);

  if (!code) {
    return `<span class="${className} flag-fallback">🌍</span>`;
  }

  return `<img class="${className}" src="https://flagcdn.com/w40/${code}.png" alt="${prettifyText(
    countryName
  )} flag" loading="lazy" />`;
};

const openDropdown = (dropdown) => {
  dropdown?.classList.add("is-open");
};

const closeDropdown = (dropdown) => {
  dropdown?.classList.remove("is-open");
};

const closeAllDropdowns = () => {
  closeDropdown(countryDropdown);
  closeDropdown(serviceDropdown);
};

document.addEventListener("click", (event) => {
  const insideCountry =
    countryTrigger?.contains(event.target) || countryDropdown?.contains(event.target);

  const insideService =
    serviceTrigger?.contains(event.target) || serviceDropdown?.contains(event.target);

  if (!insideCountry) closeDropdown(countryDropdown);
  if (!insideService) closeDropdown(serviceDropdown);
});

countryTrigger?.addEventListener("click", (event) => {
  event.preventDefault();
  event.stopPropagation();

  const isOpen = countryDropdown?.classList.contains("is-open");
  closeAllDropdowns();

  if (!isOpen) {
    openDropdown(countryDropdown);
    setTimeout(() => countrySearchInput?.focus(), 50);
  }
});

serviceTrigger?.addEventListener("click", (event) => {
  event.preventDefault();
  event.stopPropagation();

  if (!selectedCountry) {
    showMessage("error", "Country required", "Please select a country first.");
    return;
  }

  const isOpen = serviceDropdown?.classList.contains("is-open");
  closeAllDropdowns();

  if (!isOpen) {
    openDropdown(serviceDropdown);
    setTimeout(() => serviceSearchInput?.focus(), 50);
  }
});

const updateSummaryCounts = (visibleServices = []) => {
  if (servicesCountriesCount) {
    servicesCountriesCount.textContent = allCountries.length;
  }

  if (servicesTotalCount) {
    servicesTotalCount.textContent = visibleServices.length || currentServices.length;
  }
};

const renderEmptySelection = (
  message = "Select a country and service to see provider details here."
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

const renderCountryOptions = (query = "") => {
  if (!countryOptionsList) return;

  const normalizedQuery = normalizeText(query);

  const filteredCountries = allCountries.filter((country) =>
    normalizeText(country.name).includes(normalizedQuery)
  );

  if (!filteredCountries.length) {
    countryOptionsList.innerHTML = `
      <div class="search-option-empty">No countries found.</div>
    `;
    return;
  }

  countryOptionsList.innerHTML = filteredCountries
    .map(
      (country) => `
        <button
          type="button"
          class="search-option country-option"
          data-country="${country.name}"
        >
          <span class="search-option-left">
            ${getFlagImg(country.name, "search-option-flag")}
            <span class="search-option-copy">
              <strong>${prettifyText(country.name)}</strong>
              <span>${country.providers?.length || 0} provider(s)</span>
            </span>
          </span>
          <span class="search-option-meta">${country.providers?.join(", ") || ""}</span>
        </button>
      `
    )
    .join("");
};

const renderServiceOptions = (query = "") => {
  if (!serviceOptionsList) return;

  const normalizedQuery = normalizeText(query);

  const filteredServices = allServices.filter((service) =>
    normalizeText(service.name || service.displayName).includes(normalizedQuery)
  );

  if (!filteredServices.length) {
    serviceOptionsList.innerHTML = `
      <div class="search-option-empty">No services found.</div>
    `;
    return;
  }

  serviceOptionsList.innerHTML = filteredServices
    .map(
      (service) => `
        <button
          type="button"
          class="search-option service-option"
          data-service="${service.name}"
        >
          <span class="search-option-left">
            <span class="search-option-flag service-option-icon">
              <i class="fa-solid fa-layer-group"></i>
            </span>
            <span class="search-option-copy">
              <strong>${prettifyText(service.displayName || service.name)}</strong>
              <span>${service.providers?.length || 0} provider(s)</span>
            </span>
          </span>
          <span class="search-option-meta">${service.providers?.join(", ") || ""}</span>
        </button>
      `
    )
    .join("");
};

countryOptionsList?.addEventListener("click", async (event) => {
  const button = event.target.closest(".country-option");
  if (!button) return;

  event.preventDefault();
  event.stopPropagation();

  const countryName = button.dataset.country;
  await selectCountry(countryName);
  closeDropdown(countryDropdown);
});

serviceOptionsList?.addEventListener("click", async (event) => {
  const button = event.target.closest(".service-option");
  if (!button) return;

  event.preventDefault();
  event.stopPropagation();

  const serviceName = button.dataset.service;
  await selectService(serviceName);
  closeDropdown(serviceDropdown);
});

countrySearchInput?.addEventListener("input", () => {
  renderCountryOptions(countrySearchInput.value);
});

serviceSearchInput?.addEventListener("input", () => {
  renderServiceOptions(serviceSearchInput.value);
});

const loadMergedCountries = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/catalog/countries`);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Failed to load countries");
    }

    allCountries = data.countries || [];
    renderCountryOptions("");
    updateSummaryCounts([]);
  } catch (error) {
    console.error(error.message);
    if (countryOptionsList) {
      countryOptionsList.innerHTML = `
        <div class="search-option-empty">Could not load countries.</div>
      `;
    }
  }
};

const loadMergedServices = async (countryName) => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/catalog/services?country=${encodeURIComponent(countryName)}`
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Failed to load services");
    }

    allServices = data.services || [];
    renderServiceOptions("");
  } catch (error) {
    console.error(error.message);
    allServices = [];
    renderServiceOptions("");
    showMessage("error", "Service load failed", error.message || "Could not load services.");
  }
};

const selectCountry = async (countryName) => {
  selectedCountry = countryName;
  selectedService = null;
  allServices = [];
  currentServices = [];
  selectedServiceData = null;

  if (selectedCountryText) {
    selectedCountryText.textContent = prettifyText(countryName);
  }

  if (selectedCountryFlag) {
    selectedCountryFlag.innerHTML = getFlagImg(countryName, "trigger-flag-img");
  }

  if (selectedServiceText) {
    selectedServiceText.textContent = "Select Service";
  }

  if (countrySearchInput) {
    countrySearchInput.value = countryName;
  }

  if (serviceSearchInput) {
    serviceSearchInput.value = "";
  }

  renderEmptySelection("Country selected. Now choose a service.");
  renderServicesGrid();
  updateSummaryCounts([]);

  await loadMergedServices(countryName);
};

const selectService = async (serviceName) => {
  if (!selectedCountry) {
    showMessage("error", "Country required", "Please select a country first.");
    return;
  }

  selectedService = serviceName;

  if (selectedServiceText) {
    selectedServiceText.textContent = prettifyText(serviceName);
  }

  if (serviceSearchInput) {
    serviceSearchInput.value = serviceName;
  }

  await loadServicePricing(selectedCountry, selectedService);
};

const getVisibleServices = () => currentServices;

const getServiceAvailabilityText = (service) => {
  if (!service.available) return "Out of stock";
  if (service.available && !service.hasValidPrice) {
    return `${service.count || 0} available • price at checkout`;
  }
  return `${service.count || 0} available`;
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
    const hasValidPrice = Boolean(service.hasValidPrice);

    article.innerHTML = `
      <div class="service-card-top">
        <span class="service-tag">
          ${getFlagImg(service.country, "service-flag-img")}
          ${prettifyText(service.country)} • ${prettifyText(service.provider)}
        </span>
        <span class="service-price">${hasValidPrice ? formatPrice(service.price) : "Price unavailable"}</span>
      </div>

      <h3>${prettifyText(service.name)}</h3>
      <p>Live provider service available for ${prettifyText(service.country)}.</p>

      <div class="service-meta-list">
        <div class="service-meta-item">
          <span class="meta-label">Provider</span>
          <strong>${prettifyText(service.provider)}</strong>
        </div>

        <div class="service-meta-item">
          <span class="meta-label">Provider Price</span>
          <strong>${formatRawProviderPrice(service)}</strong>
        </div>

        <div class="service-meta-item">
          <span class="meta-label">Final Price</span>
          <strong>${hasValidPrice ? formatPrice(service.price) : "Price unavailable"}</strong>
        </div>

        <div class="service-meta-item">
          <span class="meta-label">Availability</span>
          <strong class="service-status ${isAvailable ? "is-active" : "is-inactive"}">
            ${getServiceAvailabilityText(service)}
          </strong>
        </div>
      </div>

      <button
        class="service-card-btn ${isAvailable ? "" : "disabled-link"}"
        data-provider="${service.provider}"
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
  const hasValidPrice = Boolean(service.hasValidPrice);

  selectedServiceBox.innerHTML = `
    <div class="selected-service-card">
      <div class="selected-service-top">
        <div>
          <span class="selected-service-badge">
            ${getFlagImg(service.country, "selected-badge-flag")}
            <span>${prettifyText(service.country)}</span>
          </span>
          <h3>${prettifyText(service.name)}</h3>
          <small>${prettifyText(service.provider)}</small>
        </div>
        <div class="selected-service-price">${hasValidPrice ? formatPrice(service.price) : "Price unavailable"}</div>
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
          <span>Provider Price</span>
          <strong>${formatRawProviderPrice(service)}</strong>
        </div>

        <div class="selected-meta-box">
          <span>Final Price</span>
          <strong>${hasValidPrice ? formatPrice(service.price) : "Price unavailable"}</strong>
        </div>
      </div>

      <div class="selected-service-actions">
        <button
          class="selected-service-btn ${isAvailable ? "" : "disabled-link"}"
          id="buySelectedServiceBtn"
          ${isAvailable ? "" : "disabled"}
        >
          ${
            !isAvailable
              ? "Currently Out of Stock"
              : hasValidPrice
              ? `Buy for ${formatPrice(service.price)}`
              : "Buy Number"
          }
        </button>

        ${
          isAvailable && !hasValidPrice
            ? `<p class="selected-service-note">Provider stock is available. Final price will be resolved at checkout.</p>`
            : ""
        }
      </div>
    </div>
  `;

  document
    .getElementById("buySelectedServiceBtn")
    ?.addEventListener("click", buySelectedService);
};

const loadServicePricing = async (country, service) => {
  if (!servicesGrid) return;

  servicesGrid.innerHTML = `<p style="color: var(--muted);">Loading services...</p>`;
  renderEmptySelection();

  try {
    const response = await fetch(
      `${API_BASE_URL}/api/services?country=${encodeURIComponent(
        country
      )}&service=${encodeURIComponent(service)}&type=temporary`
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Failed to load services");
    }

    currentServices = data.services || [];
    updateSummaryCounts(currentServices);
    renderServicesGrid();

    if (currentServices.length) {
      let selected = null;

      if (data.cheapestProvider?.provider) {
        selected = currentServices.find(
          (item) => item.provider === data.cheapestProvider.provider
        );
      }

      if (!selected) {
        selected =
          currentServices.find((item) => item.available && item.hasValidPrice) ||
          currentServices.find((item) => item.available) ||
          currentServices[0];
      }

      if (selected) {
        renderSelectedService(selected);
      }
    }
  } catch (error) {
    console.error(error.message);
    servicesGrid.innerHTML = `<p style="color: #ef4444;">${
      error.message || "Could not load services."
    }</p>`;
    currentServices = [];
    selectedServiceData = null;
    updateSummaryCounts([]);
  }
};

const refreshCurrentSelection = async () => {
  if (!selectedCountry || !selectedService) return;

  selectedServiceData = null;
  renderEmptySelection(
    "Service availability has been refreshed. Please choose again."
  );

  await loadServicePricing(selectedCountry, selectedService);
};

const bindServiceSelectButtons = () => {
  document.querySelectorAll(".service-card-btn").forEach((button) => {
    button.addEventListener("click", () => {
      if (button.disabled) return;

      const serviceName = button.dataset.service;
      const providerName = button.dataset.provider;

      const selected = currentServices.find(
        (service) =>
          String(service.name).toLowerCase() === String(serviceName).toLowerCase() &&
          String(service.provider).toLowerCase() === String(providerName).toLowerCase()
      );

      if (!selected) return;

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
    await refreshCurrentSelection();
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

        await refreshCurrentSelection();
        return;
      }

      throw new Error(data.message || "Failed to buy number");
    }

    showMessage(
      "success",
      "Purchase successful",
      `Number purchased for ${formatPrice(
        data.order?.price ?? selectedServiceData.price
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

renderEmptySelection();

if (selectedCountryFlag) {
  selectedCountryFlag.innerHTML = getFlagImg("", "trigger-flag-img");
}

loadMergedCountries();