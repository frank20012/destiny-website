const API_BASE_URL = CONFIG.API_BASE_URL;
import { getStoredToken, getStoredUser } from "./auth-storage.js";


const token = getStoredToken();
const user = getStoredUser();

const refreshReportsBtn = document.getElementById("refreshReportsBtn");

const reportsTotalRevenue = document.getElementById("reportsTotalRevenue");
const reportsTotalCredits = document.getElementById("reportsTotalCredits");
const reportsTotalRefunds = document.getElementById("reportsTotalRefunds");
const reportsActiveUsers = document.getElementById("reportsActiveUsers");

const reportsTotalUsers = document.getElementById("reportsTotalUsers");
const reportsTotalOrders = document.getElementById("reportsTotalOrders");
const reportsTotalTransactions = document.getElementById("reportsTotalTransactions");
const reportsTotalServices = document.getElementById("reportsTotalServices");

const reportsOpenTickets = document.getElementById("reportsOpenTickets");
const reportsReviewTickets = document.getElementById("reportsReviewTickets");
const reportsResolvedTickets = document.getElementById("reportsResolvedTickets");
const reportsTotalTickets = document.getElementById("reportsTotalTickets");

const reportsTopServicesList = document.getElementById("reportsTopServicesList");
const reportsMonthlyBreakdown = document.getElementById("reportsMonthlyBreakdown");

const formatPrice = (value) => `₦${Number(value || 0).toFixed(2)}`;

const renderTopServices = (services) => {
  if (!reportsTopServicesList) return;

  if (!services.length) {
    reportsTopServicesList.innerHTML = `
      <div class="service-performance-item">
        <div class="service-meta">
          <h4>No service data</h4>
          <p>Top services will appear here.</p>
        </div>
        <strong>0</strong>
      </div>
    `;
    return;
  }

  reportsTopServicesList.innerHTML = "";

  services.forEach((service) => {
    const item = document.createElement("div");
    item.className = "service-performance-item";

    item.innerHTML = `
      <div class="service-meta">
        <h4>${service.name}</h4>
        <p>Orders recorded for this service</p>
      </div>
      <strong>${service.count}</strong>
    `;

    reportsTopServicesList.appendChild(item);
  });
};

const renderMonthlyBreakdown = (months) => {
  if (!reportsMonthlyBreakdown) return;

  if (!months.length) {
    reportsMonthlyBreakdown.innerHTML = `
      <div class="report-item">
        <span>No monthly data yet</span>
        <strong>-</strong>
      </div>
    `;
    return;
  }

  reportsMonthlyBreakdown.innerHTML = "";

  months.forEach((month) => {
    const item = document.createElement("div");
    item.className = "report-item";

    item.innerHTML = `
      <span>${month.label}</span>
      <strong>${formatPrice(month.revenue)} • ${month.transactions} trx</strong>
    `;

    reportsMonthlyBreakdown.appendChild(item);
  });
};

const fetchAdminReports = async () => {
  if (!token) {
    window.location.href = "signin.html";
    return;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/api/admin/reports`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Failed to fetch admin reports");
    }

    const stats = data.stats || {};

    if (reportsTotalRevenue) reportsTotalRevenue.textContent = formatPrice(stats.totalRevenue);
    if (reportsTotalCredits) reportsTotalCredits.textContent = formatPrice(stats.totalCredits);
    if (reportsTotalRefunds) reportsTotalRefunds.textContent = formatPrice(stats.totalRefunds);
    if (reportsActiveUsers) reportsActiveUsers.textContent = stats.activeUsers || 0;

    if (reportsTotalUsers) reportsTotalUsers.textContent = stats.totalUsers || 0;
    if (reportsTotalOrders) reportsTotalOrders.textContent = stats.totalOrders || 0;
    if (reportsTotalTransactions) reportsTotalTransactions.textContent = stats.totalTransactions || 0;
    if (reportsTotalServices) reportsTotalServices.textContent = stats.totalServices || 0;

    if (reportsOpenTickets) reportsOpenTickets.textContent = stats.openTickets || 0;
    if (reportsReviewTickets) reportsReviewTickets.textContent = stats.reviewTickets || 0;
    if (reportsResolvedTickets) reportsResolvedTickets.textContent = stats.resolvedTickets || 0;
    if (reportsTotalTickets) reportsTotalTickets.textContent = stats.totalTickets || 0;

    renderTopServices(data.topServices || []);
    renderMonthlyBreakdown(data.monthlyBreakdown || []);
  } catch (error) {
    console.error(error.message);

    if (typeof showToast === "function") {
      showToast("error", "Load failed", error.message || "Could not load reports.");
    }
  }
};

refreshReportsBtn?.addEventListener("click", fetchAdminReports);

fetchAdminReports();