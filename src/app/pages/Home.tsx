import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  MapPin,
  Navigation,
  Shield,
  Clock,
  ChevronRight,
} from "lucide-react";

// ✅ Nome do componente tem que começar com letra maiúscula
 function Home() {
  const navigate = useNavigate();

  // ✅ Estados mínimos pra não depender de “mock”
  const [searchQuery, setSearchQuery] = useState("");
  const [menuMessage, setMenuMessage] = useState<string | null>(null);

  // ✅ Localização: começa como “não autorizada”
  const [locationGranted, setLocationGranted] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);

  // ✅ Se você tiver esses dados vindo de API depois, substitui aqui
  const categories: Array<{ id: string; label: string; icon?: string }> = [];
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  // ✅ Profissionais reais viriam do backend. Por enquanto vazio (sem fake).
  const professionals: Array<{ id: string; online?: boolean }> = [];
  const nearbyPros: Array<{ id: string }> = [];
  const [selectedPro, setSelectedPro] = useState<any>(null);

  // ✅ Pedir localização de verdade (sem inventar cidade)
  async function handleLocationRequest() {
    setMenuMessage(null);
    setLocationLoading(true);

    try {
      if (!("geolocation" in navigator)) {
        setMenuMessage("Seu navegador não suporta geolocalização.");
        return;
      }

      navigator.geolocation.getCurrentPosition(
        () => {
          // Aqui você receberia lat/lng e buscaria profissionais por perto no backend
          setLocationGranted(true);
        },
        () => {
          setMenuMessage("Não foi possível obter sua localização.");
          setLocationGranted(false);
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    } finally {
      setLocationLoading(false);
    }
  }

  // ✅ Buscar (sem fake) — aqui você pode navegar pra página de profissionais passando a query
  function handleSearch(e: React.FormEvent) {
    e.preventDefault();

    const q = searchQuery.trim();
    if (!q) {
      setMenuMessage("Digite o serviço que você precisa.");
      return;
    }

    // Exemplo: manda a query pela URL
    navigate(`/profissionais?q=${encodeURIComponent(q)}`);
  }

  // ✅ Categoria (sem fake)
  function handleCategory(categoryId: string) {
    setActiveCategory(categoryId);
    // Você pode navegar ou filtrar resultados depois
    navigate(`/profissionais?cat=${encodeURIComponent(categoryId)}`);
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero section */}
      <section className="bg-gradient-to-br from-primary via-primary/90 to-secondary text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-16">
          <div className="max-w-2xl">
            {/* ✅ Removido “+1.200 profissionais disponíveis em SP” (fake) */}
            <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full text-sm mb-4">
              <MapPin className="w-3.5 h-3.5" />
              <span>Encontre profissionais perto de você</span>
            </div>

            <h1
              className="text-3xl md:text-5xl text-white mb-4"
              style={{ fontWeight: 700, lineHeight: 1.2 }}
            >
              Encontre o profissional <span className="text-accent">certo</span> perto de você
            </h1>

            <p className="text-white/90 mb-8 text-lg">
              Conectamos você com profissionais verificados e organizamos as opções para você escolher com segurança.
            </p>

            {/* Location button */}
            {!locationGranted ? (
              <button
                onClick={handleLocationRequest}
                disabled={locationLoading}
                className="flex items-center gap-2 bg-white/20 hover:bg-white/30 border border-white/40 text-white px-4 py-2.5 rounded-xl mb-5 transition-all"
              >
                {locationLoading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Navigation className="w-4 h-4" />
                )}
                {locationLoading ? "Detectando localização..." : "Usar minha localização atual"}
              </button>
            ) : (
              // ✅ Sem inventar cidade/estado: só confirma que foi autorizado
              <div className="flex items-center gap-2 text-green-200 mb-5">
                <MapPin className="w-4 h-4" />
                <span className="text-sm">Localização autorizada</span>
              </div>
            )}

            {/* Mensagens (ex: erro de localização ou busca vazia) */}
            {menuMessage && (
              <p className="text-sm text-accent mb-3">{menuMessage}</p>
            )}

            {/* Search bar */}
            <form onSubmit={handleSearch} className="flex gap-3">
              <div className="flex-1 relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Qual serviço você precisa?"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-11 pr-4 py-3.5 rounded-xl bg-white text-gray-800 placeholder-gray-400 outline-none shadow-lg"
                />
              </div>
              <button
                type="submit"
                className="bg-accent hover:bg-accent/90 text-gray-900 px-6 py-3.5 rounded-xl transition-colors shadow-lg whitespace-nowrap"
              >
                Buscar
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* Quick categories */}
      <section className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-3 overflow-x-auto pb-1 scrollbar-hide">
            <span className="text-sm text-gray-500 whitespace-nowrap flex-shrink-0">
              Acesso rápido:
            </span>

            {/* ✅ Se não tem categorias reais ainda, mostra texto neutro */}
            {categories.length === 0 ? (
              <span className="text-sm text-gray-400">
                Categorias aparecerão aqui quando forem cadastradas.
              </span>
            ) : (
              categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => handleCategory(cat.id)}
                  className={`
                    flex items-center gap-2 px-4 py-2 rounded-full text-sm whitespace-nowrap flex-shrink-0 transition-all border
                    ${
                      activeCategory === cat.id
                        ? "bg-primary text-white border-primary"
                        : "bg-gray-50 text-gray-700 border-gray-200 hover:border-primary/40 hover:bg-primary/10"
                    }
                  `}
                >
                  <span>{cat.icon ?? "•"}</span>
                  <span>{cat.label}</span>
                </button>
              ))
            )}
          </div>
        </div>
      </section>

      {/* Main content: Lista (sem inventar números) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-gray-900">Profissionais</h2>

            {/* ✅ Removido contador fake; só mostra se existir dado real */}
            {professionals.length > 0 ? (
              <p className="text-sm text-gray-500 mt-1">
                {professionals.filter((p) => p.online).length} disponíveis agora
              </p>
            ) : (
              <p className="text-sm text-gray-500 mt-1">
                Carregue profissionais do backend para exibir aqui.
              </p>
            )}
          </div>

          <button
            onClick={() => navigate("/profissionais")}
            className="flex items-center gap-1 text-sm text-primary hover:text-primary/80"
          >
            Ver todos
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* ✅ Sem MapView/ProfessionalCard se você ainda não tem dados reais
             */}
        <div className="bg-white border border-gray-100 rounded-2xl p-6">
          <p className="text-gray-600">
            Aqui você pode mostrar o mapa e a lista assim que integrar o backend (profissionais por perto).
          </p>
        </div>
      </section>

      {/* Features (essas são “promessas do produto”, não números fake) */}
      <section className="bg-white border-t border-gray-100 mt-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <h2 className="text-center text-gray-900 mb-10">
            Por que usar a plataforma?
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: <Navigation className="w-6 h-6 text-primary" />,
                title: "Busca por proximidade",
                desc: "Mostre profissionais mais próximos quando a localização estiver autorizada.",
                bg: "bg-primary/10",
              },
              {
                icon: <Shield className="w-6 h-6 text-secondary" />,
                title: "Perfis verificados",
                desc: "Você pode validar documentos e avaliações conforme seu processo.",
                bg: "bg-secondary/15",
              },
              {
                icon: <Clock className="w-6 h-6 text-accent" />,
                title: "Resposta rápida",
                desc: "O usuário encontra e chama um profissional com poucos cliques.",
                bg: "bg-accent/15",
              },
            ].map((f, i) => (
              <div key={i} className="flex flex-col items-center text-center p-6 rounded-2xl bg-gray-50">
                <div className={`w-14 h-14 ${f.bg} rounded-2xl flex items-center justify-center mb-4`}>
                  {f.icon}
                </div>
                <h3 className="text-gray-900 mb-2">{f.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-white py-12">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-gray-900 mb-3">Você é um profissional?</h2>
          <p className="text-gray-500 mb-6">
            Cadastre-se e comece a receber solicitações de clientes.
          </p>
          <button
            onClick={() => navigate("/cadastrar-profissional")}
            className="bg-accent hover:bg-accent/90 text-gray-900 px-8 py-3.5 rounded-xl transition-colors shadow-md"
          >
            Quero me cadastrar
          </button>
        </div>
      </section>
    </div>
  );
}
export default Home;
