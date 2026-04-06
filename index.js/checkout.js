const API_BASE_URL = "http://localhost:5000";

const token = localStorage.getItem("token");

const checkoutServiceBox = document.getElementById("checkoutServiceBox");
const checkoutServicePrice = document.getElementById("checkoutServicePrice");
const checkoutWalletBalance = document.getElementById("checkoutWalletBalance");
const checkoutBalanceStatus = document.getElementById("checkoutBalanceStatus");
const placeOrderBtn = document.getElementById("placeOrderBtn");
const checkoutMessage = document.getElementById("checkoutMessage");

const params = new URLSearchParams(window.location.search);
const serviceId = params.get("serviceId");

let selectedService = null;
let currentWalletBalance = 0;
let isSubmittingOrder = false;

const formatPrice = (value) => `$${Number(value || 0).toFixed(2)}`;

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

const updateBalanceStatus = () => {
  if (!selectedService || !checkoutBalanceStatus) return;

  const servicePrice = Number(selectedService.price || 0);

  if (currentWalletBalance >= servicePrice) {
    checkoutBalanceStatus.textContent = "Sufficient Balance";
    checkoutBalanceStatus.className = "success-text";
    if (placeOrderBtn) placeOrderBtn.disabled = false;
  } else {
    checkoutBalanceStatus.textContent = "Insufficient Balance";
    checkoutBalanceStatus.className = "failed-text";
    if (placeOrderBtn) placeOrderBtn.disabled = true;
  }
};

const renderService = () => {
  if (!checkoutServiceBox || !selectedService) return;

  checkoutServiceBox.innerHTML = `
    <div class="checkout-service-card">
      <div class="service-meta-row">
        <span class="service-tag">${selectedService.country || "-"}</span>
        <strong>${formatPrice(selectedService.price)}</strong>
      </div>

      <h3>${selectedService.name || "Unnamed Service"}</h3>
      <p>${selectedService.description || "No description available."}</p>

      <div class="service-extra-meta">
        <span>${selectedService.category || "-"}</span>
        <span>${selectedService.deliveryType || "-"}</span>
        <span>${selectedService.status || "-"}</span>
      </div>
    </div>
  `;

  if (checkoutServicePrice) {
    checkoutServicePrice.textContent = formatPrice(selectedService.price);
  }

  updateBalanceStatus();
};

const fetchService = async () => {
  if (!serviceId) {
    showMessage("No service selected.");
    if (checkoutServiceBox) {
      checkoutServiceBox.innerHTML = `<p>No service selected.</p>`;
    }
    if (placeOrderBtn) placeOrderBtn.disabled = true;
    return;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/api/services`);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Failed to fetch services");
    }

    const services = data.services || [];
    selectedService = services.find((service) => service._id === serviceId);

    if (!selectedService) {
      throw new Error("Selected service not found");
    }

    renderService();
  } catch (error) {
    showMessage(error.message || "Could not load service.");
    if (checkoutServiceBox) {
      checkoutServiceBox.innerHTML = `<p>${error.message || "Could not load service."}</p>`;
    }
    if (placeOrderBtn) placeOrderBtn.disabled = true;
  }
};

const fetchWallet = async () => {
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

    currentWalletBalance = Number(data.wallet?.balance || 0);

    if (checkoutWalletBalance) {
      checkoutWalletBalance.textContent = formatPrice(currentWalletBalance);
    }

    updateBalanceStatus();
  } catch (error) {
    showMessage(error.message || "Could not load wallet.");
    if (placeOrderBtn) placeOrderBtn.disabled = true;
  }
};

const createOrder = async () => {
  if (!selectedService) {
    showMessage("No service selected.");
    return;
  }

  if (isSubmittingOrder) return;

  clearMessage();
  isSubmittingOrder = true;

  if (placeOrderBtn) {
    placeOrderBtn.disabled = true;
    placeOrderBtn.textContent = "Placing Order...";
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
      throw new Error(data.message || "Failed to place order");
    }

    showMessage("Order placed successfully.", "success");

    if (typeof showToast === "function") {
      showToast("success", "Order placed", "Your order was created successfully.");
    }

    setTimeout(() => {
      window.location.href = "orders.html";
    }, 900);
  } catch (error) {
    showMessage(error.message || "Something went wrong.");
  } finally {
    isSubmittingOrder = false;
    if (placeOrderBtn) {
      placeOrderBtn.textContent = "Place Order";
      updateBalanceStatus();
    }
  }
};

placeOrderBtn?.addEventListener("click", createOrder);

const initCheckout = async () => {
  await Promise.all([fetchService(), fetchWallet()]);
};

initCheckout();