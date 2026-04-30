/**
 * API utility — centralized API calls & token management.
 */

export const API_BASE_URL = "http://localhost:8000";

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

// ─── Handle 401 globally ───
function handle401() {
  removeToken();
  window.location.href = "/login";
}

// ─── Generic JSON fetch wrapper (untuk endpoint yang kirim/terima JSON) ───
async function apiFetch(endpoint, options = {}) {
  const token = getToken();
  const headers = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  let res;
  try {
    res = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });
  } catch (networkError) {
    throw new Error("Gagal terhubung ke server. Pastikan backend sedang berjalan.");
  }

  let data;
  try {
    data = await res.json();
  } catch {
    throw new Error(`Server mengembalikan respons tidak valid (HTTP ${res.status})`);
  }

  if (!res.ok) {
    const isAuthEndpoint = endpoint.startsWith("/api/auth/");
    if (res.status === 401 && !isAuthEndpoint) {
      handle401();
      return; // prevent further execution
    }
    throw new Error(data.detail || "Terjadi kesalahan pada server");
  }

  return data;
}

/**
 * fetchWithAuth — Fetch wrapper untuk komponen yang pakai raw fetch (FormData, dll).
 * Otomatis menambahkan Authorization header dan handle 401.
 * TIDAK set Content-Type (biarkan browser set otomatis untuk FormData).
 */
export async function fetchWithAuth(url, options = {}) {
  const token = getToken();
  const headers = {
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  let res;
  try {
    res = await fetch(url, { ...options, headers });
  } catch (networkError) {
    throw new Error("Gagal terhubung ke server. Pastikan backend sedang berjalan.");
  }

  if (res.status === 401) {
    handle401();
    throw new Error("Sesi Anda telah berakhir. Silakan login kembali.");
  }

  return res;
}

// ─── Auth API ───
export const authApi = {
  async login(email, password) {
    const data = await apiFetch("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    // simpan token & user
    console.log("Response dari backend:", data);
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

// ─── History API ───
export const historyApi = {
  async getUserHistory() {
    const data = await apiFetch("/api/plagiarism/history/user");
    return data;
  },
};
