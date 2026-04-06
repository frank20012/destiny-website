export const getStoredToken = () =>
  localStorage.getItem("token") || sessionStorage.getItem("token");

export const getStoredUser = () => {
  const rawUser =
    localStorage.getItem("user") || sessionStorage.getItem("user");

  return rawUser ? JSON.parse(rawUser) : null;
};

export const saveAuth = (token, user, rememberMe = false) => {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  sessionStorage.removeItem("token");
  sessionStorage.removeItem("user");

  if (rememberMe) {
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(user));
  } else {
    sessionStorage.setItem("token", token);
    sessionStorage.setItem("user", JSON.stringify(user));
  }
};

export const clearAuth = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  sessionStorage.removeItem("token");
  sessionStorage.removeItem("user");
};