import { useEffect, useRef, useState } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  MapPin,
  Bell,
  User,
  LayoutDashboard,
  ShieldCheck,
  LogOut,
  Menu,
  X,
  Sparkles,
} from "lucide-react";
import {
  clearAuthStorage,
  getAuthorizationHeader,
  getStoredUserPhoto,
  getStoredUserRole,
  isAuthenticated,
  refreshStoredUserFromApi,
  type UserRole,
} from "../utils/auth";

const navItems = [
  { to: "/", label: "Início" },
  { to: "/profissionais", label: "Profissionais" },
  { to: "/contato", label: "Contato" },
];

type NotificationItem = {
  id: string;
  type?: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  metadata?: Record<string, unknown> | null;
};

const readAuthState = () => isAuthenticated();
const readUserRole = () => getStoredUserRole();
const readUserPhoto = () => getStoredUserPhoto();

function parsePositiveInteger(value: unknown) {
  if (typeof value === "number" && Number.isSafeInteger(value) && value > 0) return value;
  if (typeof value === "string" && /^\d+$/.test(value.trim())) {
    const parsed = Number(value.trim());
    if (Number.isSafeInteger(parsed) && parsed > 0) return parsed;
  }
  return null;
}

function getChatTargetFromNotification(notification: NotificationItem) {
  if (notification.type !== "message") return null;
  if (!notification.metadata || typeof notification.metadata !== "object") return null;

  const senderId = (notification.metadata as Record<string, unknown>).senderId;
  return parsePositiveInteger(senderId);
}

function getOrderTargetFromNotification(notification: NotificationItem) {
  if (!notification.metadata || typeof notification.metadata !== "object") return null;

  const metadata = notification.metadata as Record<string, unknown>;
  if (metadata.target !== "orders") return null;
  if (typeof metadata.orderId !== "string") return null;
  const orderId = metadata.orderId.trim();
  return orderId || null;
}

function extractSenderName(notificationMessage: string) {
  const suffix = " enviou uma mensagem";
  if (!notificationMessage.endsWith(suffix)) return "";

  return notificationMessage.slice(0, -suffix.length).trim();
}

