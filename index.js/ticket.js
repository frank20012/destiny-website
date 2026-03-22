const ticketForm = document.getElementById("ticketForm");

if (ticketForm) {
  ticketForm.addEventListener("submit", (e) => {
    e.preventDefault();
    showToast("success", "Ticket submitted", "Your support ticket has been created successfully.");
    ticketForm.reset();
  });
}