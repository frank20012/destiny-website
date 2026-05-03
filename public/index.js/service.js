import { getStoredToken } from "./auth-storage.js";

const API_BASE_URL = CONFIG.API_BASE_URL;

const selectedServiceBox = document.getElementById("selectedServiceBox");

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
    return "Price at checkout";
  }

  return `₦${Number(price).toLocaleString("en-NG", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`;
};

const formatMoney = (value) =>
  `₦${Number(value || 0).toLocaleString("en-NG", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`;

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

const isInsufficientBalanceMessage = (message) => {
  const text = String(message || "").toLowerCase();
  return text.includes("insufficient wallet balance");
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

const openDropdown = (dropdown) => dropdown?.classList.add("is-open");
const closeDropdown = (dropdown) => dropdown?.classList.remove("is-open");
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

const renderEmptySelection = (
  message = "Select a country and service to see the final price here."
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
          <span>Provider</span>
          <strong>${prettifyText(service.provider)}</strong>
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
              : "Continue to Checkout"
          }
        </button>

        ${
          isAvailable && !hasValidPrice
            ? `<p class="selected-service-note">This provider has stock, but the exact price will be resolved at checkout.</p>`
            : service.stockMode === "estimated_from_catalog"
            ? `<p class="selected-service-note">This provider price/stock is currently estimated from catalog fallback.</p>`
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
  renderEmptySelection("Loading final price...");

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
    } else {
      renderEmptySelection("No available service found for this selection.");
    }
  } catch (error) {
    console.error(error.message);
    renderEmptySelection(error.message || "Could not load final price.");
  }
};

const buildInsufficientBalanceMessage = (data = {}) => {
  const requiredAmount = Number(data.requiredAmount || 0);
  const walletBalance = Number(data.walletBalance || 0);
  const shortfall = Number(data.shortfall || 0);

  const parts = ["Insufficient wallet balance."];

  if (requiredAmount > 0) {
    parts.push(`Required: ${formatMoney(requiredAmount)}`);
  }

  if (walletBalance >= 0) {
    parts.push(`Wallet: ${formatMoney(walletBalance)}`);
  }

  if (shortfall > 0) {
    parts.push(`Shortfall: ${formatMoney(shortfall)}`);
  }

  return parts.join(" ");
};

const buySelectedService = async () => {
  if (!selectedServiceData) return;

  if (!selectedServiceData.available) {
    showMessage(
      "error",
      "Out of stock",
      "This service is currently out of stock."
    );
    return;
  }

  const token = getToken();

  if (!token) {
    showMessage("error", "Login required", "You must be logged in.");
    window.location.href = "signin.html";
    return;
  }

  const buyButton = document.getElementById("buySelectedServiceBtn");
  const originalButtonText = buyButton?.innerHTML || "Continue to Checkout";

  try {
    if (buyButton) {
      buyButton.disabled = true;
      buyButton.innerHTML = "Processing...";
    }

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
        return;
      }

      if (isInsufficientBalanceMessage(data.message)) {
        showMessage(
          "error",
          "Low wallet balance",
          buildInsufficientBalanceMessage(data)
        );
        return;
      }

      throw new Error(data.message || "Failed to buy number");
    }

    showMessage(
      "success",
      "Purchase successful",
      "Number purchased successfully."
    );

    window.location.href = "orders.html";
  } catch (error) {
    showMessage(
      "error",
      "Purchase failed",
      error.message || "Something went wrong."
    );
  } finally {
    if (buyButton) {
      buyButton.disabled = false;
      buyButton.innerHTML = originalButtonText;
    }
  }
};

renderEmptySelection();

if (selectedCountryFlag) {
  selectedCountryFlag.innerHTML = getFlagImg("", "trigger-flag-img");
}

loadMergedCountries();