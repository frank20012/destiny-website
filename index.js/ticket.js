const API_BASE_URL = "http://localhost:5000";
import { getStoredToken, getStoredUser } from "./auth-storage.js";

const token = getStoredToken();
const user = getStoredUser();

const ticketForm = document.getElementById("ticketForm");
const ticketSubject = document.getElementById("ticketSubject");
const ticketCategory = document.getElementById("ticketCategory");
const ticketMessage = document.getElementById("ticketMessage");
const ticketMessageBox = document.getElementById("ticketMessageBox");
const ticketList = document.getElementById("ticketList");

const getStatusClass = (status) => {
  const map = {
    open: "pending",
    review: "processing",
    resolved: "completed"
  };
  return map[status] || "pending";
};

const formatDate = (dateString) => {
  if (!dateString) return "-";
  const date = new Date(dateString);
  return date.toLocaleDateString();
};

const showMessage = (text, type = "error") => {
  if (!ticketMessageBox) return;
  ticketMessageBox.textContent = text;
  ticketMessageBox.className = `form-message ${type}`;
};

const clearMessage = () => {
  if (!ticketMessageBox) return;
  ticketMessageBox.textContent = "";
  ticketMessageBox.className = "form-message";
};

const renderTickets = (tickets) => {
  if (!ticketList) return;

  if (!tickets.length) {
    ticketList.innerHTML = `
      <div class="ticket-item">
        <div>
          <h4>No tickets yet</h4>
          <p>Your submitted tickets will appear here.</p>
        </div>
      </div>
    `;
    return;
  }

  ticketList.innerHTML = "";

  tickets.forEach((ticket) => {
    const item = document.createElement("div");
    item.className = "ticket-item";

    item.innerHTML = `
      <div class="ticket-top">
        <div>
          <h4>${ticket.subject}</h4>
          <p>${ticket.category} • ${formatDate(ticket.createdAt)}</p>
        </div>
        <span class="status ${getStatusClass(ticket.status)}">${ticket.status}</span>
      </div>

      <div class="ticket-body">
        <p>${ticket.message}</p>
      </div>

      <div class="ticket-reply-box">
        <strong>Admin Reply</strong>
        <p>${ticket.adminReply || "No reply yet."}</p>
      </div>
    `;

    ticketList.appendChild(item);
  });
};

const fetchTickets = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/tickets/me`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Failed to fetch tickets");
    }

    renderTickets(data.tickets || []);
  } catch (error) {
    showMessage(error.message || "Could not load tickets.");
  }
};

if (ticketForm) {
  ticketForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    clearMessage();

    const payload = {
      subject: ticketSubject?.value.trim(),
      category: ticketCategory?.value,
      message: ticketMessage?.value.trim()
    };

    if (!payload.subject || !payload.message) {
      showMessage("Subject and message are required.");
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/tickets`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to create ticket");
      }

      ticketForm.reset();
      showMessage("Ticket submitted successfully.", "success");
      await fetchTickets();

      if (typeof showToast === "function") {
        showToast("success", "Ticket submitted", "Support has received your message.");
      }
    } catch (error) {
      showMessage(error.message || "Something went wrong.");
    }
  });
}

fetchTickets();