function Header() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notificationMenuOpen, setNotificationMenuOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(readAuthState);
  const [userRole, setUserRole] = useState<UserRole | null>(readUserRole);
  const [userPhoto, setUserPhoto] = useState(readUserPhoto);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [loadingNotifications, setLoadingNotifications] = useState(false);
  const [clearingNotifications, setClearingNotifications] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const notificationMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMenuOpen(false);
    setUserMenuOpen(false);
    setNotificationMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;

      if (userMenuRef.current && !userMenuRef.current.contains(target)) {
        setUserMenuOpen(false);
      }

      if (notificationMenuRef.current && !notificationMenuRef.current.contains(target)) {
        setNotificationMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  async function loadNotifications(limit = 6) {
    if (!isAuthenticated()) {
      setNotifications([]);
      setUnreadNotifications(0);
      return;
    }

    try {
      setLoadingNotifications(true);

      const response = await fetch(`/api/notifications?limit=${limit}`, {
        headers: {
          ...getAuthorizationHeader()
        }
      });

      if (!response.ok) return;

      const data = (await response.json()) as {
        items?: NotificationItem[];
        unreadCount?: number;
      };

      setNotifications(Array.isArray(data.items) ? data.items : []);
      setUnreadNotifications(
        typeof data.unreadCount === "number" && data.unreadCount > 0 ? data.unreadCount : 0
      );
    } catch {
      // Mantem estado anterior em caso de erro de rede.
    } finally {
      setLoadingNotifications(false);
    }
  }

  async function markNotificationAsRead(notificationId: string) {
    try {
      const response = await fetch(`/api/notifications/${notificationId}/read`, {
        method: "PATCH",
        headers: {
          ...getAuthorizationHeader()
        }
      });

      if (!response.ok) return;

      setNotifications((prev) =>
        prev.map((item) => (item.id === notificationId ? { ...item, isRead: true } : item))
      );
      setUnreadNotifications((prev) => Math.max(prev - 1, 0));
    } catch {
      // Ignora falha pontual.
    }
  }

  async function markAllNotificationsAsRead() {
    try {
      const response = await fetch("/api/notifications/read-all", {
        method: "PATCH",
        headers: {
          ...getAuthorizationHeader()
        }
      });

      if (!response.ok) return;

      setNotifications((prev) => prev.map((item) => ({ ...item, isRead: true })));
      setUnreadNotifications(0);
    } catch {
      // Ignora falha pontual.
    }
  }

  async function clearAllNotifications() {
    if (clearingNotifications) return;

    try {
      setClearingNotifications(true);
      const response = await fetch("/api/notifications/clear", {
        method: "DELETE",
        headers: {
          ...getAuthorizationHeader()
        }
      });

      if (!response.ok) {
        // Fallback para backends antigos sem endpoint /clear.
        const listResponse = await fetch("/api/notifications?limit=100", {
          headers: {
            ...getAuthorizationHeader()
          }
        });

        if (!listResponse.ok) return;

        const data = (await listResponse.json()) as { items?: NotificationItem[] };
        const items = Array.isArray(data.items) ? data.items : [];
        if (items.length === 0) {
          setNotifications([]);
          setUnreadNotifications(0);
          return;
        }

        await Promise.all(
          items.map((item) =>
            fetch(`/api/notifications/${item.id}`, {
              method: "DELETE",
              headers: {
                ...getAuthorizationHeader()
              }
            })
          )
        );
      }

      await loadNotifications(100);
    } catch {
      // Ignora falha pontual.
    } finally {
      setClearingNotifications(false);
    }
  }

  useEffect(() => {
    const syncAuthState = () => {
      setIsLoggedIn(readAuthState());
      setUserRole(readUserRole());
      setUserPhoto(readUserPhoto());
    };

    const syncFromApi = async () => {
      syncAuthState();
      if (!isAuthenticated()) {
        setNotifications([]);
        setUnreadNotifications(0);
        return;
      }

      try {
        await refreshStoredUserFromApi();
      } catch {
        // Mantem o estado local quando houver falha de rede.
      }

      syncAuthState();
      await loadNotifications();
    };

    void syncFromApi();
    window.addEventListener("storage", syncAuthState);

    return () => {
      window.removeEventListener("storage", syncAuthState);
    };
  }, [pathname]);

  useEffect(() => {
    if (!isLoggedIn) return;

    const intervalId = window.setInterval(() => {
      void loadNotifications();
    }, 30000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [isLoggedIn]);

  const handleLogout = () => {
    clearAuthStorage();
    setIsLoggedIn(false);
    setUserRole(null);
    setUserPhoto("");
    setNotifications([]);
    setUnreadNotifications(0);
    setUserMenuOpen(false);
    setNotificationMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-50" translate="no">
      <div className="border-b border-primary/10 bg-white/90 backdrop-blur-md supports-[backdrop-filter]:bg-white/75">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="h-16 flex items-center justify-between gap-3">
            <Link to="/" className="inline-flex items-center gap-2.5 shrink-0">
              <span className="w-9 h-9 rounded-xl bg-primary text-white flex items-center justify-center shadow-sm">
                <MapPin className="w-4 h-4" />
              </span>

              <span
                className="text-primary tracking-tight"
                style={{ fontWeight: 800, fontSize: "1.15rem" }}
              >
                Zen<span className="text-accent">try</span>
              </span>
            </Link>

            <nav className="hidden md:flex items-center gap-1">
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `px-3 py-2 rounded-lg text-sm transition-colors whitespace-nowrap ${
                      isActive
                        ? "bg-primary/10 text-primary"
                        : "text-gray-600 hover:text-primary hover:bg-primary/5"
                    }`
                  }
                >
                  {item.label}
                </NavLink>
              ))}
            </nav>

            <div className="flex items-center gap-2 shrink-0">
              {isLoggedIn ? (
                <>
                  <div className="relative" ref={notificationMenuRef}>
                    <button
                      onClick={() => {
                        setNotificationMenuOpen((open) => !open);
                        setUserMenuOpen(false);
                      }}
                      className="relative p-2 text-gray-500 hover:text-primary hover:bg-primary/5 rounded-lg transition-colors"
                      aria-label="Notificações"
                    >
                      <Bell className="w-5 h-5" />
                      {unreadNotifications > 0 && (
                        <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-accent text-[10px] text-gray-900 flex items-center justify-center">
                          {unreadNotifications > 9 ? "9+" : unreadNotifications}
                        </span>
                      )}
                    </button>

                    {notificationMenuOpen && (
                      <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-lg border border-gray-100 py-2 z-50">
                        <div className="px-3 pb-2 flex items-center justify-between border-b border-gray-100">
                          <p className="text-sm text-gray-800" style={{ fontWeight: 600 }}>
                            Notificações
                          </p>
                          {unreadNotifications > 0 && (
                            <button
                              onClick={() => {
                                void markAllNotificationsAsRead();
                              }}
                              className="text-xs text-primary hover:underline"
                            >
                              Marcar todas
                            </button>
                          )}
                          {notifications.length > 0 && (
                            <button
                              onClick={() => {
                                void clearAllNotifications();
                              }}
                              disabled={clearingNotifications}
                              className="text-xs text-red-500 hover:underline disabled:opacity-50"
                            >
                              {clearingNotifications ? "Limpando..." : "Limpar notificações"}
                            </button>
                          )}
                        </div>

                        <div className="max-h-80 overflow-y-auto">
                          {loadingNotifications ? (
                            <p className="px-3 py-4 text-sm text-gray-500">Carregando...</p>
                          ) : notifications.length === 0 ? (
                            <p className="px-3 py-4 text-sm text-gray-500">
                              Nenhuma notificação no momento.
                            </p>
                          ) : (
                            notifications.map((notification) => (
                              <button
                                key={notification.id}
                                onClick={() => {
                                  if (!notification.isRead) {
                                    void markNotificationAsRead(notification.id);
                                  }

                                  const orderTargetId = getOrderTargetFromNotification(notification);
                                  if (orderTargetId) {
                                    const query = new URLSearchParams({
                                      tab: "pedidos",
                                      orderId: orderTargetId
                                    });
                                    navigate(`/painel?${query.toString()}`);
                                    setNotificationMenuOpen(false);
                                    return;
                                  }

                                  const chatTargetId = getChatTargetFromNotification(notification);
                                  if (chatTargetId) {
                                    const query = new URLSearchParams({
                                      chatWith: String(chatTargetId)
                                    });

                                    const senderName = extractSenderName(notification.message);
                                    if (senderName) {
                                      query.set("chatName", senderName);
                                    }

                                    navigate(`/painel?${query.toString()}`);
                                    setNotificationMenuOpen(false);
                                  }
                                }}
                                className={`w-full text-left px-3 py-2.5 hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-0 ${
                                  notification.isRead ? "opacity-70" : ""
                                }`}
                              >
                                <p className="text-sm text-gray-800" style={{ fontWeight: 600 }}>
                                  {notification.title}
                                </p>
                                <p className="text-xs text-gray-600 mt-0.5">{notification.message}</p>
                                <p className="text-[11px] text-gray-400 mt-1">
                                  {new Date(notification.createdAt).toLocaleString("pt-BR")}
                                </p>
                              </button>
                            ))
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="relative" ref={userMenuRef}>
                    <button
                      onClick={() => {
                        setUserMenuOpen((open) => !open);
                        setNotificationMenuOpen(false);
                      }}
                      className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-primary/5 transition-colors"
                    >
                      {userPhoto ? (
                        <img
                          src={userPhoto}
                          alt="Foto do usuario"
                          className="w-8 h-8 rounded-full object-cover"
                          loading="lazy"
                        />
                      ) : (
                        <span className="w-8 h-8 rounded-full bg-secondary/20 text-secondary flex items-center justify-center">
                          <User className="w-4 h-4" />
                        </span>
                      )}

                      <span className="hidden md:block text-sm text-gray-700">
                        {userRole === "admin" ? "Admin" : "Usuário"}
                      </span>
                    </button>

                    {userMenuOpen && (
                      <div className="absolute right-0 mt-2 w-52 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-50">
                        <Link
                          to="/painel"
                          className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
                        >
                          <LayoutDashboard className="w-4 h-4" />
                          Meu Painel
                        </Link>

                        {userRole === "admin" && (
                          <Link
                            to="/admin"
                            className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
                          >
                            <ShieldCheck className="w-4 h-4" />
                            Admin
                          </Link>
                        )}

                        <hr className="my-1 border-gray-100" />

                        <Link
                          to="/login"
                          onClick={handleLogout}
                          className="flex items-center gap-2 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50"
                        >
                          <LogOut className="w-4 h-4" />
                          Sair
                        </Link>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="hidden md:flex items-center gap-2">
                  <Link
                    to="/login"
                    className="text-sm text-gray-600 hover:text-primary px-3 py-1.5 rounded-lg hover:bg-primary/5 transition-colors"
                  >
                    Entrar
                  </Link>

                  <Link
                    to="/login"
                    className="text-sm bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors"
                  >
                    Cadastrar
                  </Link>
                </div>
              )}

              <button
                onClick={() => setMenuOpen((open) => !open)}
                className="md:hidden p-2 text-gray-500 hover:text-primary hover:bg-primary/5 rounded-lg transition-colors"
                aria-label="Abrir menu"
              >
                {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {menuOpen && (
        <div className="md:hidden border-b border-primary/10 bg-white/95 backdrop-blur-sm">
          <div className="max-w-7xl mx-auto px-4 py-3 flex flex-col gap-1">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `px-3 py-2.5 rounded-lg text-sm transition-colors ${
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "text-gray-700 hover:bg-primary/5 hover:text-primary"
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}

            <Link
              to="/profissionais"
              className="mt-1 inline-flex items-center justify-center gap-2 rounded-lg bg-accent text-gray-900 px-3 py-2.5 text-sm hover:bg-accent/90 transition-colors"
              style={{ fontWeight: 600 }}
            >
              <Sparkles className="w-4 h-4" />
              Contratar agora
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}

export default Header;


