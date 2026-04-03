import { FormEvent, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Search, RefreshCw, Menu } from "lucide-react";
import { motion } from "framer-motion";
import { ProfessionalCard } from "../componentes/ProfessionalCard";
import { SearchFilters } from "../componentes/SearchFilters";
import {
  Category,
  Professional,
  normalizeCategory,
  normalizeProfessional
} from "../utils/professionals";

function SearchPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const params = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const queryParam = params.get("q")?.trim() ?? "";
  const activeCategoryParam = params.get("cat")?.trim() ?? "";
  const latitudeParam = params.get("lat")?.trim() ?? "";
  const longitudeParam = params.get("lng")?.trim() ?? "";
  const accuracyParam = params.get("accuracy")?.trim() ?? "";

  const [searchInput, setSearchInput] = useState(queryParam);
  const [categories, setCategories] = useState<Category[]>([]);
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [dataError, setDataError] = useState<string | null>(null);
  const [selectedProId, setSelectedProId] = useState<string | null>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);

  // Filter states
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 1000000]);
  const [distanceRange, setDistanceRange] = useState<number | null>(null);
  const [minRating, setMinRating] = useState<number | null>(null);
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [onlineOnly, setOnlineOnly] = useState(false);

  useEffect(() => {
    setSearchInput(queryParam);
  }, [queryParam]);

  function applyFilters(nextQuery: string, nextCategory: string | null) {
    const nextParams = new URLSearchParams();

    if (nextQuery.trim()) {
      nextParams.set("q", nextQuery.trim());
    }

    if (nextCategory) {
      nextParams.set("cat", nextCategory);
    }

    if (latitudeParam && longitudeParam) {
      nextParams.set("lat", latitudeParam);
      nextParams.set("lng", longitudeParam);
      if (accuracyParam) nextParams.set("accuracy", accuracyParam);
    }

    const queryString = nextParams.toString();
    navigate(`/profissionais${queryString ? `?${queryString}` : ""}`);
  }

  function handleClearAllFilters() {
    setPriceRange([0, 1000000]);
    setDistanceRange(null);
    setMinRating(null);
    setVerifiedOnly(false);
    setOnlineOnly(false);
    applyFilters(queryParam, null);
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    applyFilters(searchInput, activeCategoryParam || null);
  }

  function handleCategoryChange(categoryId: string | null) {
    applyFilters(queryParam, categoryId);
  }

  async function loadSearchData(signal?: AbortSignal) {
    setLoadingData(true);
    setDataError(null);

    try {
      const apiParams = new URLSearchParams();
      if (queryParam) apiParams.set("q", queryParam);
      if (activeCategoryParam) apiParams.set("cat", activeCategoryParam);
      if (latitudeParam && longitudeParam) {
        apiParams.set("lat", latitudeParam);
        apiParams.set("lng", longitudeParam);
      }

      const professionalsPath = `/api/professionals${
        apiParams.toString() ? `?${apiParams.toString()}` : ""
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

      let parsedProfessionals = Array.isArray(professionalsPayload)
        ? professionalsPayload
            .map(normalizeProfessional)
            .filter(
              (professional): professional is Professional =>
                Boolean(professional)
            )
        : [];

      // Apply client-side filters
      if (verifiedOnly) {
        parsedProfessionals = parsedProfessionals.filter(p => p.verified);
      }

      if (onlineOnly) {
        parsedProfessionals = parsedProfessionals.filter(p => p.online);
      }

      if (minRating !== null) {
        parsedProfessionals = parsedProfessionals.filter(
          p => (p.rating ?? 0) >= minRating
        );
      }

      if (priceRange[1] !== 1000000 || priceRange[0] !== 0) {
        parsedProfessionals = parsedProfessionals.filter(
          p => (p.price ?? 0) >= priceRange[0] && (p.price ?? 0) <= priceRange[1]
        );
      }

      if (distanceRange !== null) {
        parsedProfessionals = parsedProfessionals.filter(
          p => (p.distance ?? Infinity) <= distanceRange
        );
      }

      setCategories(parsedCategories);
      setProfessionals(parsedProfessionals);
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        return;
      }

      const message =
        error instanceof Error ? error.message : "Erro ao carregar profissionais.";
      setDataError(message);
    } finally {
      setLoadingData(false);
    }
  }

  useEffect(() => {
    const controller = new AbortController();
    void loadSearchData(controller.signal);
    return () => controller.abort();
  }, [queryParam, activeCategoryParam, latitudeParam, longitudeParam, priceRange, distanceRange, minRating, verifiedOnly, onlineOnly]);

  const title = useMemo(() => {
    if (queryParam && activeCategoryParam) return "Resultados filtrados";
    if (queryParam) return `Resultados para "${queryParam}"`;
    if (activeCategoryParam) return "Profissionais por categoria";
    return "Todos os profissionais";
  }, [queryParam, activeCategoryParam]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-gradient-to-b from-white to-gray-50"
    >
      {/* Header */}
      <div className="sticky top-0 z-30 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setFiltersOpen(!filtersOpen)}
              className="lg:hidden p-2 hover:bg-gray-100 rounded-lg"
            >
              <Menu className="w-6 h-6" />
            </button>

            <form
              onSubmit={handleSubmit}
              className="flex-1 flex gap-3"
            >
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Busque por nome, categoria ou cidade"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg border-2 border-gray-200 focus:border-blue-400 focus:outline-none transition-colors"
                />
              </div>
              <button
                type="submit"
                className="px-6 py-2.5 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors whitespace-nowrap"
              >
                Buscar
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-8">
          {/* Sidebar Filters */}
          <SearchFilters
            categories={categories}
            activeCategory={activeCategoryParam}
            onCategoryChange={handleCategoryChange}
            priceRange={priceRange}
            onPriceChange={setPriceRange}
            distanceRange={distanceRange}
            onDistanceChange={setDistanceRange}
            minRating={minRating}
            onRatingChange={setMinRating}
            verifiedOnly={verifiedOnly}
            onVerifiedChange={setVerifiedOnly}
            onlineOnly={onlineOnly}
            onOnlineChange={setOnlineOnly}
            onClearFilters={handleClearAllFilters}
            isOpen={filtersOpen}
            onClose={() => setFiltersOpen(false)}
          />

          {/* Results */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex-1"
          >
            {/* Title and Results Count */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">{title}</h1>
                <p className="text-gray-600 mt-1">
                  {loadingData
                    ? "Carregando resultados..."
                    : `${professionals.length} profissional${
                        professionals.length === 1 ? "" : "is"
                      } encontrados`}
                </p>
              </div>

              <button
                onClick={() => void loadSearchData()}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                title="Atualizar"
              >
                <RefreshCw className="w-5 h-5 text-gray-600" />
              </button>
            </div>

            {/* Results Grid */}
            {loadingData ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-white rounded-lg border border-gray-200 p-8 text-center"
              >
                <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-3" />
                <p className="text-gray-600">Carregando profissionais...</p>
              </motion.div>
            ) : dataError ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-white rounded-lg border-l-4 border-red-500 p-6"
              >
                <p className="text-red-700 font-semibold mb-4">{dataError}</p>
                <button
                  onClick={() => void loadSearchData()}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  Tentar novamente
                </button>
              </motion.div>
            ) : professionals.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-white rounded-lg border border-gray-200 p-8 text-center"
              >
                <p className="text-gray-600 text-lg">
                  Nenhum profissional encontrado com os filtros atuais.
                </p>
                <button
                  onClick={() => handleClearAllFilters()}
                  className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Limpar filtros
                </button>
              </motion.div>
            ) : (
              <motion.div
                variants={{
                  hidden: { opacity: 0 },
                  visible: {
                    opacity: 1,
                    transition: {
                      staggerChildren: 0.1,
                    },
                  },
                }}
                initial="hidden"
                animate="visible"
                className="grid grid-cols-1 md:grid-cols-2 gap-4"
              >
                {professionals.map((professional, index) => (
                  <motion.div
                    key={professional.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <ProfessionalCard
                      pro={professional}
                      highlighted={selectedProId === professional.id}
                      onSelect={() => setSelectedProId(professional.id)}
                    />
                  </motion.div>
                ))}
              </motion.div>
            )}
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}

export default SearchPage;
