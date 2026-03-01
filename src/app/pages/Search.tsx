import { useState, useEffect } from "react";
import { useSearchParams } from "react-router";
import { Search, SlidersHorizontal, MapIcon, List, X } from "lucide-react";
import { MapView } from "../components/MapView";
import { ProfessionalCard } from "../components/ProfessionalCard";
import { professionals, categories, Professional } from "../data/mockData";

type SortType = "distancia" | "avaliacao" | "preco";

export function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [query, setQuery] = useState(searchParams.get("q") || "");
  const [activeCategory, setActiveCategory] = useState(
    searchParams.get("categoria") || ""
  );
  const [sortBy, setSortBy] = useState<SortType>("distancia");
  const [showOnlineOnly, setShowOnlineOnly] = useState(false);
  const [showVerifiedOnly, setShowVerifiedOnly] = useState(false);
  const [maxPrice, setMaxPrice] = useState(500);
  const [viewMode, setViewMode] = useState<"list" | "map">("list");
  const [showFilters, setShowFilters] = useState(false);
  const [selectedPro, setSelectedPro] = useState<Professional | null>(null);

  const filtered = professionals.filter((p) => {
    if (activeCategory && p.category !== activeCategory) return false;
    if (showOnlineOnly && !p.online) return false;
    if (showVerifiedOnly && !p.verified) return false;
    if (p.price > maxPrice) return false;
    if (
      query &&
      !p.name.toLowerCase().includes(query.toLowerCase()) &&
      !p.categoryLabel.toLowerCase().includes(query.toLowerCase()) &&
      !p.tags.some((t) => t.toLowerCase().includes(query.toLowerCase()))
    )
      return false;
    return true;
  });

  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === "distancia") return a.distance - b.distance;
    if (sortBy === "avaliacao") return b.rating - a.rating;
    if (sortBy === "preco") return a.price - b.price;
    return 0;
  });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Search header */}
      <div className="bg-white border-b border-gray-100 sticky top-16 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar serviço ou profissional..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-gray-100 text-gray-800 placeholder-gray-400 outline-none text-sm"
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm transition-colors border ${
                showFilters
                  ? "bg-blue-50 text-blue-600 border-blue-200"
                  : "bg-gray-100 text-gray-600 border-transparent"
              }`}
            >
              <SlidersHorizontal className="w-4 h-4" />
              <span className="hidden sm:block">Filtros</span>
            </button>
            {/* View toggle */}
            <div className="flex rounded-xl overflow-hidden border border-gray-200">
              <button
                onClick={() => setViewMode("list")}
                className={`p-2.5 ${viewMode === "list" ? "bg-blue-600 text-white" : "bg-white text-gray-500"}`}
              >
                <List className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode("map")}
                className={`p-2.5 ${viewMode === "map" ? "bg-blue-600 text-white" : "bg-white text-gray-500"}`}
              >
                <MapIcon className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Category pills */}
          <div className="flex items-center gap-2 overflow-x-auto mt-3 pb-1">
            <button
              onClick={() => setActiveCategory("")}
              className={`px-3 py-1 rounded-full text-xs whitespace-nowrap flex-shrink-0 border transition-all ${
                !activeCategory
                  ? "bg-blue-600 text-white border-blue-600"
                  : "bg-white text-gray-600 border-gray-200"
              }`}
            >
              Todos
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() =>
                  setActiveCategory(activeCategory === cat.id ? "" : cat.id)
                }
                className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs whitespace-nowrap flex-shrink-0 border transition-all ${
                  activeCategory === cat.id
                    ? "bg-blue-600 text-white border-blue-600"
                    : "bg-white text-gray-600 border-gray-200"
                }`}
              >
                <span>{cat.icon}</span>
                <span>{cat.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Filter panel */}
        {showFilters && (
          <div className="border-t border-gray-100 bg-gray-50 px-4 sm:px-6 lg:px-8 py-4">
            <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              {/* Sort */}
              <div>
                <label className="text-xs text-gray-500 mb-1 block">
                  Ordenar por
                </label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortType)}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm text-gray-700 outline-none"
                >
                  <option value="distancia">Distância</option>
                  <option value="avaliacao">Avaliação</option>
                  <option value="preco">Menor preço</option>
                </select>
              </div>

              {/* Max price */}
              <div>
                <label className="text-xs text-gray-500 mb-1 block">
                  Preço máximo: R${maxPrice}
                </label>
                <input
                  type="range"
                  min={50}
                  max={500}
                  step={10}
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(Number(e.target.value))}
                  className="w-full accent-blue-600"
                />
              </div>

              {/* Online only */}
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <div
                    onClick={() => setShowOnlineOnly(!showOnlineOnly)}
                    className={`w-10 h-5 rounded-full transition-colors ${
                      showOnlineOnly ? "bg-blue-600" : "bg-gray-300"
                    } relative`}
                  >
                    <div
                      className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                        showOnlineOnly ? "translate-x-5" : "translate-x-0.5"
                      }`}
                    />
                  </div>
                  <span className="text-sm text-gray-700">Disponíveis agora</span>
                </label>
              </div>

              {/* Verified only */}
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <div
                    onClick={() => setShowVerifiedOnly(!showVerifiedOnly)}
                    className={`w-10 h-5 rounded-full transition-colors ${
                      showVerifiedOnly ? "bg-blue-600" : "bg-gray-300"
                    } relative`}
                  >
                    <div
                      className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                        showVerifiedOnly ? "translate-x-5" : "translate-x-0.5"
                      }`}
                    />
                  </div>
                  <span className="text-sm text-gray-700">Apenas verificados</span>
                </label>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <p className="text-sm text-gray-500 mb-4">
          <span style={{ fontWeight: 600 }} className="text-gray-900">
            {sorted.length}
          </span>{" "}
          profissional{sorted.length !== 1 ? "is" : ""} encontrado
          {sorted.length !== 1 ? "s" : ""}
        </p>

        {viewMode === "map" ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="h-[500px] rounded-2xl overflow-hidden">
              <MapView
                selectedPro={selectedPro}
                onSelectPro={setSelectedPro}
                filteredPros={sorted}
              />
            </div>
            <div className="flex flex-col gap-3 overflow-y-auto max-h-[500px] pr-1">
              {sorted.map((pro) => (
                <ProfessionalCard
                  key={pro.id}
                  pro={pro}
                  highlighted={selectedPro?.id === pro.id}
                  onSelect={() =>
                    setSelectedPro(selectedPro?.id === pro.id ? null : pro)
                  }
                />
              ))}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {sorted.map((pro) => (
              <ProfessionalCard key={pro.id} pro={pro} />
            ))}
            {sorted.length === 0 && (
              <div className="col-span-3 text-center py-16 text-gray-400">
                <Search className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>Nenhum profissional encontrado com esses critérios.</p>
                <button
                  onClick={() => {
                    setQuery("");
                    setActiveCategory("");
                    setShowOnlineOnly(false);
                    setShowVerifiedOnly(false);
                    setMaxPrice(500);
                  }}
                  className="mt-3 text-blue-600 text-sm hover:underline"
                >
                  Limpar filtros
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
