import type { PaymentHistoryItem, PaymentMethod } from "./types";

type PaymentsTabProps = {
  paymentMethods: PaymentMethod[];
  paymentHistory: PaymentHistoryItem[];
};

export function PaymentsTab({ paymentMethods, paymentHistory }: PaymentsTabProps) {
  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-slate-200 bg-white/95 p-5 shadow-sm">
        <h3 className="mb-4 text-slate-900">Formas de pagamento</h3>

        <div className="flex flex-col gap-3">
          {paymentMethods.length === 0 ? (
            <p className="text-sm text-slate-500">Nenhuma forma de pagamento cadastrada.</p>
          ) : (
            paymentMethods.map((method) => (
              <div
                key={method.id}
                className={`flex items-center gap-3 rounded-xl border p-3 ${
                  method.active ? "border-cyan-200 bg-cyan-50" : "border-slate-200"
                }`}
              >
                <span className="text-2xl">{method.icon || "CARD"}</span>

                <div className="flex-1">
                  <p className="text-sm text-slate-800" style={{ fontWeight: 600 }}>
                    {method.type}
                  </p>
                  <p className="text-xs text-slate-500">{method.description}</p>
                </div>

                {method.active && (
                  <span className="rounded-full bg-cyan-100 px-2 py-0.5 text-xs text-cyan-700">
                    Padrao
                  </span>
                )}
              </div>
            ))
          )}

          <button className="w-full rounded-xl border-2 border-dashed border-slate-200 py-2.5 text-sm text-slate-500 transition-colors hover:border-slate-400 hover:text-slate-700">
            + Adicionar forma de pagamento
          </button>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white/95 p-5 shadow-sm">
        <h3 className="mb-4 text-slate-900">Historico de pagamentos</h3>

        <div className="flex flex-col gap-3">
          {paymentHistory.length === 0 ? (
            <p className="text-sm text-slate-500">Nenhum pagamento encontrado.</p>
          ) : (
            paymentHistory.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between border-b border-slate-100 py-2 last:border-0"
              >
                <div>
                  <p className="text-sm text-slate-800">{item.professionalName}</p>
                  <p className="text-xs text-slate-400">
                    {new Date(item.date).toLocaleDateString("pt-BR")} | {item.method}
                  </p>
                </div>

                <div className="text-right">
                  <p
                    className={`text-sm ${
                      item.status.toLowerCase() === "cancelado" ? "text-red-500" : "text-slate-800"
                    }`}
                    style={{ fontWeight: 600 }}
                  >
                    {item.status.toLowerCase() === "cancelado"
                      ? "-"
                      : `R$ ${item.amount.toFixed(2)}`}
                  </p>
                  <p className="text-xs text-slate-400">{item.status}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
