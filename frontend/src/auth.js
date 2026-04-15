export function saveAuth(data) {
  localStorage.setItem("token", data.access_token);
  localStorage.setItem("user", JSON.stringify(data.user));
  localStorage.setItem("user_name", data.user.name);
  localStorage.setItem("role", data.user.role);
  localStorage.setItem(
    "must_change_password",
    String(!!data.user.must_change_password)
  );
}

export function getToken() {
  return localStorage.getItem("token");
}

export function getUser() {
  try {
    return JSON.parse(localStorage.getItem("user") || "null");
  } catch {
    return null;
  }
}

export function isLoggedIn() {
  return !!localStorage.getItem("token");
}

export function mustChangePassword() {
  return localStorage.getItem("must_change_password") === "true";
}

export function updateStoredUser(user, token = null) {
  localStorage.setItem("user", JSON.stringify(user));
  localStorage.setItem("user_name", user.name || "");
  localStorage.setItem("role", user.role || "User");
  localStorage.setItem(
    "must_change_password",
    String(!!user.must_change_password)
  );

  if (token) {
    localStorage.setItem("token", token);
  }
}

export function logout() {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  localStorage.removeItem("user_name");
  localStorage.removeItem("role");
  localStorage.removeItem("must_change_password");
}