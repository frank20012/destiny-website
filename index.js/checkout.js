const API_BASE_URL = "http://localhost:5000";

const checkoutForm = document.getElementById("checkoutForm");
const serviceNameInput = document.getElementById("serviceName");
const serviceCategoryInput = document.getElementById("serviceCategory");
const summaryServicePrice = document.getElementById("summaryServicePrice");
const summaryTotalPrice = document.getElementById("summaryTotalPrice");
const summaryDeliveryType = document.getElementById("summaryDeliveryType");
const walletBalanceEl = document.getElementById("walletBalance");
const walletStatusEl = document.getElementById("walletStatus");
const checkoutMessage = document.getElementById("checkoutMessage");

const token = localStorage.getItem("token");
const user = JSON.parse(localStorage.getItem("user") || "null");

let selectedService = null;

const showMessage = (text, type = "error") => {
  if (!checkoutMessage) return;
  checkoutMessage.textContent = text;
  checkoutMessage.className = `form-message ${type}`;
};

const clearMessage = () => {
  if (!checkoutMessage) return;
  checkoutMessage.textContent = "";
  checkoutMessage.className = "form-message";
};

const formatPrice = (price) => `$${Number(price).toFixed(2)}`;

const getServiceIdFromUrl = () => {
  const params = new URLSearchParams(window.location.search);
  return params.get("serviceId");
};

const fetchWallet = async () => {
  if (!token) return;

  try {
    const response = await fetch(`${API_BASE_URL}/api/wallet`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Failed to fetch wallet");
    }

    if (walletBalanceEl) {
      walletBalanceEl.textContent = formatPrice(data.wallet.balance);
    }

    if (walletStatusEl) {
      walletStatusEl.textContent = data.wallet.status;
    }
  } catch (error) {
    if (walletBalanceEl) {
      walletBalanceEl.textContent = "Unavailable";
    }

    if (walletStatusEl) {
      walletStatusEl.textContent = "Error";
    }
  }
};

const fetchService = async () => {
  const serviceId = getServiceIdFromUrl();

  if (!serviceId) {
    showMessage("No service selected.");
    return;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/api/services`);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Failed to fetch services");
    }

    selectedService = (data.services || []).find(
      (service) => service._id === serviceId
    );

    if (!selectedService) {
      throw new Error("Selected service not found");
    }

    if (serviceNameInput) {
      serviceNameInput.value = selectedService.name;
    }

    if (serviceCategoryInput) {
      serviceCategoryInput.value = selectedService.category;
    }

    if (summaryServicePrice) {
      summaryServicePrice.textContent = formatPrice(selectedService.price);
    }

    if (summaryTotalPrice) {
      summaryTotalPrice.textContent = formatPrice(selectedService.price);
    }

    if (summaryDeliveryType) {
      summaryDeliveryType.textContent = selectedService.deliveryType;
    }
  } catch (error) {
    showMessage(error.message || "Could not load service.");
  }
};

if (checkoutForm) {
  checkoutForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    clearMessage();

    if (!token) {
      showMessage("You must be logged in to place an order.");
      return;
    }

    if (!selectedService) {
      showMessage("No service selected.");
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/orders`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          serviceId: selectedService._id
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to create order");
      }

      showMessage("Order placed successfully.", "success");

      if (typeof showToast === "function") {
        showToast("success", "Order placed", "Your OTP order was created successfully.");
      }

      setTimeout(() => {
        window.location.href = "orders.html";
      }, 1000);
    } catch (error) {
      showMessage(error.message || "Something went wrong.");
    }
  });
}

if (!user || !token) {
  showMessage("Please sign in first.");
} else {
  fetchService();
  fetchWallet();
}