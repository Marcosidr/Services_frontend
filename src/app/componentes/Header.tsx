import { useEffect, useRef, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
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
  getStoredUserRole,
  isAuthenticated,
  refreshStoredUserFromApi,
  type UserRole,
} from "../utils/auth";

const navItems = [
  { to: "/", label: "InÃ­cio" },
  { to: "/profissionais", label: "Profissionais" },
  { to: "/contato", label: "Contato" },
];

const readAuthState = () => isAuthenticated();
const readUserRole = () => getStoredUserRole();

function Header() {
  const { pathname } = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(readAuthState);
  const [userRole, setUserRole] = useState<UserRole | null>(readUserRole);
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMenuOpen(false);
    setUserMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;

      if (userMenuRef.current && !userMenuRef.current.contains(target)) {
        setUserMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    const syncAuthState = () => {
      setIsLoggedIn(readAuthState());
      setUserRole(readUserRole());
    };

    const syncFromApi = async () => {
      syncAuthState();
      if (!isAuthenticated()) return;

      try {
        await refreshStoredUserFromApi();
      } catch {
        // Mantem o estado local quando houver falha de rede.
      }

      syncAuthState();
    };

    void syncFromApi();
    window.addEventListener("storage", syncAuthState);

    return () => {
      window.removeEventListener("storage", syncAuthState);
    };
  }, [pathname]);

  const handleLogout = () => {
    clearAuthStorage();
    setIsLoggedIn(false);
    setUserRole(null);
    setUserMenuOpen(false);
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
                  <button
                    className="relative p-2 text-gray-500 hover:text-primary hover:bg-primary/5 rounded-lg transition-colors"
                    aria-label="NotificaÃ§Ãµes"
                  >
                    <Bell className="w-5 h-5" />
                    <span className="absolute top-1 right-1 w-2 h-2 bg-accent rounded-full" />
                  </button>

                  <div className="relative" ref={userMenuRef}>
                    <button
                      onClick={() => setUserMenuOpen((open) => !open)}
                      className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-primary/5 transition-colors"
                    >
                      <span className="w-8 h-8 rounded-full bg-secondary/20 text-secondary flex items-center justify-center">
                        <User className="w-4 h-4" />
                      </span>

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


