import { useState } from "react";
import { Star, MapPin, CheckCircle, Zap, User } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface Professional {
  id: string;
  name: string;
  photo?: string;
  categoryLabel?: string;
  rating?: number;
  reviews?: number;
  distance?: number;
  price?: number;
  priceUnit?: string;
  tags?: string[];
  completedJobs?: number;
  online?: boolean;
  verified?: boolean;
}

interface ProfessionalCardProps {
  pro: Professional;
  highlighted?: boolean;
  onSelect?: () => void;
}

export function ProfessionalCard({ pro, highlighted, onSelect }: ProfessionalCardProps) {
  const navigate = useNavigate();
  const [imageFailed, setImageFailed] = useState(false);

  const safePhoto = typeof pro.photo === "string" ? pro.photo.trim() : "";
  const hasPhoto = Boolean(safePhoto) && !imageFailed;
  const fallbackInitial = pro.name.trim().charAt(0).toUpperCase() || "P";
  const hasRating = typeof pro.rating === "number" && pro.rating > 0;
  const hasDistance = typeof pro.distance === "number";

  return (
    <div
      onClick={onSelect}
      className={`
        surface-card cursor-pointer overflow-hidden transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_22px_45px_-32px_rgba(15,23,42,0.75)]
        ${highlighted ? "border-primary/50 ring-2 ring-primary/20" : "border-white/80"}
      `}
    >
      <div className="p-4">
        <div className="flex items-start gap-3">
          <div className="relative flex-shrink-0">
            {hasPhoto ? (
              <img
                src={safePhoto}
                alt={pro.name}
                onError={() => setImageFailed(true)}
                className="h-14 w-14 rounded-xl bg-blue-50 object-cover"
                loading="lazy"
              />
            ) : (
              <div className="relative flex h-14 w-14 items-center justify-center overflow-hidden rounded-xl bg-primary/10 text-primary">
                <User className="w-4 h-4 absolute opacity-30" />
                <span className="text-sm relative z-10" style={{ fontWeight: 700 }}>
                  {fallbackInitial}
                </span>
              </div>
            )}
            {pro.online && (
              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white" />
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <h3 className="truncate text-slate-900" style={{ fontWeight: 700 }}>
                {pro.name}
              </h3>
              {pro.verified && (
                <CheckCircle className="h-4 w-4 flex-shrink-0 text-primary" />
              )}
            </div>

            {pro.categoryLabel && (
              <p className="mt-0.5 text-sm text-slate-500">{pro.categoryLabel}</p>
            )}

            {(hasRating || hasDistance) && (
              <div className="flex items-center gap-3 mt-1.5">
                {hasRating && (
                  <div className="flex items-center gap-1">
                    <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
                    <span className="text-sm text-slate-700" style={{ fontWeight: 700 }}>
                      {pro.rating!.toFixed(1)}
                    </span>
                    {pro.reviews !== undefined && (
                      <span className="text-xs text-slate-400">({pro.reviews})</span>
                    )}
                  </div>
                )}

                {hasDistance && (
                  <div className="flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary">
                    <MapPin className="w-3 h-3" />
                    <span>{pro.distance!.toFixed(1)} km</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {pro.price !== undefined && (
            <div className="text-right flex-shrink-0">
              <p className="text-primary" style={{ fontWeight: 700 }}>
                R${pro.price}
              </p>
              {pro.priceUnit && <p className="text-xs text-slate-400">/{pro.priceUnit}</p>}
            </div>
          )}
        </div>

        {pro.tags && pro.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-3">
            {pro.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        <div className="mt-3 flex items-center gap-2 border-t border-slate-100 pt-3">
          <div className="flex-1">
            {pro.completedJobs !== undefined && (
              <p className="text-xs text-slate-500">
                <span style={{ fontWeight: 700 }} className="text-slate-700">
                  {pro.completedJobs}
                </span>{" "}
                servicos realizados
              </p>
            )}
          </div>

          {pro.online && (
            <span className="flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs text-emerald-600">
              <Zap className="w-3 h-3" />
              Disponivel agora
            </span>
          )}

          <button
            onClick={(event) => {
              event.stopPropagation();
              navigate(`/profissional/${pro.id}`);
            }}
            className="rounded-lg bg-primary px-4 py-1.5 text-sm text-white shadow-[0_10px_24px_-16px_rgba(29,78,216,0.95)] hover:bg-primary/90"
          >
            Ver perfil
          </button>
        </div>
      </div>
    </div>
  );
}
