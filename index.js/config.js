const isLocalhost =
  window.location.hostname === "127.0.0.1" ||
  window.location.hostname === "localhost";

const CONFIG = {
  API_BASE_URL: isLocalhost
    ? "http://localhost:5000"
    : "https://your-backend-domain.com"
};