import { getStoredToken, getStoredUser } from "./auth-storage.js";

const userToken = getStoredToken();
const userData = getStoredUser();

if (!userToken || !userData) {
  window.location.href = "signin.html";
}