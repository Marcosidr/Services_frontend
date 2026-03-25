export type Category = {
  id: string;
  slug?: string;
  label: string;
  icon?: string;
  is_active?: boolean;
};

export type Professional = {
  id: string;
  name: string;
  photo?: string;
  categoryLabel?: string;
  categoryIds?: string[];
  rating?: number;
  reviews?: number;
  city?: string;
  distance?: number;
  completedJobs?: number;
  area?: number;
  description?: string;
  tags?: string[];
  price?: number;
  priceUnit?: string;
  phone?: string;
  online?: boolean;
  verified?: boolean;
};

export function normalizeCategory(raw: unknown): Category | null {
  if (!raw || typeof raw !== "object") return null;
  const item = raw as Record<string, unknown>;

  const rawId = item.id;
  const rawLabel = item.label;

  if (
    (typeof rawId !== "number" && typeof rawId !== "string") ||
    typeof rawLabel !== "string"
  ) {
    return null;
  }

  return {
    id: String(rawId),
    slug: typeof item.slug === "string" ? item.slug : undefined,
    label: rawLabel.trim(),
    icon: typeof item.icon === "string" ? item.icon : undefined,
    is_active: typeof item.is_active === "boolean" ? item.is_active : undefined
  };
}

export function normalizeProfessional(raw: unknown): Professional | null {
  if (!raw || typeof raw !== "object") return null;
  const item = raw as Record<string, unknown>;

  const rawId = item.id;
  const rawName = item.name;

  if (
    (typeof rawId !== "number" && typeof rawId !== "string") ||
    typeof rawName !== "string"
  ) {
    return null;
  }

  const categoryIds = Array.isArray(item.categoryIds)
    ? item.categoryIds
        .map((categoryId) =>
          typeof categoryId === "number" || typeof categoryId === "string"
            ? String(categoryId)
            : null
        )
        .filter((categoryId): categoryId is string => Boolean(categoryId))
    : [];

  return {
    id: String(rawId),
    name: rawName,
    photo: typeof item.photo === "string" ? item.photo : "",
    categoryLabel:
      typeof item.categoryLabel === "string" ? item.categoryLabel : "",
    categoryIds,
    rating: typeof item.rating === "number" ? item.rating : 0,
    reviews: typeof item.reviews === "number" ? item.reviews : 0,
    city: typeof item.city === "string" ? item.city : "",
    distance: typeof item.distance === "number" ? item.distance : 0,
    completedJobs:
      typeof item.completedJobs === "number" ? item.completedJobs : 0,
    area: typeof item.area === "number" ? item.area : 0,
    description: typeof item.description === "string" ? item.description : "",
    tags: Array.isArray(item.tags)
      ? item.tags.filter((tag): tag is string => typeof tag === "string")
      : [],
    price: typeof item.price === "number" ? item.price : 0,
    priceUnit: typeof item.priceUnit === "string" ? item.priceUnit : "servico",
    phone: typeof item.phone === "string" ? item.phone : "",
    online: Boolean(item.online),
    verified: Boolean(item.verified)
  };
}
