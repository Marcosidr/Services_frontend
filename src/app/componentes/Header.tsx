// =========================
// IMPORTAÇÕES
// =========================

// Hook do React para criar estados dentro do componente
// useState permite guardar valores que mudam ao longo do tempo
import { useState } from "react"

// Link permite navegação sem recarregar a página (SPA)
import { Link } from "react-router-dom"

// Ícones utilizados na Navbar
import {
  MapPin,          // Ícone da logo
  Bell,            // Ícone de notificação
  User,            // Ícone de usuário
  LayoutDashboard, // Ícone do painel
  ShieldCheck,     // Ícone de admin
  LogOut,          // Ícone de sair
  Menu,            // Ícone menu mobile
  X                // Ícone fechar menu
} from "lucide-react"


// =========================
// COMPONENTE HEADER
// =========================

 function Header() {

  // =========================
  // ESTADOS DO COMPONENTE
  // =========================

  // Controla se o menu mobile está aberto ou fechado
  const [menuOpen, setMenuOpen] = useState(false)

  // Controla se o dropdown do usuário está aberto
  const [userMenuOpen, setUserMenuOpen] = useState(false)

  // Simulação de usuário logado
  // Depois você pode substituir por contexto de autenticação real
  const isLoggedIn = true


  // =========================
  // JSX (HTML do componente)
  // =========================

  return (

    // Navbar fixa no topo da página
    <nav className="bg-white shadow-sm border-b border-gray-100 sticky top-0 z-50">

      {/* Container centralizado com largura máxima */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Linha principal da navbar */}
        <div className="flex items-center justify-between h-16">

          {/* ================= LOGO ================= */}

          {/* Link que leva para a página inicial */}
          <Link to="/" className="flex items-center gap-2">

            {/* Caixa azul do ícone */}
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
              <MapPin className="w-4 h-4 text-white" />
            </div>

            {/* Nome do sistema */}
            <span
              style={{ fontWeight: 700, fontSize: "1.2rem" }}
              className="text-gray-900"
            >
              Resolve<span className="text-blue-600">Aqui</span>
            </span>

          </Link>


          {/* ================= LINKS DESKTOP ================= */}

          {/* hidden md:flex -> só aparece em telas médias ou maiores */}
          <div className="hidden md:flex items-center gap-6">

            {/* Cada Link navega para uma rota diferente */}
            <Link to="/" className="text-gray-600 hover:text-blue-600 transition-colors text-sm">
              Início
            </Link>

            <Link to="/profissionais" className="text-gray-600 hover:text-blue-600 transition-colors text-sm">
              Profissionais
            </Link>

            <Link to="/cadastrar-profissional" className="text-gray-600 hover:text-blue-600 transition-colors text-sm">
              Seja um Pro
            </Link>

            <Link to="/admin" className="text-gray-600 hover:text-blue-600 transition-colors text-sm">
              Admin
            </Link>

          </div>


          {/* ================= LADO DIREITO ================= */}

          <div className="flex items-center gap-3">

            {/* Se o usuário estiver logado */}
            {isLoggedIn ? (

              <>
                {/* Botão de notificações */}
                <button className="relative p-2 text-gray-500 hover:text-blue-600 transition-colors">
                  <Bell className="w-5 h-5" />

                  {/* Bolinha indicando notificação ativa */}
                  <span className="absolute top-1 right-1 w-2 h-2 bg-orange-500 rounded-full"></span>
                </button>


                {/* Dropdown do usuário */}
                <div className="relative">

                  {/* Botão que abre/fecha o dropdown */}
                  <button
                    onClick={() => setUserMenuOpen(!userMenuOpen)} // Inverte o estado atual
                    className="flex items-center gap-2 p-1 rounded-full hover:bg-gray-100 transition-colors"
                  >

                    {/* Avatar */}
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                      <User className="w-4 h-4 text-blue-600" />
                    </div>

                    {/* Nome do usuário (aparece só no desktop) */}
                    <span className="hidden md:block text-sm text-gray-700">
                     Usuário
                    </span>

                  </button>


                  {/* Se userMenuOpen for true, o dropdown aparece */}
                  {userMenuOpen && (

                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-50">

                      {/* Link para o painel */}
                      <Link
                        to="/painel"
                        onClick={() => setUserMenuOpen(false)} // Fecha dropdown ao clicar
                        className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
                      >
                        <LayoutDashboard className="w-4 h-4" />
                        Meu Painel
                      </Link>

                      {/* Link admin */}
                      <Link
                        to="/admin"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
                      >
                        <ShieldCheck className="w-4 h-4" />
                        Admin
                      </Link>

                      {/* Linha separadora */}
                      <hr className="my-1 border-gray-100" />

                      {/* Botão sair */}
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

              // Caso o usuário NÃO esteja logado
              <div className="flex items-center gap-2">

                <Link to="/login" className="text-sm text-gray-600 hover:text-blue-600 px-3 py-1.5">
                  Entrar
                </Link>

                <Link to="/login" className="text-sm bg-blue-600 text-white px-4 py-1.5 rounded-lg hover:bg-blue-700 transition-colors">
                  Cadastrar
                </Link>

              </div>
            )}


            {/* ================= BOTÃO MENU MOBILE ================= */}

            <button
              onClick={() => setMenuOpen(!menuOpen)} // Alterna menu mobile
              className="md:hidden p-2 text-gray-500 hover:text-gray-700"
            >
              {/* Se menuOpen true mostra X, senão mostra Menu */}
              {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

          </div>
        </div>
      </div>


      {/* ================= MENU MOBILE ================= */}

      {/* Só aparece se menuOpen for true */}
      {menuOpen && (

        <div className="md:hidden bg-white border-t border-gray-100 px-4 py-3 flex flex-col gap-3">

          {/* Cada clique fecha o menu */}
          <Link to="/" onClick={() => setMenuOpen(false)} className="text-gray-700 py-2 border-b border-gray-100">
            Início
          </Link>

          <Link to="/profissionais" onClick={() => setMenuOpen(false)} className="text-gray-700 py-2 border-b border-gray-100">
            Profissionais
          </Link>

          <Link to="/cadastrar-profissional" onClick={() => setMenuOpen(false)} className="text-gray-700 py-2 border-b border-gray-100">
            Seja um Pro
          </Link>

          <Link to="/painel" onClick={() => setMenuOpen(false)} className="text-gray-700 py-2 border-b border-gray-100">
            Meu Painel
          </Link>

          <Link to="/admin" onClick={() => setMenuOpen(false)} className="text-gray-700 py-2">
            Admin
          </Link>

        </div>
      )}

    </nav>
  );
}
export default Header;