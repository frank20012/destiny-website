const API_BASE_URL = "http://localhost:5000";
const token = localStorage.getItem("token");

const ticketForm = document.getElementById("ticketForm");
const ticketSubject = document.getElementById("ticketSubject");
const ticketCategory = document.getElementById("ticketCategory");
const ticketPriority = document.getElementById("ticketPriority");
const ticketReference = document.getElementById("ticketReference");
const ticketMessage = document.getElementById("ticketMessage");
const ticketMessageBox = document.getElementById("ticketMessageBox");
const ticketsTableBody = document.getElementById("ticketsTableBody");

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

const getStatusClass = (status) => {
  const map = {
    open: "pending",
    review: "processing",
    resolved: "completed"
  };
  return map[status] || "pending";
};

const getPriorityClass = (priority) => {
  return priority || "medium";
};

const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString();
};

const renderTickets = (tickets) => {
  if (!ticketsTableBody) return;

  if (!tickets.length) {
    ticketsTableBody.innerHTML = `
      <tr>
        <td colspan="6" style="text-align:center; color: var(--muted);">No tickets found.</td>
      </tr>
    `;
    return;
  }

  ticketsTableBody.innerHTML = "";

  tickets.forEach((ticket) => {
    const tr = document.createElement("tr");

    tr.innerHTML = `
      <td>#${ticket._id.slice(-6).toUpperCase()}</td>
      <td>${ticket.subject}</td>
      <td>${ticket.category}</td>
      <td><span class="status ${getStatusClass(ticket.status)}">${ticket.status}</span></td>
      <td><span class="priority ${getPriorityClass(ticket.priority)}">${ticket.priority}</span></td>
      <td>${formatDate(ticket.createdAt)}</td>
    `;

    ticketsTableBody.appendChild(tr);
  });
};

const fetchTickets = async () => {
  if (!token) {
    if (ticketsTableBody) {
      ticketsTableBody.innerHTML = `
        <tr>
          <td colspan="6" style="text-align:center; color: var(--muted);">Please sign in to view tickets.</td>
        </tr>
      `;
    }
    return;
  }

  if (ticketsTableBody) {
    ticketsTableBody.innerHTML = `
      <tr>
        <td colspan="6" style="text-align:center; color: var(--muted);">Loading tickets...</td>
      </tr>
    `;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/api/tickets`, {
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
    if (ticketsTableBody) {
      ticketsTableBody.innerHTML = `
        <tr>
          <td colspan="6" style="text-align:center; color: #ef4444;">${error.message || "Could not load tickets."}</td>
        </tr>
      `;
    }
  }
};

if (ticketForm) {
  ticketForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    clearMessage();

    if (!token) {
      showMessage("Please sign in first.");
      return;
    }

    const subject = ticketSubject?.value.trim();
    const category = ticketCategory?.value;
    const priority = ticketPriority?.value || "medium";
    const referenceId = ticketReference?.value.trim() || "";
    const message = ticketMessage?.value.trim();

    if (!subject || !category || !message) {
      showMessage("Subject, category, and message are required.");
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/tickets`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          subject,
          category,
          priority,
          referenceId,
          message
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to create ticket");
      }

      showMessage("Ticket submitted successfully.", "success");
      ticketForm.reset();
      await fetchTickets();

      if (typeof showToast === "function") {
        showToast("success", "Ticket created", "Your support ticket was submitted successfully.");
      }
    } catch (error) {
      showMessage(error.message || "Something went wrong.");
    }
  });
}

fetchTickets();