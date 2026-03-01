import { useState } from "react";
import { useNavigate } from "react-router";
import {
  Search,
  MapPin,
  Navigation,
  Star,
  Shield,
  Clock,
  ChevronRight,
  TrendingUp,
} from "lucide-react";
import { MapView } from "../components/MapView";
import { ProfessionalCard } from "../components/ProfessionalCard";
import { professionals, categories, Professional } from "../data/mockData";

export function Home() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [locationGranted, setLocationGranted] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);
  const [selectedPro, setSelectedPro] = useState<Professional | null>(null);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const handleLocationRequest = () => {
    setLocationLoading(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        () => {
          setLocationGranted(true);
          setLocationLoading(false);
        },
        () => {
          // Simulate success anyway for demo
          setLocationGranted(true);
          setLocationLoading(false);
        }
      );
    } else {
      setTimeout(() => {
        setLocationGranted(true);
        setLocationLoading(false);
      }, 1000);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    navigate(`/profissionais?q=${encodeURIComponent(searchQuery)}`);
  };

  const handleCategory = (catId: string) => {
    setActiveCategory(catId);
    navigate(`/profissionais?categoria=${catId}`);
  };

  const nearbyPros = professionals
    .filter((p) => activeCategory ? p.category === activeCategory : true)
    .sort((a, b) => a.distance - b.distance)
    .slice(0, 5);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero section */}
      <section className="bg-gradient-to-br from-blue-700 via-blue-600 to-blue-500 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-16">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full text-sm mb-4">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>+1.200 profissionais disponíveis em SP</span>
            </div>
            <h1 className="text-3xl md:text-5xl text-white mb-4" style={{ fontWeight: 700, lineHeight: 1.2 }}>
              Encontre o profissional{" "}
              <span className="text-orange-300">certo</span> perto de você
            </h1>
            <p className="text-blue-100 mb-8 text-lg">
              Conectamos você com profissionais verificados em tempo real,
              usando geolocalização para encontrar quem está mais próximo.
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
                {locationLoading
                  ? "Detectando localização..."
                  : "Usar minha localização atual"}
              </button>
            ) : (
              <div className="flex items-center gap-2 text-green-300 mb-5">
                <MapPin className="w-4 h-4" />
                <span className="text-sm">
                  Localização detectada: São Paulo, SP
                </span>
              </div>
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
                className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-3.5 rounded-xl transition-colors shadow-lg whitespace-nowrap"
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
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => handleCategory(cat.id)}
                className={`
                  flex items-center gap-2 px-4 py-2 rounded-full text-sm whitespace-nowrap flex-shrink-0 transition-all border
                  ${
                    activeCategory === cat.id
                      ? "bg-blue-600 text-white border-blue-600"
                      : "bg-gray-50 text-gray-700 border-gray-200 hover:border-blue-300 hover:bg-blue-50"
                  }
                `}
              >
                <span>{cat.icon}</span>
                <span>{cat.label}</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Main content: Map + List */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-gray-900">
              Profissionais próximos a você
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              {professionals.filter((p) => p.online).length} disponíveis agora
            </p>
          </div>
          <button
            onClick={() => navigate("/profissionais")}
            className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700"
          >
            Ver todos
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Map */}
          <div className="h-[480px] lg:h-[560px] rounded-2xl overflow-hidden sticky top-20">
            <MapView
              selectedPro={selectedPro}
              onSelectPro={setSelectedPro}
              filteredPros={nearbyPros}
            />
          </div>

          {/* Professional list */}
          <div className="flex flex-col gap-3 overflow-y-auto lg:max-h-[560px] pr-1">
            {nearbyPros.map((pro) => (
              <ProfessionalCard
                key={pro.id}
                pro={pro}
                highlighted={selectedPro?.id === pro.id}
                onSelect={() =>
                  setSelectedPro(selectedPro?.id === pro.id ? null : pro)
                }
              />
            ))}
            <button
              onClick={() => navigate("/profissionais")}
              className="mt-2 py-3 border-2 border-dashed border-blue-200 rounded-xl text-blue-600 hover:bg-blue-50 transition-colors text-sm"
            >
              Ver mais profissionais →
            </button>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="bg-white border-t border-gray-100 mt-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <h2 className="text-center text-gray-900 mb-10">
            Por que usar o ResolveAqui?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: <Navigation className="w-6 h-6 text-blue-600" />,
                title: "Geolocalização em tempo real",
                desc: "Encontramos profissionais próximos a você automaticamente, economizando tempo.",
                bg: "bg-blue-50",
              },
              {
                icon: <Shield className="w-6 h-6 text-green-600" />,
                title: "Profissionais verificados",
                desc: "Todos os profissionais passam por verificação de identidade e histórico.",
                bg: "bg-green-50",
              },
              {
                icon: <Clock className="w-6 h-6 text-orange-500" />,
                title: "Atendimento imediato",
                desc: "Serviço urgente? Encontre profissionais disponíveis agora para atender na hora.",
                bg: "bg-orange-50",
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

      {/* Stats */}
      <section className="bg-blue-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {[
              { value: "1.200+", label: "Profissionais" },
              { value: "98%", label: "Satisfação" },
              { value: "15 min", label: "Tempo médio" },
              { value: "50K+", label: "Serviços feitos" },
            ].map((s, i) => (
              <div key={i}>
                <p className="text-white" style={{ fontSize: "2rem", fontWeight: 700 }}>
                  {s.value}
                </p>
                <p className="text-blue-200 text-sm">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-white py-12">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-gray-900 mb-3">
            Você é um profissional?
          </h2>
          <p className="text-gray-500 mb-6">
            Cadastre-se gratuitamente, receba solicitações de clientes próximos
            e aumente sua renda.
          </p>
          <button
            onClick={() => navigate("/cadastrar-profissional")}
            className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-3.5 rounded-xl transition-colors shadow-md"
          >
            Quero me cadastrar como profissional
          </button>
        </div>
      </section>
    </div>
  );
}
