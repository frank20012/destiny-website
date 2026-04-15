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

const token = localStorage.getItem("token");

const formatPrice = (value) => `₦${Number(value || 0).toLocaleString("en-NG")}`;

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

const renderEmptySelectedService = (message = "Select a country and service to see full details here.") => {
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
    rentServicesCount.textContent = visibleServices.length || currentServices.length;
  }
};

const populateCountryDropdown = () => {
  if (!rentCountryFilter) return;

  rentCountryFilter.innerHTML = `<option value="">Select Country</option>`;

  allCountries.forEach((country) => {
    const option = document.createElement("option");
    option.value = country.id;
    option.dataset.name = country.name;
    option.textContent = country.name;
    rentCountryFilter.appendChild(option);
  });
};

const populateServiceDropdown = () => {
  if (!rentServiceFilter) return;

  rentServiceFilter.innerHTML = `<option value="">Select Service</option>`;

  currentServices.forEach((service) => {
    const option = document.createElement("option");
    option.value = service.id;
    option.dataset.name = service.name;
    option.textContent = `${prettifyText(service.name)} (${formatPrice(service.price)})`;
    rentServiceFilter.appendChild(option);
  });

  rentServiceFilter.disabled = currentServices.length === 0;
};

const getVisibleServices = () => {
  const selectedServiceId = rentServiceFilter?.value || "";

  if (!selectedServiceId) {
    return currentServices;
  }

  return currentServices.filter(
    (service) => String(service.id) === String(selectedServiceId)
  );
};

const getSelectedCountryName = () => {
  const selectedOption = rentCountryFilter?.selectedOptions?.[0];
  return selectedOption?.dataset?.name || "Selected Country";
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

    card.innerHTML = `
      <div class="rent-card-top">
        <span class="rent-tag">${getSelectedCountryName()}</span>
        <strong class="rent-card-price">${formatPrice(service.price)}</strong>
      </div>

      <h3>${prettifyText(service.name)}</h3>
      <p>Temporary rental number service available through SMSPool.</p>

      <div class="rent-meta">
        <span>Country Rental</span>
        <span>Fast OTP Flow</span>
        <span>Provider: SMSPool</span>
      </div>

      <button type="button" class="primary-btn rent-btn" data-id="${service.id}">
        Select Service
      </button>
    `;

    rentNumberGrid.appendChild(card);
  });

  bindRentSelectButtons();
};

const renderSelectedService = (service) => {
  if (!selectedRentServiceBox || !service) return;

  selectedRentService = service;

  selectedRentServiceBox.innerHTML = `
    <div class="selected-rent-service-card">
      <div class="selected-rent-top">
        <div>
          <span class="selected-rent-badge">${getSelectedCountryName()}</span>
          <h3>${prettifyText(service.name)}</h3>
        </div>
        <div class="selected-rent-price">${formatPrice(service.price)}</div>
      </div>

      <div class="selected-rent-meta">
        <div class="selected-rent-meta-box">
          <span>Country</span>
          <strong>${getSelectedCountryName()}</strong>
        </div>

        <div class="selected-rent-meta-box">
          <span>Service</span>
          <strong>${prettifyText(service.name)}</strong>
        </div>

        <div class="selected-rent-meta-box">
          <span>Billing</span>
          <strong>Wallet deduction after successful rent</strong>
        </div>
      </div>

      <div class="selected-rent-actions">
        <button type="button" class="primary-btn" id="buyRentServiceBtn">
          Rent for ${formatPrice(service.price)}
        </button>

        <p class="selected-rent-note">
          The displayed price already includes your live provider price plus markup.
        </p>
      </div>
    </div>
  `;

  document.getElementById("buyRentServiceBtn")?.addEventListener("click", buySelectedRentService);
};

const loadCountries = async () => {
  if (!token) {
    window.location.href = "signin.html";
    return;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/api/rent/countries`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Failed to fetch countries");
    }

    allCountries = data.countries || [];
    populateCountryDropdown();
    updateCounts([]);
  } catch (error) {
    showMessage("error", "Countries failed", error.message || "Could not load countries.");
  }
};

const loadServicesByCountry = async (countryId) => {
  if (!token || !countryId) return;

  rentNumberGrid.innerHTML = `<p style="color: var(--muted);">Loading rental services...</p>`;
  renderEmptySelectedService();

  try {
    const response = await fetch(`${API_BASE_URL}/api/rent/services?country=${encodeURIComponent(countryId)}`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Failed to fetch services");
    }

    currentServices = data.services || [];
    populateServiceDropdown();
    renderRentGrid();
  } catch (error) {
    currentServices = [];
    populateServiceDropdown();
    rentNumberGrid.innerHTML = `<p style="color:#ef4444;">${error.message || "Could not load rental services."}</p>`;
  }
};

const bindRentSelectButtons = () => {
  document.querySelectorAll(".rent-btn").forEach((button) => {
    button.addEventListener("click", () => {
      const serviceId = button.dataset.id;
      const selected = currentServices.find(
        (service) => String(service.id) === String(serviceId)
      );

      if (!selected) return;

      if (rentServiceFilter) {
        rentServiceFilter.value = selected.id;
      }

      renderRentGrid();
      renderSelectedService(selected);
    });
  });
};

const buySelectedRentService = async () => {
  if (!selectedRentService) return;

  if (!token) {
    window.location.href = "signin.html";
    return;
  }

  try {
    const payload = {
      countryId: rentCountryFilter.value,
      countryName: getSelectedCountryName(),
      serviceId: selectedRentService.id,
      serviceName: selectedRentService.name,
      displayedPrice: selectedRentService.price
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
      throw new Error(data.message || "Failed to rent number");
    }

    showMessage("success", "Success", `Number rented successfully for ${formatPrice(selectedRentService.price)}.`);
    window.location.href = "orders.html";
  } catch (error) {
    showMessage("error", "Rent failed", error.message || "Something went wrong.");
    renderEmptySelectedService("Try another country or service.");
  }
};

rentCountryFilter?.addEventListener("change", () => {
  const countryId = rentCountryFilter.value;

  selectedRentService = null;

  if (!countryId) {
    currentServices = [];
    populateServiceDropdown();
    renderEmptySelectedService();
    renderRentGrid();
    updateCounts([]);
    return;
  }

  loadServicesByCountry(countryId);
});

rentServiceFilter?.addEventListener("change", () => {
  const serviceId = rentServiceFilter.value;

  renderRentGrid();

  if (!serviceId) {
    selectedRentService = null;
    renderEmptySelectedService();
    return;
  }

  const selected = currentServices.find(
    (service) => String(service.id) === String(serviceId)
  );

  if (!selected) {
    selectedRentService = null;
    renderEmptySelectedService();
    return;
  }

  renderSelectedService(selected);
});

renderEmptySelectedService();
loadCountries();