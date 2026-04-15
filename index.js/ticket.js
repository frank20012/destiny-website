const API_BASE_URL = CONFIG.API_BASE_URL;

const ticketForm = document.getElementById("ticketForm");
const ticketSubject = document.getElementById("ticketSubject");
const ticketPriority = document.getElementById("ticketPriority");
const ticketMessage = document.getElementById("ticketMessage");
const ticketFormMessage = document.getElementById("ticketFormMessage");
const ticketList = document.getElementById("ticketList");

const ticketsTotalCount = document.getElementById("ticketsTotalCount");
const ticketsOpenCount = document.getElementById("ticketsOpenCount");
const ticketsResolvedCount = document.getElementById("ticketsResolvedCount");

const token = localStorage.getItem("token");

let tickets = [];

const showMessage = (text, type = "normal") => {
  if (!ticketFormMessage) return;
  ticketFormMessage.textContent = text;
  ticketFormMessage.style.color =
    type === "error"
      ? "#dc2626"
      : type === "success"
      ? "#16a34a"
      : "";
};

const updateStats = () => {
  if (ticketsTotalCount) ticketsTotalCount.textContent = tickets.length;
  if (ticketsOpenCount) ticketsOpenCount.textContent = tickets.filter((ticket) => ticket.status === "open").length;
  if (ticketsResolvedCount) ticketsResolvedCount.textContent = tickets.filter((ticket) => ticket.status === "resolved").length;
};

const renderTickets = () => {
  if (!ticketList) return;

  updateStats();
  ticketList.innerHTML = "";

  if (!tickets.length) {
    ticketList.innerHTML = `
      <div class="ticket-empty-box">
        <i class="fa-solid fa-ticket"></i>
        <p>No tickets yet.</p>
      </div>
    `;
    return;
  }

  tickets.forEach((ticket) => {
    const article = document.createElement("article");
    article.className = "ticket-item";

    article.innerHTML = `
      <div class="ticket-item-top">
        <div>
          <h3>${ticket.subject || "Untitled Ticket"}</h3>
          <p>${ticket.message || "-"}</p>
        </div>
        <div class="ticket-meta">
          <span class="ticket-badge ${ticket.priority || "medium"}">${ticket.priority || "medium"}</span>
          <span class="ticket-badge ${ticket.status || "open"}">${ticket.status || "open"}</span>
        </div>
      </div>
    `;

    ticketList.appendChild(article);
  });
};

const fetchTickets = async () => {
  if (!token) {
    ticketList.innerHTML = `
      <div class="ticket-empty-box">
        <i class="fa-solid fa-lock"></i>
        <p>Please sign in to view your tickets.</p>
      </div>
    `;
    return;
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

    tickets = data.tickets || [];
    renderTickets();
  } catch (error) {
    ticketList.innerHTML = `
      <div class="ticket-empty-box">
        <i class="fa-solid fa-triangle-exclamation"></i>
        <p>${error.message || "Could not load tickets."}</p>
      </div>
    `;
  }
};

ticketForm?.addEventListener("submit", async (event) => {
  event.preventDefault();

  if (!token) {
    showMessage("You need to sign in first.", "error");
    return;
  }

  const payload = {
    subject: ticketSubject?.value.trim() || "",
    priority: ticketPriority?.value || "medium",
    message: ticketMessage?.value.trim() || ""
  };

  if (!payload.subject || !payload.message) {
    showMessage("Subject and message are required.", "error");
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
  } catch (error) {
    showMessage(error.message || "Could not create ticket.", "error");
  }
});

fetchTickets();