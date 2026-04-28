/**
 * API utility — centralized API calls & token management.
 */

const API_BASE_URL = "http://localhost:8000";

// ─── Token helpers ───
export function getToken() {
  return localStorage.getItem("wordlens_token");
}

export function setToken(token) {
  localStorage.setItem("wordlens_token", token);
}

export function removeToken() {
  localStorage.removeItem("wordlens_token");
  localStorage.removeItem("wordlens_user");
}

export function getUser() {
  const raw = localStorage.getItem("wordlens_user");
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function setUser(user) {
  localStorage.setItem("wordlens_user", JSON.stringify(user));
}

// ─── Generic fetch wrapper ───
async function apiFetch(endpoint, options = {}) {
  const token = getToken();
  const headers = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const res = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.detail || "Terjadi kesalahan pada server");
  }

  return data;
}

// ─── Auth API ───
export const authApi = {
  async login(email, password) {
    const data = await apiFetch("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    // simpan token & user
    setToken(data.access_token);
    setUser(data.user);
    return data;
  },

  async register(username, email, password) {
    const data = await apiFetch("/api/auth/register", {
      method: "POST",
      body: JSON.stringify({ username, email, password }),
    });
    return data;
  },

  logout() {
    removeToken();
  },

  isLoggedIn() {
    return !!getToken();
  },

  getCurrentUser() {
    return getUser();
  },
};
