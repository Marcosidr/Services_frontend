import { FormEvent, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  MapPin,
  Navigation,
  Shield,
  Clock,
  ChevronRight,
  Sparkles
} from "lucide-react";
import { ProfessionalCard } from "../componentes/ProfessionalCard";
import {
  Category,
  Professional,
  normalizeCategory,
  normalizeProfessional
} from "../utils/professionals";

type CurrentLocation = {
  latitude: number;
  longitude: number;
  accuracy: number;
};

const LOCATION_STORAGE_KEY = "zentry_current_location";

function getCategoryBadge(label: string) {
  const parts = label
    .trim()
    .split(" ")
    .filter(Boolean);

  if (parts.length === 0) return "#";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}

function Home() {
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState("");
  const [menuMessage, setMenuMessage] = useState<string | null>(null);
  const [locationGranted, setLocationGranted] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [selectedProId, setSelectedProId] = useState<string | null>(null);
  const [loadingData, setLoadingData] = useState(true);
  const [dataError, setDataError] = useState<string | null>(null);
  const [currentLocation, setCurrentLocation] = useState<CurrentLocation | null>(null);

  async function loadHomeData(signal?: AbortSignal, location?: CurrentLocation | null) {
    setLoadingData(true);
    setDataError(null);

    try {
      const effectiveLocation = location ?? currentLocation;
      const professionalsParams = new URLSearchParams();
      if (effectiveLocation) {
        professionalsParams.set("lat", String(effectiveLocation.latitude));
        professionalsParams.set("lng", String(effectiveLocation.longitude));
      }

      const professionalsPath = `/api/professionals${
        professionalsParams.toString() ? `?${professionalsParams.toString()}` : ""
      }`;

      const [categoriesResponse, professionalsResponse] = await Promise.all([
        fetch("/api/categories", { signal }),
        fetch(professionalsPath, { signal })
      ]);

      if (!categoriesResponse.ok) {
        throw new Error("Nao foi possivel carregar as categorias.");
      }

      if (!professionalsResponse.ok) {
        throw new Error("Nao foi possivel carregar os profissionais.");
      }

      const categoriesPayload: unknown = await categoriesResponse.json();
      const professionalsPayload: unknown = await professionalsResponse.json();

      const parsedCategories = Array.isArray(categoriesPayload)
        ? categoriesPayload
            .map(normalizeCategory)
            .filter((category): category is Category => Boolean(category))
            .filter((category) => category.is_active !== false)
        : [];

      const parsedProfessionals = Array.isArray(professionalsPayload)
        ? professionalsPayload
            .map(normalizeProfessional)
            .filter(
              (professional): professional is Professional =>
                Boolean(professional)
            )
        : [];

      setCategories(parsedCategories);
      setProfessionals(parsedProfessionals);
      setMenuMessage(null);
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        return;
      }

      const message =
        error instanceof Error ? error.message : "Erro ao carregar a pagina.";
      setDataError(message);
      setMenuMessage(message);
    } finally {
      setLoadingData(false);
    }
  }

  useEffect(() => {
    const controller = new AbortController();
    void loadHomeData(controller.signal);
    return () => controller.abort();
  }, []);

  useEffect(() => {
    const rawLocation = window.sessionStorage.getItem(LOCATION_STORAGE_KEY);
    if (!rawLocation) return;

    try {
      const parsed = JSON.parse(rawLocation) as CurrentLocation;
      if (
        typeof parsed?.latitude === "number" &&
        typeof parsed?.longitude === "number" &&
        typeof parsed?.accuracy === "number"
      ) {
        setCurrentLocation(parsed);
        setLocationGranted(true);
        void loadHomeData(undefined, parsed);
      }
    } catch {
      window.sessionStorage.removeItem(LOCATION_STORAGE_KEY);
    }
  }, []);

  const visibleProfessionals = useMemo(() => {
    if (!activeCategory) return professionals;
    return professionals.filter((professional) =>
      professional.categoryIds?.includes(activeCategory)
    );
  }, [professionals, activeCategory]);

  const onlineCount = useMemo(
    () => visibleProfessionals.filter((professional) => professional.online).length,
    [visibleProfessionals]
  );

  const professionalsByCategory = useMemo(() => {
    const countMap = new Map<string, number>();

    professionals.forEach((professional) => {
      professional.categoryIds?.forEach((categoryId) => {
        countMap.set(categoryId, (countMap.get(categoryId) ?? 0) + 1);
      });
    });

    return countMap;
  }, [professionals]);

  function getCurrentPosition() {
    return new Promise<GeolocationPosition>((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: true,
        timeout: 10000
      });
    });
  }

  async function handleLocationRequest() {
    setMenuMessage(null);
    setLocationLoading(true);

    try {
      if (!("geolocation" in navigator)) {
        setMenuMessage("Seu navegador nao suporta geolocalizacao.");
        return;
      }

      const position = await getCurrentPosition();
      const nextLocation = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy
      };

      setCurrentLocation(nextLocation);
      setLocationGranted(true);
      window.sessionStorage.setItem(
        LOCATION_STORAGE_KEY,
        JSON.stringify(nextLocation)
      );
      setMenuMessage(
        `Localizacao atual detectada (precisao de ${Math.round(
          nextLocation.accuracy
        )} m).`
      );
      void loadHomeData(undefined, nextLocation);
    } catch {
      setMenuMessage("Nao foi possivel obter sua localizacao.");
      setLocationGranted(false);
    } finally {
      setLocationLoading(false);
    }
  }

  function handleSearch(event: FormEvent) {
    event.preventDefault();

    const query = searchQuery.trim();
    if (!query) {
      setMenuMessage("Digite o servico que voce precisa.");
      return;
    }

    const params = new URLSearchParams();
    params.set("q", query);

    if (currentLocation) {
      params.set("lat", String(currentLocation.latitude));
      params.set("lng", String(currentLocation.longitude));
      params.set("accuracy", String(Math.round(currentLocation.accuracy)));
    }

    navigate(`/profissionais?${params.toString()}`);
  }

  function handleCategory(categoryId: string) {
    setActiveCategory((current) => (current === categoryId ? null : categoryId));
  }

  function clearCategoryFilter() {
    setActiveCategory(null);
  }

  return (
    <div className="page-shell">
      <section className="relative overflow-hidden bg-gradient-to-br from-primary via-blue-700 to-secondary text-white">
        <div className="pointer-events-none absolute -left-20 top-0 h-72 w-72 rounded-full bg-white/20 blur-3xl" />
        <div className="pointer-events-none absolute bottom-0 right-0 h-64 w-64 rounded-full bg-accent/30 blur-3xl" />
        <div className="section-container relative pt-12 pb-16">
          <div className="max-w-2xl animate-fade-up">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/20 px-3 py-1 text-sm backdrop-blur-sm">
              <MapPin className="w-3.5 h-3.5" />
              <span>Encontre profissionais perto de voce</span>
            </div>

            <h1
              className="mb-4 text-3xl text-white md:text-5xl"
              style={{ fontWeight: 700, lineHeight: 1.2 }}
            >
              Encontre o profissional <span className="text-accent">certo</span> perto de voce
            </h1>

            <p className="mb-8 text-lg text-white/90">
              Conectamos voce com profissionais verificados e organizamos as
              opcoes para voce escolher com seguranca.
            </p>

            {!locationGranted ? (
              <button
                onClick={handleLocationRequest}
                disabled={locationLoading}
                className="mb-5 flex items-center gap-2 rounded-xl border border-white/45 bg-white/15 px-4 py-2.5 text-white backdrop-blur-md hover:-translate-y-0.5 hover:bg-white/25"
              >
                {locationLoading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Navigation className="w-4 h-4" />
                )}
                {locationLoading
                  ? "Detectando localizacao..."
                  : "Usar minha localizacao atual"}
              </button>
            ) : (
              <div className="flex items-center gap-2 text-green-200 mb-5">
                <MapPin className="w-4 h-4" />
                <span className="text-sm">
                  Localizacao autorizada
                  {currentLocation
                    ? ` (${Math.round(currentLocation.accuracy)}m de precisao)`
                    : ""}
                </span>
              </div>
            )}

            {menuMessage && <p className="text-sm text-accent mb-3">{menuMessage}</p>}

            <form onSubmit={handleSearch} className="hero-glass flex gap-3 p-2.5 shadow-[0_24px_60px_-28px_rgba(2,6,23,0.75)]">
              <div className="flex-1 relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Qual servico voce precisa?"
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  className="w-full rounded-xl border border-white/70 bg-white pl-11 pr-4 py-3.5 text-gray-800 placeholder-gray-400 outline-none"
                />
              </div>
              <button
                type="submit"
                className="btn-accent whitespace-nowrap px-6 py-3.5"
              >
                Buscar
              </button>
            </form>
          </div>
        </div>
      </section>

      <section className="border-b border-white/70 bg-white/60 backdrop-blur-md">
        <div className="section-container py-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-primary/70">
                Categorias
              </p>
              <h2 className="text-gray-900">Escolha o tipo de servico</h2>
            </div>

            {activeCategory && (
              <button
                onClick={clearCategoryFilter}
                className="btn-ghost text-sm"
              >
                Limpar filtro
              </button>
            )}
          </div>

          {loadingData ? (
            <p className="text-sm text-gray-400">Carregando categorias...</p>
          ) : categories.length === 0 ? (
            <p className="text-sm text-gray-400">
              Categorias aparecerao aqui quando forem cadastradas.
            </p>
          ) : (
            <div className="overflow-x-auto pb-2">
              <div className="flex gap-3 min-w-max">
                {categories.map((category) => {
                  const count = professionalsByCategory.get(category.id) ?? 0;
                  const isActive = activeCategory === category.id;

                  return (
                    <button
                      key={category.id}
                      onClick={() => handleCategory(category.id)}
                      className={`
                        w-[190px] rounded-2xl border p-4 text-left transition-all hover:-translate-y-0.5
                        ${
                          isActive
                            ? "border-primary bg-primary text-white shadow-[0_16px_36px_-24px_rgba(29,78,216,0.95)]"
                            : "border-slate-200 bg-white/85 text-slate-800 hover:border-primary/35 hover:bg-white"
                        }
                      `}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <span
                          className={`
                            w-10 h-10 rounded-xl flex items-center justify-center text-sm
                            ${
                              isActive
                                ? "bg-white/20 text-white"
                                : "bg-primary/10 text-primary"
                            }
                          `}
                          style={{ fontWeight: 700 }}
                        >
                          {getCategoryBadge(category.label)}
                        </span>

                        <Sparkles className={`w-4 h-4 ${isActive ? "text-white" : "text-primary/70"}`} />
                      </div>

                      <p
                        className={`${isActive ? "text-white" : "text-gray-900"}`}
                        style={{ fontWeight: 600 }}
                      >
                        {category.label}
                      </p>

                      <p className={`text-xs mt-1 ${isActive ? "text-white/80" : "text-gray-500"}`}>
                        {count} profissional{count === 1 ? "" : "is"}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </section>

      <section className="section-container py-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-gray-900">Profissionais</h2>

            {loadingData ? (
              <p className="text-sm text-gray-500 mt-1">Carregando profissionais...</p>
            ) : visibleProfessionals.length > 0 ? (
              <p className="text-sm text-gray-500 mt-1">
                {onlineCount} disponiveis agora
              </p>
            ) : (
              <p className="text-sm text-gray-500 mt-1">
                Nenhum profissional encontrado para o filtro atual.
              </p>
            )}
          </div>

          <button
            onClick={() => navigate("/profissionais")}
            className="btn-ghost text-sm"
          >
            Ver todos
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {loadingData ? (
          <div className="surface-card p-6">
            <p className="text-gray-600">Buscando profissionais e categorias...</p>
          </div>
        ) : dataError ? (
          <div className="surface-card border-red-200 p-6">
            <p className="text-red-600 mb-3">{dataError}</p>
            <button
              onClick={() => {
                void loadHomeData();
              }}
              className="btn-primary"
            >
              Tentar novamente
            </button>
          </div>
        ) : visibleProfessionals.length === 0 ? (
          <div className="surface-card p-6">
            <p className="text-gray-600">
              Assim que houver profissionais cadastrados no banco, eles aparecem aqui automaticamente.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {visibleProfessionals.slice(0, 6).map((professional) => (
              <ProfessionalCard
                key={professional.id}
                pro={professional}
                highlighted={selectedProId === professional.id}
                onSelect={() => setSelectedProId(professional.id)}
              />
            ))}
          </div>
        )}
      </section>

      <section className="mt-6 border-y border-white/75 bg-white/65">
        <div className="section-container py-12">
          <h2 className="text-center text-gray-900 mb-10">
            Por que usar a plataforma?
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: <Navigation className="w-6 h-6 text-primary" />,
                title: "Busca por proximidade",
                desc: "Mostre profissionais mais proximos quando a localizacao estiver autorizada.",
                bg: "bg-primary/10"
              },
              {
                icon: <Shield className="w-6 h-6 text-secondary" />,
                title: "Perfis verificados",
                desc: "Voce pode validar documentos e avaliacoes conforme seu processo.",
                bg: "bg-secondary/15"
              },
              {
                icon: <Clock className="w-6 h-6 text-accent" />,
                title: "Resposta rapida",
                desc: "O usuario encontra e chama um profissional com poucos cliques.",
                bg: "bg-accent/15"
              }
            ].map((feature, index) => (
              <div
                key={index}
                className="surface-card flex flex-col items-center p-6 text-center"
              >
                <div
                  className={`w-14 h-14 ${feature.bg} rounded-2xl flex items-center justify-center mb-4`}
                >
                  {feature.icon}
                </div>
                <h3 className="text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-14">
        <div className="section-container">
          <div className="surface-card-strong mx-auto max-w-3xl px-4 py-12 text-center">
          <h2 className="text-gray-900 mb-3">Voce e um profissional?</h2>
          <p className="text-gray-500 mb-6">
            Cadastre-se e comece a receber solicitacoes de clientes.
          </p>
          <button
            onClick={() => navigate("/cadastrar-profissional")}
            className="btn-accent px-8 py-3.5"
          >
            Quero me cadastrar
          </button>
          </div>
        </div>
      </section>
    </div>
  );
}

export default Home;
