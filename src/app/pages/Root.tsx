import { Outlet } from "react-router";
import { Navbar } from "../components/Navbar";

export function Root() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <footer className="bg-gray-900 text-gray-400 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
            <div>
              <p className="text-white mb-3" style={{ fontWeight: 600 }}>ResolveAqui</p>
              <p className="text-sm text-gray-500 leading-relaxed">
                Conectando você com os melhores profissionais da sua região.
              </p>
            </div>
            <div>
              <p className="text-white mb-3 text-sm" style={{ fontWeight: 600 }}>Serviços</p>
              <ul className="flex flex-col gap-2 text-sm">
                {["Eletricista", "Encanador", "Diarista", "Pedreiro"].map((s) => (
                  <li key={s}>{s}</li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-white mb-3 text-sm" style={{ fontWeight: 600 }}>Para profissionais</p>
              <ul className="flex flex-col gap-2 text-sm">
                {["Cadastrar-se", "Como funciona", "Pagamentos", "Suporte"].map((s) => (
                  <li key={s}>{s}</li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-white mb-3 text-sm" style={{ fontWeight: 600 }}>Empresa</p>
              <ul className="flex flex-col gap-2 text-sm">
                {["Sobre nós", "Blog", "Privacidade", "Termos"].map((s) => (
                  <li key={s}>{s}</li>
                ))}
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-sm">© 2026 ResolveAqui. Todos os direitos reservados.</p>
            <div className="flex items-center gap-3 text-sm">
              <span>🔐 Pagamentos seguros</span>
              <span>✅ Profissionais verificados</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
