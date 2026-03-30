const API_BASE_URL = "http://localhost:5000";

const filterButtons = document.querySelectorAll(".filter-btn");
const servicesGrid = document.getElementById("servicesGrid");
const servicesEmptyMessage = document.getElementById("servicesEmptyMessage");

let allServices = [];
let activeFilter = "all";

const formatPrice = (price) => {
  return `$${Number(price).toFixed(2)}`;
};

const getCategoryLabel = (category) => {
  const labels = {
    otp: "OTP",
    sms: "SMS",
    voice: "Voice",
    renewal: "Renewal",
    replacement: "Replacement"
  };

  return labels[category] || category;
};

const getServiceTag = (service) => {
  return `${service.country} • ${getCategoryLabel(service.category)}`;
};

const renderServices = () => {
  if (!servicesGrid) return;

  let filteredServices = allServices;

  if (activeFilter !== "all") {
    filteredServices = allServices.filter((service) => {
      if (activeFilter === "popular") {
        return service.category === "otp";
      }

      if (activeFilter === "business") {
        return service.category === "sms" || service.category === "voice";
      }

      if (activeFilter === "api") {
        return service.serviceCode?.toLowerCase().includes("api");
      }

      if (activeFilter === "standard") {
        return service.category === "otp";
      }

      if (activeFilter === "advanced") {
        return service.category === "voice" || service.category === "replacement";
      }

      return true;
    });
  }

  servicesGrid.innerHTML = "";

  if (filteredServices.length === 0) {
    if (servicesEmptyMessage) {
      servicesEmptyMessage.style.display = "block";
    }
    return;
  }

  if (servicesEmptyMessage) {
    servicesEmptyMessage.style.display = "none";
  }

  filteredServices.forEach((service) => {
    const article = document.createElement("article");
    article.className = "service-card";

    article.innerHTML = `
      <div class="card-top">
        <span class="service-type">${getServiceTag(service)}</span>
        <span class="service-price">${formatPrice(service.price)}</span>
      </div>

      <h3>${service.name}</h3>
      <p>${service.description || "Virtual number service available for OTP delivery."}</p>

      <ul>
        <li>Country: ${service.country}</li>
        <li>Delivery: ${service.deliveryType}</li>
        <li>Status: ${service.status}</li>
      </ul>

       <a href="checkout.html?serviceId=${service._id}" class="card-btn">Select Service</a>
    `;

    servicesGrid.appendChild(article);
  });
};

const fetchServices = async () => {
  if (!servicesGrid) return;

  servicesGrid.innerHTML = `<p style="color: var(--muted);">Loading services...</p>`;

  try {
    const response = await fetch(`${API_BASE_URL}/api/services`);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Failed to fetch services");
    }

    allServices = data.services || [];
    renderServices();
  } catch (error) {
    servicesGrid.innerHTML = `<p style="color: #ef4444;">${error.message || "Could not load services."}</p>`;
  }
};

filterButtons.forEach((button) => {
  button.addEventListener("click", () => {
    activeFilter = button.dataset.filter || "all";

    filterButtons.forEach((btn) => btn.classList.remove("active"));
    button.classList.add("active");

    renderServices();
  });
});

fetchServices();