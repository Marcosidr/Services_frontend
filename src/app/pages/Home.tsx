import { FormEvent, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  MapPin,
  Navigation,
  Shield,
  Clock,
  ChevronRight,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Headphones,
  Home as HomeIcon,
  PlugZap,
  Star,
  TimerReset,
  Wrench,
  Zap
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

const serviceHighlights = [
  {
    icon: <Wrench className="w-5 h-5" />,
    title: "Manutencao residencial",
    desc: "Reparos, instalacoes e ajustes com profissionais organizados por regiao."
  },
  {
    icon: <PlugZap className="w-5 h-5" />,
    title: "Assistencia tecnica",
    desc: "Atendimento para eletrica, equipamentos, pequenos consertos e suporte rapido."
  },
  {
    icon: <HomeIcon className="w-5 h-5" />,
    title: "Servicos para o lar",
    desc: "Categorias claras para encontrar a pessoa certa sem perder tempo."
  }
];

const benefits = [
  {
    value: "24h",
    label: "Fluxo simples para pedir ajuda",
    icon: <TimerReset className="w-5 h-5" />
  },
  {
    value: "100%",
    label: "Experiencia digital e organizada",
    icon: <Sparkles className="w-5 h-5" />
  },
  {
    value: "3x",
    label: "Menos etapas ate falar com um profissional",
    icon: <Zap className="w-5 h-5" />
  }
];

const flowSteps = [
  {
    step: "01",
    title: "Informe o servico",
    desc: "Pesquise pelo que precisa ou escolha uma categoria disponivel."
  },
  {
    step: "02",
    title: "Compare profissionais",
    desc: "Veja distancia, disponibilidade, avaliacoes e especialidades."
  },
  {
    step: "03",
    title: "Chame com seguranca",
    desc: "Acesse o perfil e avance para atendimento com mais confianca."
  }
];

const testimonials = [
  {
    name: "Marina Costa",
    role: "Cliente residencial",
    text: "Encontrei um tecnico disponivel perto de casa e consegui comparar as opcoes sem confusao.",
    initials: "MC"
  },
  {
    name: "Rafael Nunes",
    role: "Condominio",
    text: "A interface passa confianca e deixa claro quem esta disponivel para resolver rapido.",
    initials: "RN"
  },
  {
    name: "Bianca Torres",
    role: "Profissional cadastrada",
    text: "O cadastro ficou com aparencia profissional e ajuda o cliente a entender meu atendimento.",
    initials: "BT"
  }
];

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
    <div className="page-shell overflow-hidden">
      <section className="premium-hero relative overflow-hidden text-white">
        <div className="premium-grid-overlay" />
        <div className="pointer-events-none absolute -left-24 top-10 h-80 w-80 rounded-full bg-primary/35 blur-3xl" />
        <div className="pointer-events-none absolute right-0 top-24 h-72 w-72 rounded-full bg-secondary/30 blur-3xl" />
        <div className="pointer-events-none absolute bottom-0 left-1/2 h-72 w-72 rounded-full bg-accent/20 blur-3xl" />

        <div className="section-container relative grid min-h-[calc(100vh-4rem)] items-center gap-10 py-12 lg:grid-cols-[1.04fr_0.96fr] lg:py-16">
          <div className="max-w-3xl animate-fade-up">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3.5 py-1.5 text-sm text-blue-50 shadow-[0_18px_45px_-34px_rgba(255,255,255,0.75)] backdrop-blur-xl">
              <MapPin className="w-3.5 h-3.5" />
              <span>Servicos residenciais com atendimento inteligente</span>
            </div>

            <h1
              className="mb-5 text-4xl text-white sm:text-5xl lg:text-6xl"
              style={{ fontWeight: 800, lineHeight: 1.04 }}
            >
              Busque o que precisa aqui na{" "}
              <span className="text-gradient-brand">ZENTRY</span>
            </h1>

            <p className="mb-8 max-w-2xl text-base leading-8 text-blue-50/88 md:text-lg">
              Encontre profissionais perto de voce, compare opcoes com clareza e
              avance para o atendimento com uma experiencia moderna, segura e
              organizada.
            </p>

            {!locationGranted ? (
              <button
                onClick={handleLocationRequest}
                disabled={locationLoading}
                className="mb-5 flex items-center gap-2 rounded-2xl border border-white/25 bg-white/12 px-4 py-2.5 text-white shadow-[0_18px_35px_-28px_rgba(255,255,255,0.9)] backdrop-blur-xl hover:-translate-y-0.5 hover:bg-white/18"
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
              <div className="mb-5 flex items-center gap-2 rounded-full text-emerald-200">
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

            <form onSubmit={handleSearch} className="hero-glass flex flex-col gap-3 p-2.5 shadow-[0_30px_80px_-42px_rgba(2,6,23,0.95)] sm:flex-row">
              <div className="flex-1 relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Qual servico voce precisa?"
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  className="w-full rounded-2xl border border-white/70 bg-white pl-11 pr-4 py-3.5 text-gray-800 placeholder-gray-400 outline-none shadow-[inset_0_1px_0_rgba(255,255,255,0.9)]"
                />
              </div>
              <button
                type="submit"
                className="btn-accent whitespace-nowrap px-6 py-3.5"
              >
                Buscar
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>

            <div className="mt-8 grid grid-cols-3 gap-3 sm:max-w-xl">
              {[
                { value: professionals.length || "50+", label: "profissionais" },
                { value: onlineCount || "agora", label: "disponiveis" },
                { value: categories.length || "multi", label: "categorias" }
              ].map((stat) => (
                <div key={stat.label} className="rounded-2xl border border-white/15 bg-white/10 p-3 backdrop-blur-xl">
                  <p className="text-xl text-white sm:text-2xl" style={{ fontWeight: 800 }}>
                    {stat.value}
                  </p>
                  <p className="mt-1 text-xs text-blue-100/80">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="relative animate-fade-up animate-fade-up-delay-2">
            <div className="absolute -inset-4 rounded-[2rem] bg-gradient-to-br from-primary/35 via-secondary/25 to-accent/25 blur-2xl" />
            <div className="premium-device relative overflow-hidden rounded-[2rem] border border-white/20 bg-white/12 p-4 shadow-[0_35px_90px_-42px_rgba(0,0,0,0.95)] backdrop-blur-2xl">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase text-blue-100/70">Zentry OS</p>
                  <h2 className="text-xl text-white">Central de atendimento</h2>
                </div>
                <div className="rounded-full border border-emerald-300/30 bg-emerald-400/15 px-3 py-1 text-xs text-emerald-100">
                  online
                </div>
              </div>

              <div className="grid gap-3">
                {serviceHighlights.map((service, index) => (
                  <div
                    key={service.title}
                    className="premium-dashboard-card animate-float-slow"
                    style={{ animationDelay: `${index * 0.8}s` }}
                  >
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-primary">
                      {service.icon}
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-white" style={{ fontWeight: 700 }}>
                        {service.title}
                      </p>
                      <p className="mt-1 text-xs leading-5 text-blue-50/75">{service.desc}</p>
                    </div>

                    <CheckCircle2 className="h-5 w-5 shrink-0 text-secondary" />
                  </div>
                ))}
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3">
                <div className="rounded-3xl border border-white/12 bg-white/10 p-4">
                  <p className="text-3xl text-white" style={{ fontWeight: 800 }}>4.9</p>
                  <div className="mt-2 flex gap-0.5 text-accent">
                    {Array.from({ length: 5 }).map((_, index) => (
                      <Star key={index} className="h-3.5 w-3.5 fill-current" />
                    ))}
                  </div>
                  <p className="mt-2 text-xs text-blue-50/70">media de confianca</p>
                </div>
                <div className="rounded-3xl border border-white/12 bg-white/10 p-4">
                  <p className="text-3xl text-white" style={{ fontWeight: 800 }}>15min</p>
                  <p className="mt-2 text-xs leading-5 text-blue-50/70">para encontrar uma opcao perto de voce</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="relative border-b border-white/70 bg-white/55 backdrop-blur-md dark:bg-white/[0.03]">
        <div className="section-container py-10">
          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="premium-eyebrow">
                Servicos
              </p>
              <h2 className="text-2xl text-gray-950 dark:text-white md:text-3xl">
                Escolha o tipo de atendimento
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500 dark:text-slate-300">
                Categorias dinâmicas do sistema com uma leitura mais clara e visual premium.
              </p>
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
                        group w-[210px] rounded-3xl border p-4 text-left transition-all hover:-translate-y-1
                        ${
                          isActive
                            ? "border-primary bg-gradient-to-br from-primary to-secondary text-white shadow-[0_22px_50px_-28px_rgba(29,78,216,0.95)]"
                            : "border-white/80 bg-white/85 text-slate-800 shadow-[0_18px_45px_-36px_rgba(15,23,42,0.45)] backdrop-blur-xl hover:border-primary/35 hover:bg-white dark:border-white/10 dark:bg-white/[0.06] dark:text-white"
                        }
                      `}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <span
                          className={`
                            flex h-11 w-11 items-center justify-center rounded-2xl text-sm transition-transform group-hover:scale-105
                            ${
                              isActive
                                ? "bg-white/20 text-white"
                                : "bg-primary/10 text-primary dark:bg-white/10 dark:text-blue-200"
                            }
                          `}
                          style={{ fontWeight: 700 }}
                        >
                          {getCategoryBadge(category.label)}
                        </span>

                        <Sparkles className={`w-4 h-4 ${isActive ? "text-white" : "text-primary/70"}`} />
                      </div>

                      <p
                        className={`${isActive ? "text-white" : "text-gray-900 dark:text-white"}`}
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

      <section className="section-container py-12">
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="premium-eyebrow">Atendimento rapido</p>
            <h2 className="text-2xl text-gray-950 dark:text-white md:text-3xl">Profissionais em destaque</h2>

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

      <section className="relative border-y border-white/75 bg-white/65 dark:bg-white/[0.03]">
        <div className="section-container py-16">
          <div className="mx-auto mb-10 max-w-3xl text-center">
            <p className="premium-eyebrow justify-center">Beneficios</p>
            <h2 className="mt-2 text-3xl text-gray-950 dark:text-white md:text-4xl">
              Confiança, tecnologia e agilidade no mesmo fluxo
            </h2>
            <p className="mt-3 text-sm leading-7 text-slate-500 dark:text-slate-300">
              A experiencia foi pensada para transmitir organizacao e reduzir atrito
              entre cliente e profissional.
            </p>
          </div>

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
                className="surface-card group flex flex-col items-center p-6 text-center hover:-translate-y-1 hover:border-primary/20"
              >
                <div
                  className={`mb-4 flex h-14 w-14 items-center justify-center rounded-2xl ${feature.bg} transition-transform group-hover:scale-105`}
                >
                  {feature.icon}
                </div>
                <h3 className="text-gray-900 mb-2 dark:text-white">{feature.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed dark:text-slate-300">{feature.desc}</p>
              </div>
            ))}
          </div>

          <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-3">
            {benefits.map((benefit) => (
              <div key={benefit.label} className="premium-metric">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  {benefit.icon}
                </div>
                <div>
                  <p className="text-3xl text-gray-950 dark:text-white" style={{ fontWeight: 800 }}>
                    {benefit.value}
                  </p>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-300">{benefit.label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section-container py-16">
        <div className="grid gap-10 lg:grid-cols-[0.82fr_1.18fr] lg:items-center">
          <div>
            <p className="premium-eyebrow">Como funciona</p>
            <h2 className="mt-2 text-3xl text-gray-950 dark:text-white md:text-4xl">
              Um caminho claro do problema ate o atendimento
            </h2>
            <p className="mt-4 text-sm leading-7 text-slate-500 dark:text-slate-300">
              A navegacao prioriza decisao rapida: buscar, comparar e chamar.
              Cada etapa reforca seguranca e reduz duvidas.
            </p>
          </div>

          <div className="relative">
            <div className="absolute left-6 top-8 hidden h-[calc(100%-4rem)] w-px bg-gradient-to-b from-primary via-secondary to-accent md:block" />
            <div className="grid gap-4">
              {flowSteps.map((item) => (
                <div key={item.step} className="surface-card relative grid gap-3 p-5 md:grid-cols-[4rem_1fr]">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-secondary text-white shadow-[0_18px_35px_-22px_rgba(29,78,216,0.9)]">
                    {item.step}
                  </div>
                  <div>
                    <h3 className="text-gray-950 dark:text-white">{item.title}</h3>
                    <p className="mt-1 text-sm leading-6 text-slate-500 dark:text-slate-300">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-white/75 bg-white/55 dark:bg-white/[0.03]">
        <div className="section-container py-16">
          <div className="mb-10 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="premium-eyebrow">Depoimentos</p>
              <h2 className="mt-2 text-3xl text-gray-950 dark:text-white md:text-4xl">
                Uma experiencia que transmite organizacao
              </h2>
            </div>
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/15 bg-primary/10 px-4 py-2 text-sm text-primary">
              <Headphones className="w-4 h-4" />
              Suporte e atendimento humanizado
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {testimonials.map((testimonial) => (
              <article key={testimonial.name} className="surface-card p-5">
                <div className="mb-4 flex items-center gap-1 text-accent">
                  {Array.from({ length: 5 }).map((_, index) => (
                    <Star key={index} className="h-4 w-4 fill-current" />
                  ))}
                </div>
                <p className="text-sm leading-7 text-slate-600 dark:text-slate-300">
                  "{testimonial.text}"
                </p>
                <div className="mt-5 flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-primary to-secondary text-sm text-white" style={{ fontWeight: 800 }}>
                    {testimonial.initials}
                  </div>
                  <div>
                    <p className="text-sm text-gray-950 dark:text-white" style={{ fontWeight: 700 }}>
                      {testimonial.name}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{testimonial.role}</p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="section-container">
          <div className="premium-cta relative overflow-hidden rounded-[2rem] px-5 py-12 text-center text-white md:px-10 md:py-16">
            <div className="pointer-events-none absolute -left-16 top-0 h-56 w-56 rounded-full bg-white/18 blur-3xl" />
            <div className="pointer-events-none absolute -right-20 bottom-0 h-64 w-64 rounded-full bg-accent/25 blur-3xl" />
            <div className="relative mx-auto max-w-3xl">
              <p className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs uppercase text-blue-50">
                <Shield className="w-3.5 h-3.5" />
                Cresca com uma vitrine mais profissional
              </p>
              <h2 className="mb-3 text-3xl text-white md:text-5xl">
                Voce e um profissional?
              </h2>
              <p className="mx-auto mb-7 max-w-xl text-sm leading-7 text-blue-50/85 md:text-base">
                Cadastre-se e comece a receber solicitacoes de clientes com uma
                presenca digital mais moderna, confiavel e organizada.
              </p>
              <button
                onClick={() => navigate("/cadastrar-profissional")}
                className="btn-accent px-8 py-3.5"
              >
                Quero me cadastrar
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default Home;
