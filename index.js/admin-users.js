const API_BASE_URL = "http://localhost:5000";
const token = localStorage.getItem("token");

const adminUserSearchInput = document.getElementById("adminUserSearchInput");
const adminUserRoleFilter = document.getElementById("adminUserRoleFilter");
const adminUserStatusFilter = document.getElementById("adminUserStatusFilter");
const adminUsersTableBody = document.getElementById("adminUsersTableBody");
const adminUsersEmptyMessage = document.getElementById("adminUsersEmptyMessage");
const adminUsersPrevBtn = document.getElementById("adminUsersPrevBtn");
const adminUsersNextBtn = document.getElementById("adminUsersNextBtn");
const adminUsersPageInfo = document.getElementById("adminUsersPageInfo");
const adminUsersPagination = document.getElementById("adminUsersPagination");
const refreshUsersBtn = document.getElementById("refreshUsersBtn");

const usersTotalCount = document.getElementById("usersTotalCount");
const usersActiveCount = document.getElementById("usersActiveCount");
const usersAdminCount = document.getElementById("usersAdminCount");
const usersStandardCount = document.getElementById("usersStandardCount");

const ADMIN_USERS_PER_PAGE = 6;
let adminUsersCurrentPage = 1;
let allAdminUsers = [];
let filteredAdminUsers = [];

const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString();
};

const getStatusClass = (isActive) => {
  return isActive ? "completed" : "cancelled";
};

const getStatusLabel = (isActive) => {
  return isActive ? "active" : "inactive";
};

const renderCounts = () => {
  const activeCount = allAdminUsers.filter((u) => u.isActive).length;
  const adminCount = allAdminUsers.filter((u) => u.role === "admin").length;
  const standardCount = allAdminUsers.filter((u) => u.role === "user").length;

  if (usersTotalCount) usersTotalCount.textContent = allAdminUsers.length;
  if (usersActiveCount) usersActiveCount.textContent = activeCount;
  if (usersAdminCount) usersAdminCount.textContent = adminCount;
  if (usersStandardCount) usersStandardCount.textContent = standardCount;
};

const renderAdminUsersPage = () => {
  if (!adminUsersTableBody) return;

  const totalPages = Math.max(1, Math.ceil(filteredAdminUsers.length / ADMIN_USERS_PER_PAGE));
  if (adminUsersCurrentPage > totalPages) adminUsersCurrentPage = totalPages;

  const start = (adminUsersCurrentPage - 1) * ADMIN_USERS_PER_PAGE;
  const end = start + ADMIN_USERS_PER_PAGE;
  const currentUsers = filteredAdminUsers.slice(start, end);

  adminUsersTableBody.innerHTML = "";

  currentUsers.forEach((user) => {
    const tr = document.createElement("tr");

    tr.innerHTML = `
      <td>#${user._id.slice(-6).toUpperCase()}</td>
      <td>${user.firstName} ${user.lastName}</td>
      <td>${user.email}</td>
      <td>${user.role}</td>
      <td><span class="status ${getStatusClass(user.isActive)}">${getStatusLabel(user.isActive)}</span></td>
      <td>${formatDate(user.createdAt)}</td>
    `;

    adminUsersTableBody.appendChild(tr);
  });

  if (adminUsersPageInfo) {
    adminUsersPageInfo.textContent = `Page ${adminUsersCurrentPage} of ${totalPages}`;
  }

  if (adminUsersPrevBtn) {
    adminUsersPrevBtn.disabled = adminUsersCurrentPage === 1;
  }

  if (adminUsersNextBtn) {
    adminUsersNextBtn.disabled = adminUsersCurrentPage === totalPages;
  }

  if (adminUsersEmptyMessage) {
    adminUsersEmptyMessage.style.display = filteredAdminUsers.length === 0 ? "block" : "none";
  }

  if (adminUsersPagination) {
    adminUsersPagination.style.display = filteredAdminUsers.length === 0 ? "none" : "flex";
  }
};

const filterAdminUsers = () => {
  const searchValue = (adminUserSearchInput?.value || "").toLowerCase().trim();
  const roleValue = adminUserRoleFilter?.value || "all";
  const statusValue = adminUserStatusFilter?.value || "all";

  filteredAdminUsers = allAdminUsers.filter((user) => {
    const text = `${user.firstName} ${user.lastName} ${user.email}`.toLowerCase();
    const matchesSearch = text.includes(searchValue);
    const matchesRole = roleValue === "all" || user.role === roleValue;

    const userStatus = user.isActive ? "active" : "inactive";
    const matchesStatus = statusValue === "all" || userStatus === statusValue;

    return matchesSearch && matchesRole && matchesStatus;
  });

  adminUsersCurrentPage = 1;
  renderAdminUsersPage();
};

const fetchAdminUsers = async () => {
  if (!token) return;

  if (adminUsersTableBody) {
    adminUsersTableBody.innerHTML = `
      <tr>
        <td colspan="6" style="text-align:center; color: var(--muted);">Loading users...</td>
      </tr>
    `;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/api/users/admin/all`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Failed to fetch users");
    }

    allAdminUsers = data.users || [];
    filteredAdminUsers = [...allAdminUsers];
    renderCounts();
    renderAdminUsersPage();
  } catch (error) {
    if (adminUsersTableBody) {
      adminUsersTableBody.innerHTML = `
        <tr>
          <td colspan="6" style="text-align:center; color: #ef4444;">${error.message || "Could not load users."}</td>
        </tr>
      `;
    }
    if (adminUsersPagination) {
      adminUsersPagination.style.display = "none";
    }
  }
};

adminUserSearchInput?.addEventListener("input", filterAdminUsers);
adminUserRoleFilter?.addEventListener("change", filterAdminUsers);
adminUserStatusFilter?.addEventListener("change", filterAdminUsers);

adminUsersPrevBtn?.addEventListener("click", () => {
  if (adminUsersCurrentPage > 1) {
    adminUsersCurrentPage--;
    renderAdminUsersPage();
  }
});

adminUsersNextBtn?.addEventListener("click", () => {
  const totalPages = Math.ceil(filteredAdminUsers.length / ADMIN_USERS_PER_PAGE);
  if (adminUsersCurrentPage < totalPages) {
    adminUsersCurrentPage++;
    renderAdminUsersPage();
  }
});

refreshUsersBtn?.addEventListener("click", fetchAdminUsers);

fetchAdminUsers();