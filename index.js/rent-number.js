const API_BASE_URL = CONFIG.API_BASE_URL;

const rentNumberGrid = document.getElementById("rentNumberGrid");
const rentNumberEmptyMessage = document.getElementById("rentNumberEmptyMessage");

const formatPrice = (value) => `$${Number(value || 0).toFixed(2)}`;

const renderServices = (services) => {
  if (!rentNumberGrid) return;

  const activeServices = services.filter((service) => service.status === "active");

  if (!activeServices.length) {
    rentNumberGrid.innerHTML = "";
    if (rentNumberEmptyMessage) {
      rentNumberEmptyMessage.style.display = "block";
    }
    return;
  }

  if (rentNumberEmptyMessage) {
    rentNumberEmptyMessage.style.display = "none";
  }

  rentNumberGrid.innerHTML = "";

  activeServices.forEach((service) => {
    const card = document.createElement("div");
    card.className = "rent-card card";

    card.innerHTML = `
      <div class="rent-card-top">
        <span class="rent-tag">${service.country}</span>
        <strong>${formatPrice(service.price)}</strong>
      </div>
      <h3>${service.name}</h3>
      <p>${service.description || "Virtual number rental service available."}</p>
      <div class="rent-meta">
        <span>${service.category}</span>
        <span>${service.deliveryType}</span>
      </div>
      <a href="checkout.html?serviceId=${service._id}" class="primary-btn rent-btn">Rent Now</a>
    `;

    rentNumberGrid.appendChild(card);
  });
};

const fetchServices = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/services`);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Failed to fetch services");
    }

    renderServices(data.services || []);
  } catch (error) {
    if (rentNumberGrid) {
      rentNumberGrid.innerHTML = `<p style="color:#ef4444;">${error.message || "Could not load services."}</p>`;
    }
  }
};

fetchServices();