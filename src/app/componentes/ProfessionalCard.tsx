import { Star, MapPin, CheckCircle, Zap } from "lucide-react";
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

          {/* FOTO (só renderiza se existir) */}
          {pro.photo && (
            <div className="relative flex-shrink-0">
              <img
                src={pro.photo}
                alt={pro.name}
                className="w-14 h-14 rounded-xl object-cover"
              />
              {pro.online && (
                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white" />
              )}
            </div>
          )}

          {/* INFO */}
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
              <p className="text-sm text-gray-500 mt-0.5">
                {pro.categoryLabel}
              </p>
            )}

            {/* Rating e distância só se existirem */}
            {(pro.rating || pro.distance) && (
              <div className="flex items-center gap-3 mt-1.5">
                {pro.rating !== undefined && (
                  <div className="flex items-center gap-1">
                    <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
                    <span className="text-sm text-gray-700" style={{ fontWeight: 600 }}>
                      {pro.rating.toFixed(1)}
                    </span>
                    {pro.reviews !== undefined && (
                      <span className="text-xs text-gray-400">
                        ({pro.reviews})
                      </span>
                    )}
                  </div>
                )}

                {pro.distance !== undefined && (
                  <div className="flex items-center gap-1 text-xs text-gray-500">
                    <MapPin className="w-3 h-3" />
                    <span>{pro.distance} km</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* PREÇO */}
          {pro.price !== undefined && (
            <div className="text-right flex-shrink-0">
              <p className="text-blue-600" style={{ fontWeight: 700 }}>
                R${pro.price}
              </p>
              {pro.priceUnit && (
                <p className="text-xs text-gray-400">
                  /{pro.priceUnit}
                </p>
              )}
            </div>
          )}
        </div>

        {/* TAGS */}
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

        {/* FOOTER */}
        <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100">
          <div className="flex-1">
            {pro.completedJobs !== undefined && (
              <p className="text-xs text-gray-500">
                <span style={{ fontWeight: 600 }} className="text-gray-700">
                  {pro.completedJobs}
                </span>{" "}
                serviços realizados
              </p>
            )}
          </div>

          {pro.online && (
            <span className="flex items-center gap-1 text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
              <Zap className="w-3 h-3" />
              Disponível agora
            </span>
          )}

          <button
            onClick={(e) => {
              e.stopPropagation();
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