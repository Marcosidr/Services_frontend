import { useState } from "react";
import { Link } from "react-router-dom";
import {
  MapPin,
  Bell,
  User,
  LayoutDashboard,
  ShieldCheck,
  LogOut,
  Menu,
  X,
} from "lucide-react";

function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const isLoggedIn = true;

  return (
    <nav
      className="bg-white shadow-sm border-b border-gray-100 sticky top-0 z-50"
      translate="no"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
              <MapPin className="w-4 h-4 text-white" />
            </div>
            <span
              style={{ fontWeight: 700, fontSize: "1.2rem" }}
              className="text-gray-900"
            >
              Resolve<span className="text-blue-600">Aqui</span>
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-6">
            <Link
              to="/"
              className="text-gray-600 hover:text-blue-600 transition-colors text-sm whitespace-nowrap"
            >
              Inicio
            </Link>
            <Link
              to="/profissionais"
              className="text-gray-600 hover:text-blue-600 transition-colors text-sm whitespace-nowrap"
            >
              Profissionais
            </Link>
            <Link
              to="/cadastrar-profissional"
              className="text-gray-600 hover:text-blue-600 transition-colors text-sm whitespace-nowrap"
            >
              Seja um Pro
            </Link>
            <Link
              to="/admin"
              className="text-gray-600 hover:text-blue-600 transition-colors text-sm whitespace-nowrap"
            >
              Admin
            </Link>
          </div>

          <div className="flex items-center gap-3">
            {isLoggedIn ? (
              <>
                <button className="relative p-2 text-gray-500 hover:text-blue-600 transition-colors">
                  <Bell className="w-5 h-5" />
                  <span className="absolute top-1 right-1 w-2 h-2 bg-orange-500 rounded-full" />
                </button>

                <div className="relative">
                  <button
                    onClick={() => setUserMenuOpen((open) => !open)}
                    className="flex items-center gap-2 p-1 rounded-full hover:bg-gray-100 transition-colors"
                  >
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                      <User className="w-4 h-4 text-blue-600" />
                    </div>
                    <span className="hidden md:block text-sm text-gray-700">
                      Usuario
                    </span>
                  </button>

                  {userMenuOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-50">
                      <Link
                        to="/painel"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
                      >
                        <LayoutDashboard className="w-4 h-4" />
                        Meu Painel
                      </Link>
                      <Link
                        to="/admin"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
                      >
                        <ShieldCheck className="w-4 h-4" />
                        Admin
                      </Link>
                      <hr className="my-1 border-gray-100" />
                      <Link
                        to="/login"
                        onClick={() => setUserMenuOpen(false)}
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
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="text-sm text-gray-600 hover:text-blue-600 px-3 py-1.5 whitespace-nowrap"
                >
                  Entrar
                </Link>
                <Link
                  to="/login"
                  className="text-sm bg-blue-600 text-white px-4 py-1.5 rounded-lg hover:bg-blue-700 transition-colors whitespace-nowrap"
                >
                  Cadastrar
                </Link>
              </div>
            )}

            <button
              onClick={() => setMenuOpen((open) => !open)}
              className="md:hidden p-2 text-gray-500 hover:text-gray-700"
            >
              {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {menuOpen && (
        <div className="md:hidden bg-white border-t border-gray-100 px-4 py-3 flex flex-col gap-3">
          <Link
            to="/"
            onClick={() => setMenuOpen(false)}
            className="text-gray-700 py-2 border-b border-gray-100"
          >
            Inicio
          </Link>
          <Link
            to="/profissionais"
            onClick={() => setMenuOpen(false)}
            className="text-gray-700 py-2 border-b border-gray-100"
          >
            Profissionais
          </Link>
          <Link
            to="/cadastrar-profissional"
            onClick={() => setMenuOpen(false)}
            className="text-gray-700 py-2 border-b border-gray-100"
          >
            Seja um Pro
          </Link>
          <Link
            to="/painel"
            onClick={() => setMenuOpen(false)}
            className="text-gray-700 py-2 border-b border-gray-100"
          >
            Meu Painel
          </Link>
          <Link
            to="/admin"
            onClick={() => setMenuOpen(false)}
            className="text-gray-700 py-2"
          >
            Admin
          </Link>
        </div>
      )}
    </nav>
  );
}

export default Header;
