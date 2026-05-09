import { getStoredToken } from "./auth-storage.js";

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

let tickets = [];

const getToken = () => getStoredToken();

const escapeHtml = (value = "") => {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
};

const formatDate = (dateString) => {
  if (!dateString) return "Recently";

  const date = new Date(dateString);

  if (Number.isNaN(date.getTime())) {
    return "Recently";
  }

  return date.toLocaleString();
};

const normalizeStatus = (status = "open") => {
  return String(status || "open").trim().toLowerCase();
};

const normalizePriority = (priority = "medium") => {
  return String(priority || "medium").trim().toLowerCase();
};

const showMessage = (text, type = "normal") => {
  if (!ticketFormMessage) return;

  ticketFormMessage.textContent = text;
  ticketFormMessage.className = `form-message ${type}`;

  ticketFormMessage.style.color =
    type === "error"
      ? "#dc2626"
      : type === "success"
      ? "#16a34a"
      : "";
};

const showToastMessage = (type, title, message) => {
  if (typeof showToast === "function") {
    showToast(type, title, message);
  }
};

const updateStats = () => {
  const totalCount = tickets.length;
  const openCount = tickets.filter(
    (ticket) => normalizeStatus(ticket.status) === "open"
  ).length;
  const resolvedCount = tickets.filter(
    (ticket) => normalizeStatus(ticket.status) === "resolved"
  ).length;

  if (ticketsTotalCount) ticketsTotalCount.textContent = totalCount;
  if (ticketsOpenCount) ticketsOpenCount.textContent = openCount;
  if (ticketsResolvedCount) ticketsResolvedCount.textContent = resolvedCount;
};

const renderEmptyState = (
  icon = "fa-ticket",
  title = "No tickets yet.",
  message = "When you create a support ticket, it will appear here."
) => {
  if (!ticketList) return;

  ticketList.innerHTML = `
    <div class="ticket-empty-box">
      <i class="fa-solid ${icon}"></i>
      <h3>${escapeHtml(title)}</h3>
      <p>${escapeHtml(message)}</p>
    </div>
  `;
};

const renderTickets = () => {
  if (!ticketList) return;

  updateStats();
  ticketList.innerHTML = "";

  if (!tickets.length) {
    renderEmptyState();
    return;
  }

  ticketList.innerHTML = tickets
    .map((ticket) => {
      const subject = escapeHtml(ticket.subject || "Untitled Ticket");
      const message = escapeHtml(ticket.message || "-");
      const priority = normalizePriority(ticket.priority);
      const status = normalizeStatus(ticket.status);
      const adminReply = escapeHtml(ticket.adminReply || ticket.reply || "");
      const createdAt = formatDate(ticket.createdAt);

      return `
        <article class="ticket-item">
          <div class="ticket-item-top">
            <div class="ticket-main-copy">
              <div class="ticket-title-row">
                <span class="ticket-icon">
                  <i class="fa-solid fa-ticket"></i>
                </span>

                <div>
                  <h3>${subject}</h3>
                  <small>${escapeHtml(createdAt)}</small>
                </div>
              </div>

              <p>${message}</p>

              ${
                adminReply
                  ? `
                    <div class="ticket-admin-reply">
                      <strong>
                        <i class="fa-solid fa-reply"></i>
                        Admin Reply
                      </strong>
                      <p>${adminReply}</p>
                    </div>
                  `
                  : ""
              }
            </div>

            <div class="ticket-meta">
              <span class="ticket-badge priority-${priority}">
                <i class="fa-solid fa-flag"></i>
                ${escapeHtml(priority)}
              </span>

              <span class="ticket-badge status-${status}">
                <i class="fa-solid fa-circle"></i>
                ${escapeHtml(status)}
              </span>
            </div>
          </div>
        </article>
      `;
    })
    .join("");
};

const setSubmitButtonLoading = (isLoading) => {
  const submitButton = ticketForm?.querySelector('button[type="submit"]');

  if (!submitButton) return;

  if (isLoading) {
    submitButton.disabled = true;
    submitButton.dataset.originalText = submitButton.innerHTML;
    submitButton.innerHTML = `
      <i class="fa-solid fa-spinner fa-spin"></i>
      Submitting...
    `;
    return;
  }

  submitButton.disabled = false;

  if (submitButton.dataset.originalText) {
    submitButton.innerHTML = submitButton.dataset.originalText;
  }
};

const fetchTickets = async () => {
  const token = getToken();

  if (!ticketList) return;

  if (!token) {
    updateStats();
    renderEmptyState(
      "fa-lock",
      "Login required",
      "Please sign in to view your support tickets."
    );
    return;
  }

  try {
    renderEmptyState(
      "fa-spinner fa-spin",
      "Loading tickets",
      "Please wait while we fetch your support tickets."
    );

    const response = await fetch(`${API_BASE_URL}/api/tickets`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Failed to fetch tickets");
    }

    tickets = Array.isArray(data.tickets) ? data.tickets : [];
    renderTickets();
  } catch (error) {
    console.error("Ticket fetch error:", error.message);

    tickets = [];
    updateStats();

    renderEmptyState(
      "fa-triangle-exclamation",
      "Could not load tickets",
      error.message || "Could not load tickets."
    );
  }
};

ticketForm?.addEventListener("submit", async (event) => {
  event.preventDefault();

  const token = getToken();

  if (!token) {
    showMessage("You need to sign in first.", "error");
    showToastMessage("error", "Login required", "Please sign in first.");
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
    setSubmitButtonLoading(true);
    showMessage("");

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
    showToastMessage("success", "Ticket created", "Your support ticket was submitted.");

    await fetchTickets();
  } catch (error) {
    console.error("Ticket create error:", error.message);

    showMessage(error.message || "Could not create ticket.", "error");
    showToastMessage(
      "error",
      "Ticket failed",
      error.message || "Could not create ticket."
    );
  } finally {
    setSubmitButtonLoading(false);
  }
});

fetchTickets();