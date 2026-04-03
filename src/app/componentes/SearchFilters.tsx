import { ChevronDown, X } from "lucide-react";
import { motion } from "framer-motion";
import clsx from "clsx";
import React from "react";

interface FilterOption {
  label: string;
  value: string;
  count?: number;
}

interface SearchFiltersProps {
  categories: Array<{ id: string; label: string }>;
  activeCategory: string | null;
  onCategoryChange: (categoryId: string | null) => void;
  priceRange: [number, number];
  onPriceChange: (range: [number, number]) => void;
  distanceRange: number | null;
  onDistanceChange: (distance: number | null) => void;
  minRating: number | null;
  onRatingChange: (rating: number | null) => void;
  verifiedOnly: boolean;
  onVerifiedChange: (value: boolean) => void;
  onlineOnly: boolean;
  onOnlineChange: (value: boolean) => void;
  onClearFilters: () => void;
  isOpen: boolean;
  onClose: () => void;
}

export function SearchFilters({
  categories,
  activeCategory,
  onCategoryChange,
  priceRange,
  onPriceChange,
  distanceRange,
  onDistanceChange,
  minRating,
  onRatingChange,
  verifiedOnly,
  onVerifiedChange,
  onlineOnly,
  onOnlineChange,
  onClearFilters,
  isOpen,
  onClose,
}: SearchFiltersProps) {
  const [expandedSections, setExpandedSections] = React.useState<
    Record<string, boolean>
  >({
    categories: true,
    price: true,
    distance: false,
    rating: false,
    verification: false,
    availability: false,
  });

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const FilterSection = ({
    title,
    section,
    children,
  }: {
    title: string;
    section: string;
    children: React.ReactNode;
  }) => (
    <div className="border-b border-gray-200 py-4">
      <button
        onClick={() => toggleSection(section)}
        className="flex items-center justify-between w-full text-left"
      >
        <h3 className="font-semibold text-gray-900 text-sm">{title}</h3>
        <motion.div
          animate={{ rotate: expandedSections[section] ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDown className="w-4 h-4 text-gray-600" />
        </motion.div>
      </button>

      <motion.div
        initial={false}
        animate={{ height: expandedSections[section] ? "auto" : 0 }}
        transition={{ duration: 0.2 }}
        className="overflow-hidden"
      >
        <div className="pt-3 space-y-2">{children}</div>
      </motion.div>
    </div>
  );

  const FilterCheckbox = ({
    id,
    label,
    checked,
    onChange,
    count,
  }: {
    id: string;
    label: string;
    checked: boolean;
    onChange: (checked: boolean) => void;
    count?: number;
  }) => (
    <label className="flex items-center gap-3 cursor-pointer hover:bg-gray-50 -mx-2 px-2 py-1.5 rounded">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="w-4 h-4 rounded border-2 border-gray-300 cursor-pointer accent-blue-600"
      />
      <span className="text-sm text-gray-700 flex-1">{label}</span>
      {count !== undefined && (
        <span className="text-xs text-gray-500">{count}</span>
      )}
    </label>
  );

  const FilterRadio = ({
    id,
    label,
    checked,
    onChange,
  }: {
    id: string;
    label: string;
    checked: boolean;
    onChange: (checked: boolean) => void;
  }) => (
    <label className="flex items-center gap-3 cursor-pointer hover:bg-gray-50 -mx-2 px-2 py-1.5 rounded">
      <input
        type="radio"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="w-4 h-4 rounded-full border-2 border-gray-300 cursor-pointer accent-blue-600"
      />
      <span className="text-sm text-gray-700">{label}</span>
    </label>
  );

  const sidebarContent = (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="bg-white rounded-lg border border-gray-200 p-4 h-full overflow-y-auto"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-bold text-lg text-gray-900">Filtros</h2>
        <button
          onClick={onClose}
          className="lg:hidden p-1 hover:bg-gray-100 rounded"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Categories */}
      <FilterSection title="Categorias" section="categories">
        <FilterRadio
          id="all-categories"
          label="Todas as categorias"
          checked={activeCategory === null}
          onChange={() => onCategoryChange(null)}
        />
        {categories.map((category) => (
          <FilterRadio
            key={category.id}
            id={category.id}
            label={category.label}
            checked={activeCategory === category.id}
            onChange={() => onCategoryChange(category.id)}
          />
        ))}
      </FilterSection>

      {/* Price */}
      <FilterSection title="💰 Preço" section="price">
        <FilterRadio
          id="price-all"
          label="Sem filtro"
          checked={priceRange[0] === 0 && priceRange[1] === 1000000}
          onChange={() => onPriceChange([0, 1000000])}
        />
        <FilterRadio
          id="price-0-50"
          label="R$0 - R$50"
          checked={priceRange[0] === 0 && priceRange[1] === 50}
          onChange={() => onPriceChange([0, 50])}
        />
        <FilterRadio
          id="price-50-100"
          label="R$50 - R$100"
          checked={priceRange[0] === 50 && priceRange[1] === 100}
          onChange={() => onPriceChange([50, 100])}
        />
        <FilterRadio
          id="price-100-200"
          label="R$100 - R$200"
          checked={priceRange[0] === 100 && priceRange[1] === 200}
          onChange={() => onPriceChange([100, 200])}
        />
        <FilterRadio
          id="price-200"
          label="+R$200"
          checked={priceRange[0] === 200 && priceRange[1] === 1000000}
          onChange={() => onPriceChange([200, 1000000])}
        />
      </FilterSection>

      {/* Distance */}
      <FilterSection title="📍 Distância" section="distance">
        <FilterRadio
          id="distance-all"
          label="Ver todos"
          checked={distanceRange === null}
          onChange={() => onDistanceChange(null)}
        />
        <FilterRadio
          id="distance-2"
          label="Até 2 km"
          checked={distanceRange === 2}
          onChange={() => onDistanceChange(2)}
        />
        <FilterRadio
          id="distance-5"
          label="Até 5 km"
          checked={distanceRange === 5}
          onChange={() => onDistanceChange(5)}
        />
        <FilterRadio
          id="distance-10"
          label="Até 10 km"
          checked={distanceRange === 10}
          onChange={() => onDistanceChange(10)}
        />
        <FilterRadio
          id="distance-20"
          label="Até 20 km"
          checked={distanceRange === 20}
          onChange={() => onDistanceChange(20)}
        />
      </FilterSection>

      {/* Rating */}
      <FilterSection title="⭐ Avaliação" section="rating">
        <FilterRadio
          id="rating-all"
          label="Todas"
          checked={minRating === null}
          onChange={() => onRatingChange(null)}
        />
        <FilterRadio
          id="rating-4-5"
          label="4.5 - 5.0"
          checked={minRating === 4.5}
          onChange={() => onRatingChange(4.5)}
        />
        <FilterRadio
          id="rating-4"
          label="4.0 - 4.5"
          checked={minRating === 4}
          onChange={() => onRatingChange(4)}
        />
        <FilterRadio
          id="rating-3-5"
          label="3.5 - 4.0"
          checked={minRating === 3.5}
          onChange={() => onRatingChange(3.5)}
        />
      </FilterSection>

      {/* Verification */}
      <FilterSection title="✅ Verificação" section="verification">
        <FilterCheckbox
          id="verified-all"
          label="Qualquer um"
          checked={!verifiedOnly}
          onChange={() => onVerifiedChange(false)}
        />
        <FilterCheckbox
          id="verified-only"
          label="Apenas verificados"
          checked={verifiedOnly}
          onChange={() => onVerifiedChange(true)}
        />
      </FilterSection>

      {/* Availability */}
      <FilterSection title="🟢 Disponibilidade" section="availability">
        <FilterCheckbox
          id="online-all"
          label="Todos"
          checked={!onlineOnly}
          onChange={() => onOnlineChange(false)}
        />
        <FilterCheckbox
          id="online-only"
          label="Online agora"
          checked={onlineOnly}
          onChange={() => onOnlineChange(true)}
        />
      </FilterSection>

      {/* Clear Filters */}
      <button
        onClick={onClearFilters}
        className="w-full mt-6 py-2 px-4 rounded-lg border-2 border-gray-300 text-gray-700 font-semibold hover:bg-gray-50 transition-colors"
      >
        Limpar Filtros
      </button>
    </motion.div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <div className="hidden lg:block w-64 flex-shrink-0">
        {sidebarContent}
      </div>

      {/* Mobile Overlay */}
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          />
          <motion.div
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ duration: 0.2 }}
            className="fixed left-0 top-0 h-full w-64 bg-white z-50 lg:hidden shadow-lg overflow-y-auto"
          >
            {sidebarContent}
          </motion.div>
        </>
      )}
    </>
  );
}
