const contactForm = document.getElementById("contactForm");
const contactName = document.getElementById("contactName");
const contactPhone = document.getElementById("contactPhone");
const contactEmail = document.getElementById("contactEmail");
const contactTag = document.getElementById("contactTag");
const contactNote = document.getElementById("contactNote");
const contactFormMessage = document.getElementById("contactFormMessage");
const contactList = document.getElementById("contactList");
const contactSearchInput = document.getElementById("contactSearchInput");

const contactsTotalCount = document.getElementById("contactsTotalCount");
const contactsPhoneCount = document.getElementById("contactsPhoneCount");
const contactsEmailCount = document.getElementById("contactsEmailCount");

const CONTACTS_STORAGE_KEY = "deskotp_contacts";

let contacts = [];

const showMessage = (text, type = "normal") => {
  if (!contactFormMessage) return;

  contactFormMessage.textContent = text;
  contactFormMessage.style.color =
    type === "error"
      ? "#dc2626"
      : type === "success"
      ? "#16a34a"
      : "";
};

const loadContacts = () => {
  try {
    contacts = JSON.parse(localStorage.getItem(CONTACTS_STORAGE_KEY)) || [];
  } catch (error) {
    contacts = [];
  }
};

const saveContacts = () => {
  localStorage.setItem(CONTACTS_STORAGE_KEY, JSON.stringify(contacts));
};

const updateStats = (items = contacts) => {
  if (contactsTotalCount) {
    contactsTotalCount.textContent = items.length;
  }

  if (contactsPhoneCount) {
    contactsPhoneCount.textContent = items.filter((item) => item.phone).length;
  }

  if (contactsEmailCount) {
    contactsEmailCount.textContent = items.filter((item) => item.email).length;
  }
};

const renderEmptyState = (message = "No contacts saved yet.") => {
  if (!contactList) return;

  contactList.innerHTML = `
    <div class="contact-empty-box">
      <i class="fa-solid fa-address-book"></i>
      <p>${message}</p>
    </div>
  `;
};

const renderContacts = (items = contacts) => {
  if (!contactList) return;

  updateStats(items);
  contactList.innerHTML = "";

  if (!items.length) {
    renderEmptyState();
    return;
  }

  items.forEach((contact) => {
    const article = document.createElement("article");
    article.className = "contact-item";

    article.innerHTML = `
      <div class="contact-item-main">
        <h3>${contact.name}</h3>
        ${contact.phone ? `<p><strong>Phone:</strong> ${contact.phone}</p>` : ""}
        ${contact.email ? `<p><strong>Email:</strong> ${contact.email}</p>` : ""}
        ${contact.note ? `<p><strong>Note:</strong> ${contact.note}</p>` : ""}
        ${contact.tag ? `<span class="contact-tag">${contact.tag}</span>` : ""}
      </div>

      <div class="contact-item-actions">
        <button type="button" class="contact-delete-btn" data-id="${contact.id}">
          Delete
        </button>
      </div>
    `;

    contactList.appendChild(article);
  });

  bindDeleteButtons();
};

const bindDeleteButtons = () => {
  document.querySelectorAll(".contact-delete-btn").forEach((button) => {
    button.addEventListener("click", () => {
      const id = button.dataset.id;

      contacts = contacts.filter((item) => item.id !== id);
      saveContacts();

      const filtered = filterContacts(contactSearchInput?.value || "");
      renderContacts(filtered);

      if (typeof showToast === "function") {
        showToast("success", "Deleted", "Contact removed successfully.");
      }
    });
  });
};

const filterContacts = (search = "") => {
  const value = String(search).toLowerCase().trim();

  if (!value) return contacts;

  return contacts.filter((item) => {
    return (
      (item.name || "").toLowerCase().includes(value) ||
      (item.phone || "").toLowerCase().includes(value) ||
      (item.email || "").toLowerCase().includes(value) ||
      (item.tag || "").toLowerCase().includes(value) ||
      (item.note || "").toLowerCase().includes(value)
    );
  });
};

contactForm?.addEventListener("submit", (event) => {
  event.preventDefault();

  const payload = {
    id: Date.now().toString(),
    name: contactName?.value.trim() || "",
    phone: contactPhone?.value.trim() || "",
    email: contactEmail?.value.trim() || "",
    tag: contactTag?.value.trim() || "",
    note: contactNote?.value.trim() || ""
  };

  if (!payload.name) {
    showMessage("Full name is required.", "error");
    return;
  }

  contacts.unshift(payload);
  saveContacts();

  const filtered = filterContacts(contactSearchInput?.value || "");
  renderContacts(filtered);

  contactForm.reset();
  showMessage("Contact saved successfully.", "success");

  if (typeof showToast === "function") {
    showToast("success", "Saved", "Contact saved successfully.");
  }
});

contactSearchInput?.addEventListener("input", () => {
  const filtered = filterContacts(contactSearchInput.value);

  if (!filtered.length && contacts.length > 0) {
    updateStats(filtered);
    renderEmptyState("No matching contact found.");
    return;
  }

  renderContacts(filtered);
});

loadContacts();
renderContacts();