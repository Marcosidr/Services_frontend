import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  AUTH_STORAGE_EVENT,
  clearAuthStorage,
  getStoredToken,
  getStoredUser,
  refreshStoredUserFromApi,
  setStoredToken,
  setStoredUser,
  type StoredUser,
  type UserRole,
} from "../utils/auth";

type SetAuthPayload = {
  token?: string | null;
  user?: StoredUser | null;
};

type AuthContextValue = {
  token: string | null;
  user: StoredUser | null;
  isAuthenticated: boolean;
  userRole: UserRole | null;
  userPhoto: string;
  isAdmin: boolean;
  setAuthToken: (token: string | null) => void;
  setAuthUser: (user: StoredUser | null) => void;
  setAuth: (payload: SetAuthPayload) => void;
  logout: () => void;
  refreshUser: () => Promise<StoredUser | null>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function parseUserRole(user: StoredUser | null): UserRole | null {
  const role = user?.role;
  if (role === "admin" || role === "professional" || role === "user") {
    return role;
  }
  return null;
}

function parseUserPhoto(user: StoredUser | null) {
  const photo = user?.photo;
  return typeof photo === "string" ? photo.trim() : "";
}

function readAuthSnapshot() {
  const token = getStoredToken();
  const user = getStoredUser();
  return { token, user };
}

type AuthProviderProps = {
  children: ReactNode;
};

export function AuthProvider({ children }: AuthProviderProps) {
  const [token, setToken] = useState<string | null>(() => readAuthSnapshot().token);
  const [user, setUser] = useState<StoredUser | null>(() => readAuthSnapshot().user);

  const syncFromStorage = useCallback(() => {
    const snapshot = readAuthSnapshot();
    setToken(snapshot.token);
    setUser(snapshot.user);
  }, []);

  useEffect(() => {
    const handleAuthChange = () => {
      syncFromStorage();
    };

    window.addEventListener("storage", handleAuthChange);
    window.addEventListener(AUTH_STORAGE_EVENT, handleAuthChange);

    return () => {
      window.removeEventListener("storage", handleAuthChange);
      window.removeEventListener(AUTH_STORAGE_EVENT, handleAuthChange);
    };
  }, [syncFromStorage]);

  const setAuthToken = useCallback(
    (nextToken: string | null) => {
      setStoredToken(nextToken);
      syncFromStorage();
    },
    [syncFromStorage]
  );

  const setAuthUser = useCallback(
    (nextUser: StoredUser | null) => {
      setStoredUser(nextUser);
      syncFromStorage();
    },
    [syncFromStorage]
  );

  const setAuth = useCallback(
    (payload: SetAuthPayload) => {
      if (Object.prototype.hasOwnProperty.call(payload, "token")) {
        setStoredToken(payload.token ?? null);
      }

      if (Object.prototype.hasOwnProperty.call(payload, "user")) {
        setStoredUser(payload.user ?? null);
      }

      syncFromStorage();
    },
    [syncFromStorage]
  );

  const logout = useCallback(() => {
    clearAuthStorage();
    setToken(null);
    setUser(null);
  }, []);

  const refreshUser = useCallback(async () => {
    const refreshedUser = await refreshStoredUserFromApi();
    syncFromStorage();
    return refreshedUser;
  }, [syncFromStorage]);

  const userRole = useMemo(() => parseUserRole(user), [user]);
  const userPhoto = useMemo(() => parseUserPhoto(user), [user]);
  const isAuthenticated = Boolean(token);
  const isAdmin = userRole === "admin";

  const value = useMemo<AuthContextValue>(
    () => ({
      token,
      user,
      isAuthenticated,
      userRole,
      userPhoto,
      isAdmin,
      setAuthToken,
      setAuthUser,
      setAuth,
      logout,
      refreshUser,
    }),
    [
      isAdmin,
      isAuthenticated,
      logout,
      refreshUser,
      setAuth,
      setAuthToken,
      setAuthUser,
      token,
      user,
      userPhoto,
      userRole,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider.");
  }
  return context;
}
