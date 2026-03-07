import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ClipboardList,
  MessageCircle,
  Star,
  CreditCard,
  User,
  Send,
  X,
  CheckCircle,
  Clock,
  XCircle,
  AlertCircle,
} from "lucide-react";

type Tab = "pedidos" | "chat" | "avaliacoes" | "pagamento";

type OrderStatus = "concluído" | "em andamento" | "cancelado" | "aguardando";

interface DashboardUser {
  id: string;
  name: string;
  email?: string;
}

interface DashboardMessage {
  id: string;
  sender: "user" | "professional";
  text: string;
  time: string;
}

interface DashboardProfessional {
  id: string;
  name: string;
  photo?: string;
  categoryLabel?: string;
  online?: boolean;
}

interface DashboardOrder {
  id: string;
  professionalId: string;
  professionalName: string;
  professional?: DashboardProfessional;
  category: string;
  date: string;
  price: number;
  status: OrderStatus;
  rating?: number;
}

interface PaymentMethod {
  id: string;
  type: string;
  description: string;
  icon?: string;
  active: boolean;
}

interface PaymentHistoryItem {
  id: string;
  professionalName: string;
  date: string;
  method: string;
  amount: number;
  status: string;
}

interface DashboardResponse {
  user: DashboardUser | null;
  orders: DashboardOrder[];
  messages: DashboardMessage[];
  paymentMethods: PaymentMethod[];
  paymentHistory: PaymentHistoryItem[];
  activeChatProfessional?: DashboardProfessional | null;
}

const statusConfig: Record<
  OrderStatus,
  {
    icon: typeof CheckCircle;
    color: string;
    bg: string;
    label: string;
  }
