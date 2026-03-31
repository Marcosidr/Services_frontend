import { CheckCircle, Star, User } from "lucide-react";
import type { DashboardOrder } from "./types";

type ReviewsTabProps = {
  isProfessionalDashboard: boolean;
  completedOrders: DashboardOrder[];
  ratings: Record<string, number>;
  onSelectRating: (orderId: string, rating: number) => void;
  onOpenRatingModal: (orderId: string) => void;
};

export function ReviewsTab({
  isProfessionalDashboard,
  completedOrders,
  ratings,
  onSelectRating,
  onOpenRatingModal
}: ReviewsTabProps) {
  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-slate-200 bg-white/95 p-5 shadow-sm">
        <h3 className="mb-1 text-slate-900">Suas avaliacoes</h3>
        <p className="mb-4 text-sm text-slate-500">Avalie os atendimentos concluidos.</p>

        {isProfessionalDashboard ? (
          <p className="text-sm text-slate-500">
            As avaliacoes sao enviadas pelo cliente apos o atendimento concluido.
          </p>
        ) : completedOrders.length === 0 ? (
          <p className="text-sm text-slate-500">
            Voce ainda nao possui servicos concluidos para avaliar.
          </p>
        ) : (
          completedOrders.map((order) => {
            const localRating = ratings[order.id] ?? 0;
            const hasSavedRating = Boolean(order.rating);

            return (
              <div
                key={order.id}
                className="flex items-center gap-3 border-b border-slate-100 py-3 last:border-0"
              >
                {order.professional?.photo ? (
                  <img
                    src={order.professional.photo}
                    alt={order.professionalName}
                    className="h-10 w-10 rounded-xl object-cover"
                  />
                ) : (
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100">
                    <User className="w-4 h-4 text-slate-500" />
                  </div>
                )}

                <div className="flex-1">
                  <p className="text-sm text-slate-800" style={{ fontWeight: 600 }}>
                    {order.professionalName}
                  </p>
                  <p className="text-xs text-slate-400">{order.category}</p>

                  <div className="mt-1 flex items-center gap-0.5">
                    {Array.from({ length: 5 }, (_, i) => (
                      <Star
                        key={i}
                        className={`w-3.5 h-3.5 cursor-pointer transition-colors ${
                          localRating
                            ? i < localRating
                              ? "text-yellow-400 fill-yellow-400"
                              : "text-gray-200"
                            : order.rating && i < order.rating
                            ? "text-yellow-400 fill-yellow-400"
                            : "text-gray-200"
                        }`}
                        onClick={() => onSelectRating(order.id, i + 1)}
                      />
                    ))}
                  </div>

                  <div className="mt-2">
                    {hasSavedRating ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-1 text-xs text-emerald-700">
                        <CheckCircle className="h-3.5 w-3.5" />
                        Avaliacao enviada
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => onOpenRatingModal(order.id)}
                        className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs text-slate-700 transition-colors hover:bg-slate-100"
                      >
                        {localRating > 0 ? "Enviar avaliacao" : "Avaliar agora"}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
