import { CheckCircle, MessageCircle, Star, User, X } from "lucide-react";
import type {
  DashboardOrder,
  DashboardUser
} from "./types";
import { getOrderCounterpart, statusConfig } from "./utils";

type OrdersTabProps = {
  orders: DashboardOrder[];
  userRole: DashboardUser["role"] | undefined;
  onOpenRatingModal: (orderId: string) => void;
  onShowChatFromOrder: (order: DashboardOrder) => void;
  onCancelOrder: (orderId: string) => void;
  onAcceptOrder: (orderId: string) => Promise<void>;
  onRejectOrder: (orderId: string) => Promise<void>;
  onCompleteOrder: (orderId: string) => Promise<void>;
  ratingSuccess: boolean;
};

export function OrdersTab({
  orders,
  userRole,
  onOpenRatingModal,
  onShowChatFromOrder,
  onCancelOrder,
  onAcceptOrder,
  onRejectOrder,
  onCompleteOrder,
  ratingSuccess
}: OrdersTabProps) {
  const isProfessionalDashboard = userRole === "professional";

  return (
    <div className="space-y-4">
      {orders.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white/95 p-8 text-center text-slate-500 shadow-sm">
          Nenhum pedido encontrado.
        </div>
      ) : (
        orders.map((order) => {
          const config = statusConfig[order.status];
          const StatusIcon = config.icon;
          const counterpart = getOrderCounterpart(order, isProfessionalDashboard);
          const hasRating = Boolean(order.rating);

          return (
            <div
              key={order.id}
              className="rounded-2xl border border-slate-200 bg-white/95 p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
            >
              <div className="flex items-start gap-4">
                {counterpart.photo ? (
                  <img
                    src={counterpart.photo}
                    alt={counterpart.name}
                    className="h-12 w-12 rounded-xl object-cover flex-shrink-0"
                  />
                ) : (
                  <div className="h-12 w-12 rounded-xl bg-slate-100 flex items-center justify-center flex-shrink-0">
                    <User className="w-5 h-5 text-slate-500" />
                  </div>
                )}

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-gray-900 truncate" style={{ fontWeight: 600 }}>
                      {counterpart.name}
                    </p>

                    <span
                      className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs ${config.bg} ${config.color} border-current/10 flex-shrink-0`}
                    >
                      <StatusIcon className="w-3 h-3" />
                      {config.label}
                    </span>
                  </div>

                  <p className="mt-0.5 text-sm text-slate-500">
                    {order.category} | {new Date(order.date).toLocaleDateString("pt-BR")}
                  </p>

                  {order.description ? (
                    <p className="mt-1 text-xs text-slate-500 line-clamp-2">
                      {order.description}
                    </p>
                  ) : null}

                  <p className="mt-1 text-sm text-slate-900" style={{ fontWeight: 600 }}>
                    R$ {order.price.toFixed(2)}
                  </p>
                </div>
              </div>

              {!isProfessionalDashboard && order.status === "concluido" && !hasRating && (
                <button
                  onClick={() => onOpenRatingModal(order.id)}
                  className="mt-3 w-full flex items-center justify-center gap-2 rounded-xl border border-amber-200 bg-amber-50 py-2.5 text-sm text-amber-700 transition-colors hover:bg-amber-100"
                >
                  <Star className="w-4 h-4" />
                  Avaliar servico
                </button>
              )}

              {!isProfessionalDashboard && hasRating && (
                <div className="mt-3 flex items-center gap-1">
                  {Array.from({ length: 5 }, (_, i) => (
                    <Star
                      key={i}
                      className={`w-3.5 h-3.5 ${
                        i < (order.rating ?? 0) ? "text-yellow-400 fill-yellow-400" : "text-gray-200"
                      }`}
                    />
                  ))}
                  <span className="ml-1 text-xs text-slate-400">Sua avaliacao</span>
                </div>
              )}

              {!isProfessionalDashboard && order.status === "aguardando" && (
                <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs text-slate-600">
                  Aguardando o profissional analisar e aceitar seu pedido.
                </div>
              )}

              {!isProfessionalDashboard && order.status === "em andamento" && (
                <div className="mt-3 flex gap-2">
                  <button
                    onClick={() => onShowChatFromOrder(order)}
                    className="flex-1 flex items-center justify-center gap-1 rounded-xl border border-slate-200 bg-slate-50 py-2.5 text-sm text-slate-700 transition-colors hover:bg-slate-100"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    Chat
                  </button>

                  <button
                    onClick={() => onCancelOrder(order.id)}
                    className="flex-1 flex items-center justify-center gap-1 rounded-xl border border-red-200 bg-red-50 py-2.5 text-sm text-red-600 transition-colors hover:bg-red-100"
                  >
                    <X className="w-3.5 h-3.5" />
                    Cancelar
                  </button>
                </div>
              )}

              {isProfessionalDashboard && order.status === "aguardando" && (
                <div className="mt-3 flex gap-2">
                  <button
                    onClick={() => void onAcceptOrder(order.id)}
                    className="flex-1 flex items-center justify-center gap-1 rounded-xl border border-emerald-200 bg-emerald-50 py-2.5 text-sm text-emerald-700 transition-colors hover:bg-emerald-100"
                  >
                    <CheckCircle className="w-3.5 h-3.5" />
                    Aceitar
                  </button>
                  <button
                    onClick={() => void onRejectOrder(order.id)}
                    className="flex-1 flex items-center justify-center gap-1 rounded-xl border border-red-200 bg-red-50 py-2.5 text-sm text-red-600 transition-colors hover:bg-red-100"
                  >
                    <X className="w-3.5 h-3.5" />
                    Recusar
                  </button>
                </div>
              )}

              {isProfessionalDashboard && order.status === "em andamento" && (
                <div className="mt-3 flex gap-2">
                  <button
                    onClick={() => onShowChatFromOrder(order)}
                    className="flex-1 flex items-center justify-center gap-1 rounded-xl border border-slate-200 bg-slate-50 py-2.5 text-sm text-slate-700 transition-colors hover:bg-slate-100"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    Chat
                  </button>
                  <button
                    onClick={() => void onCompleteOrder(order.id)}
                    className="flex-1 flex items-center justify-center gap-1 rounded-xl border border-blue-200 bg-blue-50 py-2.5 text-sm text-blue-700 transition-colors hover:bg-blue-100"
                  >
                    <CheckCircle className="w-3.5 h-3.5" />
                    Finalizar
                  </button>
                </div>
              )}
            </div>
          );
        })
      )}

      {ratingSuccess && (
        <div className="fixed bottom-6 left-1/2 z-50 flex -translate-x-1/2 items-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-white shadow-lg">
          <CheckCircle className="w-4 h-4" />
          Avaliacao enviada com sucesso!
        </div>
      )}
    </div>
  );
}
