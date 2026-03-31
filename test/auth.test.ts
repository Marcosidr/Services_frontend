/** @vitest-environment jsdom */
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  clearAuthStorage,
  getAuthorizationHeader,
  getStoredUserRole,
  isAuthenticated,
  refreshStoredUserFromApi
} from "../src/app/utils/auth";

describe("auth utils", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    window.localStorage.clear();
  });

  it("detects authentication token and auth header", () => {
    window.localStorage.setItem("token", "abc123");

    expect(isAuthenticated()).toBe(true);
    expect(getAuthorizationHeader()).toEqual({
      Authorization: "Bearer abc123"
    });
  });

  it("clears storage on 401 when refreshing user", async () => {
    window.localStorage.setItem("token", "abc123");
    window.localStorage.setItem("user", JSON.stringify({ role: "admin" }));

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 401
      })
    );

    const result = await refreshStoredUserFromApi();
    expect(result).toBeNull();
    expect(isAuthenticated()).toBe(false);
  });

  it("stores user payload from /api/auth/me", async () => {
    window.localStorage.setItem("token", "abc123");

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          user: {
            id: 1,
            name: "Admin",
            role: "admin"
          }
        })
      })
    );

    const result = await refreshStoredUserFromApi();
    expect(result).toEqual({
      id: 1,
      name: "Admin",
      role: "admin"
    });
    expect(getStoredUserRole()).toBe("admin");
  });

  it("clearAuthStorage removes local auth keys", () => {
    window.localStorage.setItem("token", "abc123");
    window.localStorage.setItem("user", JSON.stringify({ role: "user" }));

    clearAuthStorage();

    expect(window.localStorage.getItem("token")).toBeNull();
    expect(window.localStorage.getItem("user")).toBeNull();
  });
});
