export type UserRole = "user" | "professional" | "admin";

type StoredUser = {
  role?: string;
  [key: string]: unknown;
};

type MeResponse = {
  user?: StoredUser;
};

export function isAuthenticated() {
  if (typeof window === "undefined") return false;
  return Boolean(window.localStorage.getItem("token"));
}

export function getAuthorizationHeader(): Record<string, string> {
  if (typeof window === "undefined") return {};
  const token = window.localStorage.getItem("token");
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

  window.localStorage.setItem("user", JSON.stringify(data.user));
  return data.user;
}
