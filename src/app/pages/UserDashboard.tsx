import { useState } from "react";
import { useNavigate } from "react-router";
import {
  ClipboardList,
  MessageCircle,
  Star,
  CreditCard,
  User,
  ChevronRight,
  Send,
  X,
  CheckCircle,
  Clock,
  XCircle,
  AlertCircle,
} from "lucide-react";
import { mockOrders, mockMessages, professionals } from "../data/mockData";

type Tab = "pedidos" | "chat" | "avaliacoes" | "pagamento";

const statusConfig = {
  concluído: {
    icon: CheckCircle,
    color: "text-green-600",
    bg: "bg-green-50",
    label: "Concluído",
  },
  "em andamento": {
    icon: Clock,
    color: "text-blue-600",
    bg: "bg-blue-50",
    label: "Em andamento",
  },
  cancelado: {
    icon: XCircle,
    color: "text-red-500",
    bg: "bg-red-50",
    label: "Cancelado",
  },
  aguardando: {
    icon: AlertCircle,
    color: "text-yellow-600",
    bg: "bg-yellow-50",
    label: "Aguardando",
  },
};

export function UserDashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<Tab>("pedidos");
  const [chatMessage, setChatMessage] = useState("");
  const [messages, setMessages] = useState(mockMessages);
  const [ratingModal, setRatingModal] = useState<string | null>(null);
  const [ratings, setRatings] = useState<Record<string, number>>({});
  const [ratingSuccess, setRatingSuccess] = useState(false);

  const sendMessage = () => {
    if (!chatMessage.trim()) return;
    setMessages((prev) => [
      ...prev,
      {
        id: `msg-${Date.now()}`,
        sender: "user",
        text: chatMessage,
        time: new Date().toLocaleTimeString("pt-BR", {
          hour: "2-digit",
          minute: "2-digit",
        }),
      },
    ]);
    setChatMessage("");
  };

  const submitRating = (orderId: string) => {
    setRatingModal(null);
    setRatingSuccess(true);
    setTimeout(() => setRatingSuccess(false), 2000);
  };

  const tabs: { id: Tab; label: string; icon: any }[] = [
    { id: "pedidos", label: "Pedidos", icon: ClipboardList },
    { id: "chat", label: "Chat", icon: MessageCircle },
    { id: "avaliacoes", label: "Avaliações", icon: Star },
    { id: "pagamento", label: "Pagamento", icon: CreditCard },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-5">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
              <User className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h1 className="text-gray-900">Olá, João Silva!</h1>
              <p className="text-sm text-gray-500">
                Gerencie seus pedidos e conversas
              </p>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mt-5">
            {[
              {
                label: "Serviços realizados",
                value: mockOrders.filter((o) => o.status === "concluído").length,
                color: "text-green-600",
              },
              {
                label: "Em andamento",
                value: mockOrders.filter((o) => o.status === "em andamento").length,
                color: "text-blue-600",
              },
              {
                label: "Total gasto",
                value: `R$${mockOrders
                  .filter((o) => o.status === "concluído")
                  .reduce((s, o) => s + o.price, 0)}`,
                color: "text-gray-900",
              },
            ].map((s, i) => (
              <div key={i} className="text-center bg-gray-50 rounded-xl p-3">
                <p className={s.color} style={{ fontWeight: 700, fontSize: "1.25rem" }}>
                  {s.value}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-gray-100 sticky top-16 z-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="flex overflow-x-auto">
            {tabs.map((t) => (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                className={`flex items-center gap-2 px-4 py-3.5 text-sm whitespace-nowrap border-b-2 transition-all ${
                  activeTab === t.id
                    ? "text-blue-600 border-blue-600"
                    : "text-gray-500 border-transparent hover:text-gray-700"
                }`}
              >
                <t.icon className="w-4 h-4" />
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
        {/* Pedidos tab */}
        {activeTab === "pedidos" && (
          <div className="flex flex-col gap-3">
            {mockOrders.map((order) => {
              const config = statusConfig[order.status];
              const StatusIcon = config.icon;
              const pro = professionals.find(
                (p) => p.id === order.professionalId
              );
              return (
                <div
                  key={order.id}
                  className="bg-white rounded-xl border border-gray-100 shadow-sm p-4"
                >
                  <div className="flex items-start gap-3">
                    {pro && (
                      <img
                        src={pro.photo}
                        alt={pro.name}
                        className="w-11 h-11 rounded-xl object-cover flex-shrink-0"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-gray-900 truncate" style={{ fontWeight: 600 }}>
                          {order.professionalName}
                        </p>
                        <span
                          className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ${config.bg} ${config.color} flex-shrink-0`}
                        >
                          <StatusIcon className="w-3 h-3" />
                          {config.label}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500 mt-0.5">
                        {order.category} ·{" "}
                        {new Date(order.date).toLocaleDateString("pt-BR")}
                      </p>
                      <p className="text-blue-600 mt-1 text-sm" style={{ fontWeight: 600 }}>
                        R${order.price},00
                      </p>
                    </div>
                  </div>

                  {order.status === "concluído" && !order.rating && (
                    <button
                      onClick={() => setRatingModal(order.id)}
                      className="mt-3 w-full flex items-center justify-center gap-2 text-sm text-yellow-600 bg-yellow-50 hover:bg-yellow-100 py-2 rounded-lg transition-colors"
                    >
                      <Star className="w-4 h-4" />
                      Avaliar serviço
                    </button>
                  )}

                  {order.rating && (
                    <div className="mt-3 flex items-center gap-1">
                      {Array.from({ length: 5 }, (_, i) => (
                        <Star
                          key={i}
                          className={`w-3.5 h-3.5 ${
                            i < order.rating!
                              ? "text-yellow-400 fill-yellow-400"
                              : "text-gray-200"
                          }`}
                        />
                      ))}
                      <span className="text-xs text-gray-400 ml-1">
                        Sua avaliação
                      </span>
                    </div>
                  )}

                  {order.status === "em andamento" && (
                    <div className="mt-3 flex gap-2">
                      <button
                        onClick={() => setActiveTab("chat")}
                        className="flex-1 flex items-center justify-center gap-1 text-sm text-blue-600 bg-blue-50 hover:bg-blue-100 py-2 rounded-lg transition-colors"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                        Chat
                      </button>
                      <button className="flex-1 flex items-center justify-center gap-1 text-sm text-red-500 bg-red-50 hover:bg-red-100 py-2 rounded-lg transition-colors">
                        <X className="w-3.5 h-3.5" />
                        Cancelar
                      </button>
                    </div>
                  )}
                </div>
              );
            })}

            {ratingSuccess && (
              <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-green-600 text-white px-5 py-3 rounded-xl shadow-lg flex items-center gap-2 z-50">
                <CheckCircle className="w-4 h-4" />
                Avaliação enviada com sucesso!
              </div>
            )}
          </div>
        )}

        {/* Chat tab */}
        {activeTab === "chat" && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            {/* Chat header */}
            <div className="flex items-center gap-3 p-4 border-b border-gray-100 bg-blue-600 text-white">
              <img
                src={professionals[0].photo}
                alt={professionals[0].name}
                className="w-9 h-9 rounded-full object-cover"
              />
              <div>
                <p style={{ fontWeight: 600 }}>{professionals[0].name}</p>
                <p className="text-xs text-blue-200">
                  {professionals[0].categoryLabel}
                </p>
              </div>
              <div className="ml-auto flex items-center gap-1.5 bg-green-500/20 px-2 py-0.5 rounded-full">
                <div className="w-2 h-2 bg-green-400 rounded-full" />
                <span className="text-xs text-green-200">Online</span>
              </div>
            </div>

            {/* Messages */}
            <div className="h-80 overflow-y-auto p-4 flex flex-col gap-3 bg-gray-50">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${
                    msg.sender === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm ${
                      msg.sender === "user"
                        ? "bg-blue-600 text-white rounded-br-sm"
                        : "bg-white text-gray-700 shadow-sm rounded-bl-sm"
                    }`}
                  >
                    <p>{msg.text}</p>
                    <p
                      className={`text-xs mt-1 ${
                        msg.sender === "user"
                          ? "text-blue-200"
                          : "text-gray-400"
                      }`}
                    >
                      {msg.time}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Input */}
            <div className="p-3 border-t border-gray-100 flex gap-2">
              <input
                type="text"
                value={chatMessage}
                onChange={(e) => setChatMessage(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                placeholder="Digite uma mensagem..."
                className="flex-1 px-4 py-2.5 bg-gray-100 rounded-xl text-sm outline-none"
              />
              <button
                onClick={sendMessage}
                className="bg-blue-600 text-white p-2.5 rounded-xl hover:bg-blue-700 transition-colors"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Avaliações tab */}
        {activeTab === "avaliacoes" && (
          <div className="flex flex-col gap-4">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <h3 className="text-gray-900 mb-1">Suas avaliações</h3>
              <p className="text-sm text-gray-500 mb-4">
                Avalie os profissionais que atenderam você
              </p>
              {mockOrders
                .filter((o) => o.status === "concluído")
                .map((order) => {
                  const pro = professionals.find(
                    (p) => p.id === order.professionalId
                  );
                  return (
                    <div
                      key={order.id}
                      className="flex items-center gap-3 py-3 border-b border-gray-100 last:border-0"
                    >
                      {pro && (
                        <img
                          src={pro.photo}
                          alt={pro.name}
                          className="w-10 h-10 rounded-xl object-cover"
                        />
                      )}
                      <div className="flex-1">
                        <p className="text-sm text-gray-800" style={{ fontWeight: 600 }}>
                          {order.professionalName}
                        </p>
                        <p className="text-xs text-gray-400">{order.category}</p>
                        <div className="flex items-center gap-0.5 mt-1">
                          {Array.from({ length: 5 }, (_, i) => (
                            <Star
                              key={i}
                              className={`w-3.5 h-3.5 cursor-pointer transition-colors ${
                                ratings[order.id]
                                  ? i < ratings[order.id]
                                    ? "text-yellow-400 fill-yellow-400"
                                    : "text-gray-200"
                                  : order.rating && i < order.rating
                                  ? "text-yellow-400 fill-yellow-400"
                                  : "text-gray-200"
                              }`}
                              onClick={() =>
                                setRatings((r) => ({
                                  ...r,
                                  [order.id]: i + 1,
                                }))
                              }
                            />
                          ))}
                        </div>
                      </div>
                      {(order.rating || ratings[order.id]) && (
                        <CheckCircle className="w-5 h-5 text-green-500" />
                      )}
                    </div>
                  );
                })}
            </div>
          </div>
        )}

        {/* Pagamento tab */}
        {activeTab === "pagamento" && (
          <div className="flex flex-col gap-4">
            {/* Payment methods */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <h3 className="text-gray-900 mb-4">Formas de pagamento</h3>
              <div className="flex flex-col gap-3">
                {[
                  {
                    type: "Pix",
                    desc: "Pagamento instantâneo",
                    icon: "🏦",
                    active: true,
                  },
                  {
                    type: "Cartão de Crédito",
                    desc: "•••• •••• •••• 4521",
                    icon: "💳",
                    active: false,
                  },
                  {
                    type: "Cartão de Débito",
                    desc: "•••• •••• •••• 7832",
                    icon: "💳",
                    active: false,
                  },
                ].map((p) => (
                  <div
                    key={p.type}
                    className={`flex items-center gap-3 p-3 rounded-xl border ${
                      p.active
                        ? "border-blue-200 bg-blue-50"
                        : "border-gray-200"
                    }`}
                  >
                    <span className="text-2xl">{p.icon}</span>
                    <div className="flex-1">
                      <p className="text-sm text-gray-800" style={{ fontWeight: 600 }}>
                        {p.type}
                      </p>
                      <p className="text-xs text-gray-500">{p.desc}</p>
                    </div>
                    {p.active && (
                      <span className="text-xs text-blue-600 bg-blue-100 px-2 py-0.5 rounded-full">
                        Padrão
                      </span>
                    )}
                  </div>
                ))}
                <button className="w-full py-2.5 border-2 border-dashed border-gray-200 rounded-xl text-sm text-gray-500 hover:border-blue-300 hover:text-blue-600 transition-colors">
                  + Adicionar forma de pagamento
                </button>
              </div>
            </div>

            {/* Transaction history */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <h3 className="text-gray-900 mb-4">Histórico de pagamentos</h3>
              <div className="flex flex-col gap-3">
                {mockOrders
                  .filter((o) => o.status !== "aguardando")
                  .map((order) => (
                    <div
                      key={order.id}
                      className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0"
                    >
                      <div>
                        <p className="text-sm text-gray-800">
                          {order.professionalName}
                        </p>
                        <p className="text-xs text-gray-400">
                          {new Date(order.date).toLocaleDateString("pt-BR")} ·
                          Pix
                        </p>
                      </div>
                      <div className="text-right">
                        <p
                          className={`text-sm ${
                            order.status === "cancelado"
                              ? "text-red-500"
                              : "text-gray-800"
                          }`}
                          style={{ fontWeight: 600 }}
                        >
                          {order.status === "cancelado" ? "—" : `R$${order.price}`}
                        </p>
                        <p className="text-xs text-gray-400">{order.status}</p>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Rating Modal */}
      {ratingModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl">
            <h3 className="text-gray-900 mb-4">
              Como foi o serviço?
            </h3>
            <div className="flex justify-center gap-3 mb-4">
              {Array.from({ length: 5 }, (_, i) => (
                <Star
                  key={i}
                  className={`w-10 h-10 cursor-pointer transition-colors ${
                    (ratings[ratingModal] ?? 0) > i
                      ? "text-yellow-400 fill-yellow-400"
                      : "text-gray-200"
                  }`}
                  onClick={() =>
                    setRatings((r) => ({ ...r, [ratingModal]: i + 1 }))
                  }
                />
              ))}
            </div>
            <textarea
              rows={3}
              placeholder="Deixe um comentário (opcional)..."
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-blue-400 resize-none mb-4"
            />
            <div className="flex gap-2">
              <button
                onClick={() => setRatingModal(null)}
                className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-500"
              >
                Cancelar
              </button>
              <button
                onClick={() => submitRating(ratingModal)}
                className="flex-1 py-2.5 bg-blue-600 text-white rounded-xl text-sm hover:bg-blue-700"
              >
                Enviar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
