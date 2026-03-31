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
  const latitudeParam = params.get("lat")?.trim() ?? "";
  const longitudeParam = params.get("lng")?.trim() ?? "";
  const accuracyParam = params.get("accuracy")?.trim() ?? "";

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

    if (latitudeParam && longitudeParam) {
      nextParams.set("lat", latitudeParam);
      nextParams.set("lng", longitudeParam);
      if (accuracyParam) nextParams.set("accuracy", accuracyParam);
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
  }, [queryParam, activeCategoryParam, latitudeParam, longitudeParam]);

  const title = useMemo(() => {
    if (queryParam && activeCategoryParam) return "Resultados filtrados";
    if (queryParam) return `Resultados para \"${queryParam}\"`;
    if (activeCategoryParam) return "Profissionais por categoria";
    return "Todos os profissionais";
  }, [queryParam, activeCategoryParam]);

  return (
    <section className="section-container py-8">
      <div className="surface-card p-5 mb-5 animate-fade-up">
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
              className="input-surface w-full pl-10"
            />
          </div>

          <button
            type="submit"
            className="btn-primary"
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
                  ? "bg-primary text-white border-primary shadow-[0_10px_24px_-16px_rgba(29,78,216,0.95)]"
                  : "bg-white text-slate-700 border-slate-200"
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
                    ? "bg-primary text-white border-primary shadow-[0_10px_24px_-16px_rgba(29,78,216,0.95)]"
                    : "bg-white text-slate-700 border-slate-200"
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
          className="btn-ghost text-sm"
        >
          <RefreshCw className="w-4 h-4" />
          Atualizar
        </button>
      </div>

      {loadingData ? (
        <div className="surface-card p-6 text-gray-600">
          Carregando profissionais...
        </div>
      ) : dataError ? (
        <div className="surface-card border-red-200 p-6">
          <p className="text-red-600 mb-3">{dataError}</p>
          <button
            onClick={() => {
              void loadSearchData();
            }}
            className="btn-primary"
          >
            Tentar novamente
          </button>
        </div>
      ) : professionals.length === 0 ? (
        <div className="surface-card p-6 text-gray-600">
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