> = {
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

 function UserDashboard() {
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<Tab>("pedidos");
  const [chatMessage, setChatMessage] = useState("");
  const [messages, setMessages] = useState<DashboardMessage[]>([]);
  const [orders, setOrders] = useState<DashboardOrder[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [paymentHistory, setPaymentHistory] = useState<PaymentHistoryItem[]>([]);
  const [user, setUser] = useState<DashboardUser | null>(null);
  const [activeChatProfessional, setActiveChatProfessional] =
    useState<DashboardProfessional | null>(null);

  const [ratingModal, setRatingModal] = useState<string | null>(null);
  const [ratings, setRatings] = useState<Record<string, number>>({});
  const [ratingComment, setRatingComment] = useState("");
  const [ratingSuccess, setRatingSuccess] = useState(false);

  const [loading, setLoading] = useState(true);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [submittingRating, setSubmittingRating] = useState(false);
  const [error, setError] = useState("");

  const tabs: { id: Tab; label: string; icon: typeof ClipboardList }[] = [
    { id: "pedidos", label: "Pedidos", icon: ClipboardList },
    { id: "chat", label: "Chat", icon: MessageCircle },
    { id: "avaliacoes", label: "Avaliações", icon: Star },
    { id: "pagamento", label: "Pagamento", icon: CreditCard },
  ];

  useEffect(() => {
    async function loadDashboard() {
      try {
        setLoading(true);
        setError("");

        const response = await fetch("/api/dashboard");

        if (!response.ok) {
          throw new Error("Não foi possível carregar o painel do usuário.");
        }

        const data: DashboardResponse = await response.json();

        setUser(data.user ?? null);
        setOrders(Array.isArray(data.orders) ? data.orders : []);
        setMessages(Array.isArray(data.messages) ? data.messages : []);
        setPaymentMethods(
          Array.isArray(data.paymentMethods) ? data.paymentMethods : []
        );
        setPaymentHistory(
          Array.isArray(data.paymentHistory) ? data.paymentHistory : []
        );
        setActiveChatProfessional(data.activeChatProfessional ?? null);
      } catch (err) {
        console.error(err);
        setError("Erro ao carregar os dados do painel.");
      } finally {
        setLoading(false);
      }
    }

    loadDashboard();
  }, []);

  const completedOrders = useMemo(
    () => orders.filter((order) => order.status === "concluído"),
    [orders]
  );

  const inProgressOrders = useMemo(
    () => orders.filter((order) => order.status === "em andamento"),
    [orders]
  );

  const totalSpent = useMemo(() => {
    return completedOrders.reduce((sum, order) => sum + order.price, 0);
  }, [completedOrders]);

  const sendMessage = async () => {
    if (!chatMessage.trim()) return;
    if (!activeChatProfessional?.id) return;

    const optimisticMessage: DashboardMessage = {
      id: `temp-${Date.now()}`,
      sender: "user",
      text: chatMessage,
      time: new Date().toLocaleTimeString("pt-BR", {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };

    setMessages((prev) => [...prev, optimisticMessage]);
    setChatMessage("");

    try {
      setSendingMessage(true);

      const response = await fetch("/api/dashboard/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          professionalId: activeChatProfessional.id,
          text: optimisticMessage.text,
        }),
      });

      if (!response.ok) {
        throw new Error("Não foi possível enviar a mensagem.");
      }

      const savedMessage: DashboardMessage = await response.json();

      setMessages((prev) =>
        prev.map((msg) => (msg.id === optimisticMessage.id ? savedMessage : msg))
      );
    } catch (err) {
      console.error(err);
      setMessages((prev) => prev.filter((msg) => msg.id !== optimisticMessage.id));
    } finally {
      setSendingMessage(false);
    }
  };

  const submitRating = async (orderId: string) => {
    const selectedRating = ratings[orderId];

    if (!selectedRating) return;

    try {
      setSubmittingRating(true);

      const response = await fetch(`/api/dashboard/orders/${orderId}/rating`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          rating: selectedRating,
          comment: ratingComment,
        }),
      });

      if (!response.ok) {
        throw new Error("Não foi possível enviar a avaliação.");
      }

      setOrders((prev) =>
        prev.map((order) =>
          order.id === orderId ? { ...order, rating: selectedRating } : order
        )
      );

      setRatingModal(null);
      setRatingComment("");
      setRatingSuccess(true);
      setTimeout(() => setRatingSuccess(false), 2000);
    } catch (err) {
      console.error(err);
    } finally {
      setSubmittingRating(false);
    }
  };

  const openRatingModal = (orderId: string) => {
    setRatingModal(orderId);
    setRatingComment("");
  };

  const handleCancelOrder = async (orderId: string) => {
    try {
      const response = await fetch(`/api/dashboard/orders/${orderId}/cancel`, {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("Não foi possível cancelar o pedido.");
      }

      setOrders((prev) =>
        prev.map((order) =>
          order.id === orderId ? { ...order, status: "cancelado" } : order
        )
      );
    } catch (err) {
      console.error(err);
    }
  };

  const showChatFromOrder = (order: DashboardOrder) => {
    setActiveChatProfessional(
      order.professional ?? {
        id: order.professionalId,
        name: order.professionalName,
        categoryLabel: order.category,
        online: true,
      }
    );
    setActiveTab("chat");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">Carregando painel...</p>
      </div>
    );
  }

  if (error) {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
      <div className="bg-white border border-red-100 rounded-2xl shadow-sm p-8 max-w-md w-full text-center">
        <AlertCircle className="w-10 h-10 text-red-500 mx-auto mb-4" />

        <h2 className="text-slate-900 text-lg mb-2">
          Falha ao carregar
        </h2>

        <p className="text-slate-500 text-sm mb-5">
          {error}
        </p>

        <button
          onClick={() => navigate(0)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl transition-colors"
        >
          Tentar novamente
        </button>
      </div>
    </div>
  );
}

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-5">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
              <User className="w-6 h-6 text-blue-600" />
            </div>

            <div>
              <h1 className="text-gray-900">
                Olá, {user?.name || "usuário"}!
              </h1>
              <p className="text-sm text-gray-500">
                Gerencie seus pedidos e conversas
              </p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 mt-5">
            {[
              {
                label: "Serviços realizados",
                value: completedOrders.length,
                color: "text-green-600",
              },
              {
                label: "Em andamento",
                value: inProgressOrders.length,
                color: "text-blue-600",
              },
              {
                label: "Total gasto",
                value: `R$${totalSpent.toFixed(2)}`,
                color: "text-gray-900",
              },
            ].map((item, index) => (
              <div key={index} className="text-center bg-gray-50 rounded-xl p-3">
                <p
                  className={item.color}
                  style={{ fontWeight: 700, fontSize: "1.25rem" }}
                >
                  {item.value}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">{item.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white border-b border-gray-100 sticky top-16 z-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="flex overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3.5 text-sm whitespace-nowrap border-b-2 transition-all ${
                  activeTab === tab.id
                    ? "text-blue-600 border-blue-600"
                    : "text-gray-500 border-transparent hover:text-gray-700"
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
        {activeTab === "pedidos" && (
          <div className="flex flex-col gap-3">
            {orders.length === 0 ? (
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 text-center text-gray-500">
                Nenhum pedido encontrado.
              </div>
            ) : (
              orders.map((order) => {
                const config = statusConfig[order.status];
                const StatusIcon = config.icon;

                return (
                  <div
                    key={order.id}
                    className="bg-white rounded-xl border border-gray-100 shadow-sm p-4"
                  >
                    <div className="flex items-start gap-3">
                      {order.professional?.photo ? (
                        <img
                          src={order.professional.photo}
                          alt={order.professionalName}
                          className="w-11 h-11 rounded-xl object-cover flex-shrink-0"
                        />
                      ) : (
                        <div className="w-11 h-11 rounded-xl bg-gray-100 flex items-center justify-center flex-shrink-0">
                          <User className="w-5 h-5 text-gray-400" />
                        </div>
                      )}

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p
                            className="text-gray-900 truncate"
                            style={{ fontWeight: 600 }}
                          >
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

                        <p
                          className="text-blue-600 mt-1 text-sm"
                          style={{ fontWeight: 600 }}
                        >
                          R${order.price.toFixed(2)}
                        </p>
                      </div>
                    </div>

                    {order.status === "concluído" && !order.rating && (
                      <button
                        onClick={() => openRatingModal(order.id)}
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
                             i < (order.rating ?? 0)
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
                          onClick={() => showChatFromOrder(order)}
                          className="flex-1 flex items-center justify-center gap-1 text-sm text-blue-600 bg-blue-50 hover:bg-blue-100 py-2 rounded-lg transition-colors"
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                          Chat
                        </button>

                        <button
                          onClick={() => handleCancelOrder(order.id)}
                          className="flex-1 flex items-center justify-center gap-1 text-sm text-red-500 bg-red-50 hover:bg-red-100 py-2 rounded-lg transition-colors"
                        >
                          <X className="w-3.5 h-3.5" />
                          Cancelar
                        </button>
                      </div>
                    )}
                  </div>
                );
              })
            )}

            {ratingSuccess && (
              <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-green-600 text-white px-5 py-3 rounded-xl shadow-lg flex items-center gap-2 z-50">
                <CheckCircle className="w-4 h-4" />
                Avaliação enviada com sucesso!
              </div>
            )}
          </div>
        )}

        {activeTab === "chat" && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="flex items-center gap-3 p-4 border-b border-gray-100 bg-blue-600 text-white">
              {activeChatProfessional?.photo ? (
                <img
                  src={activeChatProfessional.photo}
                  alt={activeChatProfessional.name}
                  className="w-9 h-9 rounded-full object-cover"
                />
              ) : (
                <div className="w-9 h-9 rounded-full bg-white/15 flex items-center justify-center">
                  <User className="w-4 h-4" />
                </div>
              )}

              <div>
                <p style={{ fontWeight: 600 }}>
                  {activeChatProfessional?.name || "Selecione uma conversa"}
                </p>
                <p className="text-xs text-blue-200">
                  {activeChatProfessional?.categoryLabel || "Sem profissional ativo"}
                </p>
              </div>

              {activeChatProfessional && (
                <div className="ml-auto flex items-center gap-1.5 bg-green-500/20 px-2 py-0.5 rounded-full">
                  <div className="w-2 h-2 bg-green-400 rounded-full" />
                  <span className="text-xs text-green-200">
                    {activeChatProfessional.online ? "Online" : "Offline"}
                  </span>
                </div>
              )}
            </div>

            <div className="h-80 overflow-y-auto p-4 flex flex-col gap-3 bg-gray-50">
              {!activeChatProfessional ? (
                <p className="text-sm text-gray-500 text-center mt-8">
                  Abra um pedido em andamento para conversar com o profissional.
                </p>
              ) : messages.length === 0 ? (
                <p className="text-sm text-gray-500 text-center mt-8">
                  Nenhuma mensagem ainda.
                </p>
              ) : (
                messages.map((msg) => (
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
                ))
              )}
            </div>

            <div className="p-3 border-t border-gray-100 flex gap-2">
              <input
                type="text"
                value={chatMessage}
                onChange={(e) => setChatMessage(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                placeholder="Digite uma mensagem..."
                disabled={!activeChatProfessional || sendingMessage}
                className="flex-1 px-4 py-2.5 bg-gray-100 rounded-xl text-sm outline-none disabled:opacity-60"
              />

              <button
                onClick={sendMessage}
                disabled={!activeChatProfessional || sendingMessage}
                className="bg-blue-600 text-white p-2.5 rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-60"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {activeTab === "avaliacoes" && (
          <div className="flex flex-col gap-4">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <h3 className="text-gray-900 mb-1">Suas avaliações</h3>
              <p className="text-sm text-gray-500 mb-4">
                Avalie os profissionais que atenderam você
              </p>

              {completedOrders.length === 0 ? (
                <p className="text-sm text-gray-500">
                  Você ainda não possui serviços concluídos para avaliar.
                </p>
              ) : (
                completedOrders.map((order) => (
                  <div
                    key={order.id}
                    className="flex items-center gap-3 py-3 border-b border-gray-100 last:border-0"
                  >
                    {order.professional?.photo ? (
                      <img
                        src={order.professional.photo}
                        alt={order.professionalName}
                        className="w-10 h-10 rounded-xl object-cover"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center">
                        <User className="w-4 h-4 text-gray-400" />
                      </div>
                    )}

                    <div className="flex-1">
                      <p
                        className="text-sm text-gray-800"
                        style={{ fontWeight: 600 }}
                      >
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
                              setRatings((prev) => ({
                                ...prev,
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
                ))
              )}
            </div>
          </div>
        )}

        {activeTab === "pagamento" && (
          <div className="flex flex-col gap-4">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <h3 className="text-gray-900 mb-4">Formas de pagamento</h3>

              <div className="flex flex-col gap-3">
                {paymentMethods.length === 0 ? (
                  <p className="text-sm text-gray-500">
                    Nenhuma forma de pagamento cadastrada.
                  </p>
                ) : (
                  paymentMethods.map((method) => (
                    <div
                      key={method.id}
                      className={`flex items-center gap-3 p-3 rounded-xl border ${
                        method.active
                          ? "border-blue-200 bg-blue-50"
                          : "border-gray-200"
                      }`}
                    >
                      <span className="text-2xl">{method.icon || "💳"}</span>

                      <div className="flex-1">
                        <p
                          className="text-sm text-gray-800"
                          style={{ fontWeight: 600 }}
                        >
                          {method.type}
                        </p>
                        <p className="text-xs text-gray-500">
                          {method.description}
                        </p>
                      </div>

                      {method.active && (
                        <span className="text-xs text-blue-600 bg-blue-100 px-2 py-0.5 rounded-full">
                          Padrão
                        </span>
                      )}
                    </div>
                  ))
                )}

                <button className="w-full py-2.5 border-2 border-dashed border-gray-200 rounded-xl text-sm text-gray-500 hover:border-blue-300 hover:text-blue-600 transition-colors">
                  + Adicionar forma de pagamento
                </button>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <h3 className="text-gray-900 mb-4">Histórico de pagamentos</h3>

              <div className="flex flex-col gap-3">
                {paymentHistory.length === 0 ? (
                  <p className="text-sm text-gray-500">
                    Nenhum pagamento encontrado.
                  </p>
                ) : (
                  paymentHistory.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0"
                    >
                      <div>
                        <p className="text-sm text-gray-800">
                          {item.professionalName}
                        </p>
                        <p className="text-xs text-gray-400">
                          {new Date(item.date).toLocaleDateString("pt-BR")} ·{" "}
                          {item.method}
                        </p>
                      </div>

                      <div className="text-right">
                        <p
                          className={`text-sm ${
                            item.status.toLowerCase() === "cancelado"
                              ? "text-red-500"
                              : "text-gray-800"
                          }`}
                          style={{ fontWeight: 600 }}
                        >
                          {item.status.toLowerCase() === "cancelado"
                            ? "—"
                            : `R$${item.amount.toFixed(2)}`}
                        </p>
                        <p className="text-xs text-gray-400">{item.status}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {ratingModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl">
            <h3 className="text-gray-900 mb-4">Como foi o serviço?</h3>

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
                    setRatings((prev) => ({
                      ...prev,
                      [ratingModal]: i + 1,
                    }))
                  }
                />
              ))}
            </div>

            <textarea
              rows={3}
              value={ratingComment}
              onChange={(e) => setRatingComment(e.target.value)}
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
                disabled={!ratings[ratingModal] || submittingRating}
                className="flex-1 py-2.5 bg-blue-600 text-white rounded-xl text-sm hover:bg-blue-700 disabled:opacity-60"
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
export default UserDashboard;