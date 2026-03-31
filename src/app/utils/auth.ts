export type UserRole = "user" | "professional" | "admin";

export type StoredUser = {
  id?: number | string;
  name?: string;
  email?: string;
  photo?: string;
  role?: string;
  [key: string]: unknown;
};

type MeResponse = {
  user?: StoredUser;
};

export const AUTH_STORAGE_EVENT = "auth:changed";

function emitAuthStorageChange() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(AUTH_STORAGE_EVENT));
}

export function isAuthenticated() {
  if (typeof window === "undefined") return false;
  return Boolean(window.localStorage.getItem("token"));
}

export function getStoredToken() {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem("token");
}

export function getAuthorizationHeader(): Record<string, string> {
  const token = getStoredToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export function getStoredUser() {
  if (typeof window === "undefined") return null;

  const rawUser = window.localStorage.getItem("user");
  if (!rawUser) return null;

  try {
    const parsed = JSON.parse(rawUser);
    if (!parsed || typeof parsed !== "object") return null;
    return parsed as StoredUser;
  } catch {
    return null;
  }
}

export function getStoredUserPhoto() {
  const photo = getStoredUser()?.photo;
  return typeof photo === "string" ? photo.trim() : "";
}

export function getStoredUserRole(): UserRole | null {
  const role = getStoredUser()?.role;
  if (role === "admin" || role === "professional" || role === "user") {
    return role;
  }
  return null;
}

export function isStoredUserAdmin() {
  return getStoredUserRole() === "admin";
}

export function clearAuthStorage() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem("token");
  window.localStorage.removeItem("user");
  emitAuthStorageChange();
}

export function setStoredToken(token: string | null) {
  if (typeof window === "undefined") return;
  if (token && token.trim()) {
    window.localStorage.setItem("token", token);
  } else {
    window.localStorage.removeItem("token");
  }
  emitAuthStorageChange();
}

export function setStoredUser(user: StoredUser | null) {
  if (typeof window === "undefined") return;
  if (user && typeof user === "object") {
    window.localStorage.setItem("user", JSON.stringify(user));
  } else {
    window.localStorage.removeItem("user");
  }
  emitAuthStorageChange();
}

export async function refreshStoredUserFromApi() {
  if (!isAuthenticated()) return null;

  const response = await fetch("/api/auth/me", {
    headers: {
      ...getAuthorizationHeader()
    }
  });

  if (!response.ok) {
    if (response.status === 401) {
      clearAuthStorage();
    }
    return null;
  }

  const data = (await response.json()) as MeResponse;
  if (!data?.user || typeof data.user !== "object") return null;

  setStoredUser(data.user);
  return data.user;
}
