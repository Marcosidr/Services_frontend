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
import { useAuth } from "../context/AuthContext";
import { getAuthorizationHeader } from "../utils/auth";

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
  const { isAuthenticated, userRole, userPhoto, logout, refreshUser } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notificationMenuOpen, setNotificationMenuOpen] = useState(false);
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
    if (!isAuthenticated) {
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
    const syncFromApi = async () => {
      if (!isAuthenticated) {
        setNotifications([]);
        setUnreadNotifications(0);
        return;
      }

      try {
        await refreshUser();
      } catch {
        // Mantem o estado local quando houver falha de rede.
      }
      await loadNotifications();
    };

    void syncFromApi();
  }, [isAuthenticated, pathname, refreshUser]);

  useEffect(() => {
    if (!isAuthenticated) return;

    const intervalId = window.setInterval(() => {
      void loadNotifications();
    }, 30000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [isAuthenticated]);

  const handleLogout = () => {
    logout();
    setNotifications([]);
    setUnreadNotifications(0);
    setUserMenuOpen(false);
    setNotificationMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-50" translate="no">
      <div className="border-b border-white/65 bg-white/70 shadow-[0_12px_30px_-26px_rgba(15,23,42,0.95)] backdrop-blur-xl supports-[backdrop-filter]:bg-white/55">
        <div className="section-container">
          <div className="flex h-16 items-center justify-between gap-3">
            <Link to="/" className="inline-flex items-center gap-2.5 shrink-0">
              <span className="animate-pulse-glow flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary via-primary/95 to-secondary text-white shadow-[0_10px_24px_-16px_rgba(29,78,216,0.9)]">
                <MapPin className="w-4 h-4" />
              </span>

              <span
                className="text-gradient-brand tracking-tight"
                style={{ fontWeight: 800, fontSize: "1.15rem" }}
              >
                Zentry
              </span>
            </Link>

            <nav className="hidden items-center gap-1 rounded-2xl border border-slate-200/80 bg-white/70 px-1.5 py-1 md:flex">
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `rounded-xl px-3.5 py-2 text-sm whitespace-nowrap ${
                      isActive
                        ? "bg-primary text-white shadow-[0_12px_24px_-16px_rgba(29,78,216,0.95)]"
                        : "text-slate-600 hover:bg-primary/10 hover:text-primary"
                    }`
                  }
                >
                  {item.label}
                </NavLink>
              ))}
            </nav>

            <div className="flex items-center gap-2 shrink-0">
              {isAuthenticated ? (
                <>
                  <div className="relative" ref={notificationMenuRef}>
                    <button
                      onClick={() => {
                        setNotificationMenuOpen((open) => !open);
                        setUserMenuOpen(false);
                      }}
                      className="relative rounded-xl border border-transparent p-2 text-slate-500 hover:border-primary/20 hover:bg-primary/10 hover:text-primary"
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
                      <div className="surface-card absolute right-0 z-50 mt-2 w-80 py-2">
                        <div className="flex items-center justify-between border-b border-slate-100 px-3 pb-2">
                          <p className="text-sm text-slate-800" style={{ fontWeight: 600 }}>
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
                            <p className="px-3 py-4 text-sm text-slate-500">Carregando...</p>
                          ) : notifications.length === 0 ? (
                            <p className="px-3 py-4 text-sm text-slate-500">
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
                                className={`w-full border-b border-slate-100 px-3 py-2.5 text-left transition-colors last:border-0 hover:bg-primary/5 ${
                                  notification.isRead ? "opacity-70" : ""
                                }`}
                              >
                                <p className="text-sm text-slate-800" style={{ fontWeight: 600 }}>
                                  {notification.title}
                                </p>
                                <p className="mt-0.5 text-xs text-slate-600">{notification.message}</p>
                                <p className="mt-1 text-[11px] text-slate-400">
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
                      className="flex items-center gap-2 rounded-xl border border-transparent px-2.5 py-1.5 hover:border-primary/15 hover:bg-primary/10"
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

                      <span className="hidden text-sm text-slate-700 md:block">
                        {userRole === "admin" ? "Admin" : "Usuário"}
                      </span>
                    </button>

                    {userMenuOpen && (
                      <div className="surface-card absolute right-0 z-50 mt-2 w-52 py-1">
                        <Link
                          to="/painel"
                          className="flex items-center gap-2 px-4 py-2.5 text-sm text-slate-700 hover:bg-primary/5"
                        >
                          <LayoutDashboard className="w-4 h-4" />
                          Meu Painel
                        </Link>

                        {userRole === "admin" && (
                          <Link
                            to="/admin"
                            className="flex items-center gap-2 px-4 py-2.5 text-sm text-slate-700 hover:bg-primary/5"
                          >
                            <ShieldCheck className="w-4 h-4" />
                            Admin
                          </Link>
                        )}

                        <hr className="my-1 border-slate-100" />

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
                    className="btn-ghost text-sm"
                  >
                    Entrar
                  </Link>

                  <Link
                    to="/cadastro"
                    className="btn-primary text-sm"
                  >
                    Cadastrar
                  </Link>
                </div>
              )}

              <button
                onClick={() => setMenuOpen((open) => !open)}
                className="rounded-xl p-2 text-slate-500 hover:bg-primary/10 hover:text-primary md:hidden"
                aria-label="Abrir menu"
              >
                {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {menuOpen && (
        <div className="border-b border-white/60 bg-white/90 backdrop-blur-sm md:hidden">
          <div className="section-container flex flex-col gap-1 py-3">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `rounded-xl px-3 py-2.5 text-sm ${
                    isActive
                      ? "bg-primary text-white"
                      : "text-slate-700 hover:bg-primary/10 hover:text-primary"
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}

            <Link
              to="/profissionais"
              className="btn-accent mt-1 text-sm"
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


