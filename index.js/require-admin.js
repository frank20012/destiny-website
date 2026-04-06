import { getStoredToken, getStoredUser } from "./auth-storage.js";

const adminToken = getStoredToken();
const adminData = getStoredUser();


if (!adminToken || !adminData) {
  window.location.href = "signin.html";
} else if (adminData.role !== "admin") {
  window.location.href = "dashboard.html";
}