import { FormEvent, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Filter, Search, RefreshCw } from "lucide-react";
import { ProfessionalCard } from "../componentes/ProfessionalCard";
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

  const [searchInput, setSearchInput] = useState(queryParam);
  const [categories, setCategories] = useState<Category[]>([]);
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [dataError, setDataError] = useState<string | null>(null);
  const [selectedProId, setSelectedProId] = useState<string | null>(null);

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

    const queryString = nextParams.toString();
    navigate(`/profissionais${queryString ? `?${queryString}` : ""}`);
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    applyFilters(searchInput, activeCategoryParam || null);
  }

  function handleCategoryToggle(categoryId: string) {
    const nextCategory = activeCategoryParam === categoryId ? null : categoryId;
    applyFilters(queryParam, nextCategory);
  }

  async function loadSearchData(signal?: AbortSignal) {
    setLoadingData(true);
    setDataError(null);

    try {
      const apiParams = new URLSearchParams();
      if (queryParam) apiParams.set("q", queryParam);
      if (activeCategoryParam) apiParams.set("cat", activeCategoryParam);

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
  }, [queryParam, activeCategoryParam]);

  const title = useMemo(() => {
    if (queryParam && activeCategoryParam) return "Resultados filtrados";
    if (queryParam) return `Resultados para \"${queryParam}\"`;
    if (activeCategoryParam) return "Profissionais por categoria";
    return "Todos os profissionais";
  }, [queryParam, activeCategoryParam]);

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="bg-white border border-gray-100 rounded-2xl p-5 mb-5">
        <div className="flex items-center gap-2 text-primary mb-2">
          <Filter className="w-4 h-4" />
          <p className="text-sm" style={{ fontWeight: 600 }}>
            Filtros de busca
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex gap-3 flex-col sm:flex-row">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Busque por nome, categoria ou cidade"
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 bg-white text-gray-800 outline-none focus:border-primary/50"
            />
          </div>

          <button
            type="submit"
            className="bg-primary hover:bg-primary/90 text-white px-5 py-2.5 rounded-xl transition-colors"
          >
            Buscar
          </button>
        </form>

        <div className="flex gap-2 overflow-x-auto mt-4 pb-1">
          <button
            onClick={() => applyFilters(queryParam, null)}
            className={`
              px-3 py-1.5 rounded-full text-sm border whitespace-nowrap
              ${
                !activeCategoryParam
                  ? "bg-primary text-white border-primary"
                  : "bg-gray-50 text-gray-700 border-gray-200"
              }
            `}
          >
            Todas
          </button>

          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => handleCategoryToggle(category.id)}
              className={`
                px-3 py-1.5 rounded-full text-sm border whitespace-nowrap
                ${
                  activeCategoryParam === category.id
                    ? "bg-primary text-white border-primary"
                    : "bg-gray-50 text-gray-700 border-gray-200"
                }
              `}
            >
              {category.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-gray-900">{title}</h1>
          <p className="text-sm text-gray-500 mt-1">
            {loadingData
              ? "Carregando resultados..."
              : `${professionals.length} profissional${
                  professionals.length === 1 ? "" : "is"
                } encontrados`}
          </p>
        </div>

        <button
          onClick={() => {
            void loadSearchData();
          }}
          className="inline-flex items-center gap-2 text-sm text-primary hover:text-primary/80"
        >
          <RefreshCw className="w-4 h-4" />
          Atualizar
        </button>
      </div>

      {loadingData ? (
        <div className="bg-white border border-gray-100 rounded-2xl p-6 text-gray-600">
          Carregando profissionais...
        </div>
      ) : dataError ? (
        <div className="bg-white border border-red-200 rounded-2xl p-6">
          <p className="text-red-600 mb-3">{dataError}</p>
          <button
            onClick={() => {
              void loadSearchData();
            }}
            className="bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-lg transition-colors"
          >
            Tentar novamente
          </button>
        </div>
      ) : professionals.length === 0 ? (
        <div className="bg-white border border-gray-100 rounded-2xl p-6 text-gray-600">
          Nenhum profissional encontrado com os filtros atuais.
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {professionals.map((professional) => (
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
  );
}

export default SearchPage;
