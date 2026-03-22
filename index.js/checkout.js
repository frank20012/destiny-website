const checkoutForm = document.getElementById("checkoutForm");

if (checkoutForm) {
  checkoutForm.addEventListener("submit", (e) => {
    e.preventDefault();
    showToast("success", "Order placed", "Your service order has been submitted successfully.");
  });
}