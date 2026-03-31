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
        bg-white rounded-xl border transition-all duration-200 cursor-pointer hover:shadow-md overflow-hidden
        ${highlighted ? "border-blue-500 shadow-md ring-1 ring-blue-200" : "border-gray-100 shadow-sm"}
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
                className="w-14 h-14 rounded-xl object-cover bg-blue-50"
                loading="lazy"
              />
            ) : (
              <div className="w-14 h-14 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center relative overflow-hidden">
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
              <h3 className="text-gray-900 truncate" style={{ fontWeight: 600 }}>
                {pro.name}
              </h3>
              {pro.verified && (
                <CheckCircle className="w-4 h-4 text-blue-500 flex-shrink-0" />
              )}
            </div>

            {pro.categoryLabel && (
              <p className="text-sm text-gray-500 mt-0.5">{pro.categoryLabel}</p>
            )}

            {(hasRating || hasDistance) && (
              <div className="flex items-center gap-3 mt-1.5">
                {hasRating && (
                  <div className="flex items-center gap-1">
                    <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
                    <span className="text-sm text-gray-700" style={{ fontWeight: 600 }}>
                      {pro.rating!.toFixed(1)}
                    </span>
                    {pro.reviews !== undefined && (
                      <span className="text-xs text-gray-400">({pro.reviews})</span>
                    )}
                  </div>
                )}

                {hasDistance && (
                  <div className="flex items-center gap-1 text-xs text-gray-500">
                    <MapPin className="w-3 h-3" />
                    <span>{pro.distance!.toFixed(1)} km</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {pro.price !== undefined && (
            <div className="text-right flex-shrink-0">
              <p className="text-blue-600" style={{ fontWeight: 700 }}>
                R${pro.price}
              </p>
              {pro.priceUnit && <p className="text-xs text-gray-400">/{pro.priceUnit}</p>}
            </div>
          )}
        </div>

        {pro.tags && pro.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-3">
            {pro.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100">
          <div className="flex-1">
            {pro.completedJobs !== undefined && (
              <p className="text-xs text-gray-500">
                <span style={{ fontWeight: 600 }} className="text-gray-700">
                  {pro.completedJobs}
                </span>{" "}
                servicos realizados
              </p>
            )}
          </div>

          {pro.online && (
            <span className="flex items-center gap-1 text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
              <Zap className="w-3 h-3" />
              Disponivel agora
            </span>
          )}

          <button
            onClick={(event) => {
              event.stopPropagation();
              navigate(`/profissional/${pro.id}`);
            }}
            className="bg-blue-600 text-white text-sm px-4 py-1.5 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Ver perfil
          </button>
        </div>
      </div>
    </div>
  );
}
