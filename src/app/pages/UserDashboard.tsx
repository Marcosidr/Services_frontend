import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
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
import { getAuthorizationHeader } from "../utils/auth";
import { fileToOptimizedDataUrl } from "../utils/image";

type Tab = "pedidos" | "chat" | "avaliacoes" | "pagamento" | "perfil";

type OrderStatus = "concluido" | "em andamento" | "cancelado" | "aguardando";

interface DashboardUser {
  id: string;
  name: string;
  email?: string;
  phone?: string | null;
  cep?: string | null;
  endereco?: string | null;
  numero?: string | null;
  complemento?: string | null;
  bairro?: string | null;
  cidade?: string | null;
  uf?: string | null;
  estado?: string | null;
  photo?: string;
  bio?: string | null;
  role?: "user" | "professional" | "admin";
}

interface DashboardMessage {
  id: string;
  sender: "user" | "professional";
  text: string;
  time: string;
  senderId?: number;
  receiverId?: number;
  conversationId?: string;
  read?: boolean;
  createdAt?: string;
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
  orders: RawDashboardOrder[];
  messages: DashboardMessage[];
  paymentMethods: PaymentMethod[];
  paymentHistory: PaymentHistoryItem[];
  activeChatProfessional?: DashboardProfessional | null;
}

type ApiChatMessage = {
  id: string;
  sender: "user" | "professional";
  text: string;
  time?: string;
  senderId?: number;
  receiverId?: number;
  conversationId?: string;
  read?: boolean;
  createdAt?: string;
};

type MessagesResponse = {
  items?: ApiChatMessage[];
};

type ConversationSummary = {
  conversationId: string;
  otherUserId: number;
  otherUserName: string;
  otherUserPhoto?: string;
  lastMessage: {
    id: string;
    senderId: number;
    text: string;
    read: boolean;
    time?: string;
    createdAt?: string;
  };
  unreadCount: number;
};

type ConversationsResponse = {
  items?: ConversationSummary[];
};

type RawDashboardOrder = Omit<DashboardOrder, "status"> & {
  status?: string;
};

type ProfileForm = {
  name: string;
  phone: string;
  cep: string;
  endereco: string;
  numero: string;
  complemento: string;
  bairro: string;
  cidade: string;
  uf: string;
  estado: string;
  photoUrl: string;
  bio: string;
  professionalDescription: string;
  professionalPhotoUrl: string;
};

function parsePositiveInteger(value: string | null) {
  if (!value || !/^\d+$/.test(value)) return null;
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed <= 0) return null;
  return parsed;
}

function normalizeOrderStatus(status: unknown): OrderStatus {
  if (typeof status !== "string") return "aguardando";

  const normalized = status
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

  if (normalized === "concluido") return "concluido";
  if (normalized === "em andamento") return "em andamento";
  if (normalized === "cancelado") return "cancelado";
  return "aguardando";
}

function normalizeChatMessage(message: ApiChatMessage): DashboardMessage {
  return {
    id: message.id,
    sender: message.sender,
    text: message.text,
    time:
      message.time ??
      new Date(message.createdAt ?? Date.now()).toLocaleTimeString("pt-BR", {
        hour: "2-digit",
        minute: "2-digit"
      }),
    senderId: message.senderId,
    receiverId: message.receiverId,
    conversationId: message.conversationId,
    read: message.read,
    createdAt: message.createdAt
  };
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
  concluido: {
    icon: CheckCircle,
    color: "text-green-600",
    bg: "bg-green-50",
    label: "Concluido",
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
  const location = useLocation();

  const [activeTab, setActiveTab] = useState<Tab>("pedidos");
  const [chatMessage, setChatMessage] = useState("");
  const [messages, setMessages] = useState<DashboardMessage[]>([]);
  const [orders, setOrders] = useState<DashboardOrder[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [paymentHistory, setPaymentHistory] = useState<PaymentHistoryItem[]>([]);
  const [user, setUser] = useState<DashboardUser | null>(null);
  const [activeChatProfessional, setActiveChatProfessional] =
    useState<DashboardProfessional | null>(null);
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);

  const [ratingModal, setRatingModal] = useState<string | null>(null);
  const [ratings, setRatings] = useState<Record<string, number>>({});
  const [ratingComment, setRatingComment] = useState("");
  const [ratingSuccess, setRatingSuccess] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState(false);
  const [profileForm, setProfileForm] = useState<ProfileForm>({
    name: "",
    phone: "",
    cep: "",
    endereco: "",
    numero: "",
    complemento: "",
    bairro: "",
    cidade: "",
    uf: "",
    estado: "",
    photoUrl: "",
    bio: "",
    professionalDescription: "",
    professionalPhotoUrl: ""
  });
  const [savingProfile, setSavingProfile] = useState(false);

  const [loading, setLoading] = useState(true);
  const [loadingConversations, setLoadingConversations] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [submittingRating, setSubmittingRating] = useState(false);
  const [error, setError] = useState("");

  const tabs: { id: Tab; label: string; icon: typeof ClipboardList }[] = [
    { id: "pedidos", label: "Pedidos", icon: ClipboardList },
    { id: "chat", label: "Chat", icon: MessageCircle },
    { id: "avaliacoes", label: "Avaliações", icon: Star },
    { id: "pagamento", label: "Pagamento", icon: CreditCard },
    { id: "perfil", label: "Perfil", icon: User },
  ];

  useEffect(() => {
    async function loadDashboard() {
      try {
        setLoading(true);
        setError("");

        const response = await fetch("/api/dashboard", {
          headers: {
            ...getAuthorizationHeader(),
          },
        });

        if (!response.ok) {
          throw new Error("Não foi possível carregar o painel do usuário.");
        }

        const data: DashboardResponse = await response.json();
        const normalizedOrders = Array.isArray(data.orders)
          ? data.orders.map((order) => ({
              ...order,
              status: normalizeOrderStatus(order.status)
            }))
          : [];
        const nextUser = data.user ?? null;

        setUser(nextUser);
        setOrders(normalizedOrders);
        setPaymentMethods(
          Array.isArray(data.paymentMethods) ? data.paymentMethods : []
        );
        setPaymentHistory(
          Array.isArray(data.paymentHistory) ? data.paymentHistory : []
        );
        setProfileForm((prev) => ({
          ...prev,
          name: nextUser?.name ?? "",
          phone: nextUser?.phone ?? "",
          cep: nextUser?.cep ?? "",
          endereco: nextUser?.endereco ?? "",
          numero: nextUser?.numero ?? "",
          complemento: nextUser?.complemento ?? "",
          bairro: nextUser?.bairro ?? "",
          cidade: nextUser?.cidade ?? "",
          uf: nextUser?.uf ?? "",
          estado: nextUser?.estado ?? "",
          photoUrl: nextUser?.photo ?? "",
          bio: typeof nextUser?.bio === "string" ? nextUser.bio : ""
        }));
      } catch (err) {
        console.error(err);
        setError("Erro ao carregar os dados do painel.");
      } finally {
        setLoading(false);
      }
    }

    loadDashboard();
  }, []);

  useEffect(() => {
    async function loadMyProfessionalProfile() {
      if (user?.role !== "professional") return;

      try {
        const response = await fetch("/api/professionals/me", {
          headers: {
            ...getAuthorizationHeader()
          }
        });

        if (!response.ok) return;

        const data = (await response.json()) as {
          description?: string;
          photo?: string;
        };

        setProfileForm((prev) => ({
          ...prev,
          professionalDescription:
            typeof data.description === "string" ? data.description : "",
          professionalPhotoUrl:
            typeof data.photo === "string" ? data.photo : prev.professionalPhotoUrl
        }));
      } catch (err) {
        console.error(err);
      }
    }

    void loadMyProfessionalProfile();
  }, [user?.role]);

  const completedOrders = useMemo(
    () => orders.filter((order) => order.status === "concluido"),
    [orders]
  );

  const inProgressOrders = useMemo(
    () => orders.filter((order) => order.status === "em andamento"),
    [orders]
  );

  const totalSpent = useMemo(() => {
    return completedOrders.reduce((sum, order) => sum + order.price, 0);
  }, [completedOrders]);

  const loadConversationMessages = async (withUserId: number) => {
    const response = await fetch(`/api/messages?withUserId=${withUserId}&limit=100`, {
      headers: {
        ...getAuthorizationHeader()
      }
    });

    if (!response.ok) return;

    const data = (await response.json()) as MessagesResponse;
    const normalizedMessages = Array.isArray(data.items)
      ? data.items.map((message) => normalizeChatMessage(message))
      : [];

    setMessages(normalizedMessages);
  };

  const loadConversations = async (
    preferredUserId: number | null = null,
    preferredUserName = "",
    preferredUserPhoto = ""
  ) => {
    try {
      setLoadingConversations(true);

      const response = await fetch("/api/messages/conversations?limit=50", {
        headers: {
          ...getAuthorizationHeader()
        }
      });

      if (!response.ok) return;

      const data = (await response.json()) as ConversationsResponse;
      const items = Array.isArray(data.items) ? data.items : [];
      setConversations(items);

      const activeUserId = parsePositiveInteger(activeChatProfessional?.id ?? null);
      const nextUserId =
        preferredUserId ??
        activeUserId ??
        (items.length > 0 ? items[0].otherUserId : null);

      if (!nextUserId) {
        setActiveChatProfessional(null);
        setMessages([]);
        return;
      }

      const selectedConversation = items.find((item) => item.otherUserId === nextUserId);
      const selectedUserName =
        preferredUserName ||
        selectedConversation?.otherUserName ||
        activeChatProfessional?.name ||
        `Conversa #${nextUserId}`;
      const selectedUserPhoto =
        preferredUserPhoto ||
        selectedConversation?.otherUserPhoto ||
        activeChatProfessional?.photo ||
        "";

      setActiveChatProfessional({
        id: String(nextUserId),
        name: selectedUserName,
        photo: selectedUserPhoto,
        categoryLabel: "Mensagem direta",
        online: false
      });

      await loadConversationMessages(nextUserId);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingConversations(false);
    }
  };

  const openConversation = async (
    withUserId: number,
    withUserName = "",
    withUserPhoto = ""
  ) => {
    setActiveChatProfessional({
      id: String(withUserId),
      name: withUserName || `Conversa #${withUserId}`,
      photo: withUserPhoto,
      categoryLabel: "Mensagem direta",
      online: false
    });
    setActiveTab("chat");

    try {
      await loadConversationMessages(withUserId);
    } catch (err) {
      console.error(err);
    }
  };

  const sendMessage = async () => {
    if (!chatMessage.trim()) return;
    const activeChat = activeChatProfessional;
    if (!activeChat?.id) return;

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

      const response = await fetch("/api/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getAuthorizationHeader(),
        },
        body: JSON.stringify({
          recipientId: Number(activeChat.id),
          text: optimisticMessage.text,
        }),
      });

      if (!response.ok) {
        throw new Error("Não foi possível enviar a mensagem.");
      }

      const savedMessage = (await response.json()) as ApiChatMessage;
      const normalizedSavedMessage = normalizeChatMessage(savedMessage);

      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === optimisticMessage.id
            ? normalizedSavedMessage
            : msg
        )
      );

      const activeRecipientId = Number(activeChat.id);
      if (Number.isSafeInteger(activeRecipientId) && activeRecipientId > 0) {
        await loadConversations(activeRecipientId, activeChat.name);
      } else {
        await loadConversations();
      }
    } catch (err) {
      console.error(err);
      setMessages((prev) => prev.filter((msg) => msg.id !== optimisticMessage.id));
    } finally {
      setSendingMessage(false);
    }
  };

  const submitRating = async (orderId: string) => {
    const selectedRating = ratings[orderId];
    const order = orders.find((currentOrder) => currentOrder.id === orderId);

    if (!selectedRating) return;

    try {
      setSubmittingRating(true);

      const response = await fetch(`/api/dashboard/orders/${orderId}/rating`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getAuthorizationHeader(),
        },
        body: JSON.stringify({
          rating: selectedRating,
          comment: ratingComment,
          professionalId: order?.professionalId ?? "",
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
        headers: {
          ...getAuthorizationHeader(),
        },
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

  const updateProfileField = <K extends keyof ProfileForm>(field: K, value: ProfileForm[K]) => {
    setProfileForm((prev) => ({
      ...prev,
      [field]: value
    }));
  };

  const handleUserPhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const dataUrl = await fileToOptimizedDataUrl(file);
      updateProfileField("photoUrl", dataUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao processar a imagem.");
    } finally {
      event.target.value = "";
    }
  };

  const handleProfessionalPhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const dataUrl = await fileToOptimizedDataUrl(file);
      updateProfileField("professionalPhotoUrl", dataUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao processar a imagem.");
    } finally {
      event.target.value = "";
    }
  };

  const saveProfile = async () => {
    try {
      setSavingProfile(true);
      setError("");

      const response = await fetch("/api/auth/me/profile", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...getAuthorizationHeader()
        },
        body: JSON.stringify({
          name: profileForm.name,
          phone: profileForm.phone,
          cep: profileForm.cep,
          endereco: profileForm.endereco,
          numero: profileForm.numero,
          complemento: profileForm.complemento,
          bairro: profileForm.bairro,
          cidade: profileForm.cidade,
          uf: profileForm.uf,
          estado: profileForm.estado,
          photoUrl: profileForm.photoUrl,
          bio: profileForm.bio
        })
      });

      if (!response.ok) {
        throw new Error("Nao foi possivel atualizar o perfil.");
      }

      const userData = (await response.json()) as {
        user?: DashboardUser;
      };

      if (userData.user) {
        setUser(userData.user);
        localStorage.setItem("user", JSON.stringify(userData.user));
      }

      if (user?.role === "professional") {
        const professionalResponse = await fetch("/api/professionals/me", {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            ...getAuthorizationHeader()
          },
          body: JSON.stringify({
            description: profileForm.professionalDescription,
            photoUrl: profileForm.professionalPhotoUrl || profileForm.photoUrl
          })
        });

        if (!professionalResponse.ok) {
          throw new Error("Perfil do profissional nao foi atualizado.");
        }
      }

      setProfileSuccess(true);
      setTimeout(() => setProfileSuccess(false), 2000);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Erro ao salvar perfil.");
    } finally {
      setSavingProfile(false);
    }
  };

  const showChatFromOrder = (order: DashboardOrder) => {
    const professionalId = parsePositiveInteger(order.professionalId);
    if (!professionalId) return;

    const professionalName = order.professional?.name ?? order.professionalName;
    const professionalPhoto = order.professional?.photo ?? "";
    void openConversation(professionalId, professionalName, professionalPhoto);
    void loadConversations(professionalId, professionalName, professionalPhoto);
  };

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const chatWith = parsePositiveInteger(params.get("chatWith"));
    const chatName = (params.get("chatName") ?? "").trim();
    if (chatWith) {
      setActiveTab("chat");
    }
    void loadConversations(chatWith, chatName);
  }, [location.search]);

  useEffect(() => {
    if (activeTab !== "chat") return;
    if (conversations.length > 0) return;

    void loadConversations();
  }, [activeTab]);

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
            {user?.photo ? (
              <img
                src={user.photo}
                alt={user.name}
                className="w-12 h-12 rounded-full object-cover"
                loading="lazy"
              />
            ) : (
              <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                <User className="w-6 h-6 text-blue-600" />
              </div>
            )}

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

                    {order.status === "concluido" && !order.rating && (
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
            <div className="grid grid-cols-1 md:grid-cols-[280px,1fr] min-h-[34rem]">
              <aside className="border-b md:border-b-0 md:border-r border-gray-100 bg-gray-50">
                <div className="px-4 py-3 border-b border-gray-100 bg-white">
                  <p className="text-sm text-gray-800" style={{ fontWeight: 600 }}>
                    Conversas
                  </p>
                </div>

                <div className="max-h-[30rem] overflow-y-auto">
                  {loadingConversations ? (
                    <p className="px-4 py-4 text-sm text-gray-500">Carregando conversas...</p>
                  ) : conversations.length === 0 ? (
                    <p className="px-4 py-4 text-sm text-gray-500">
                      Você ainda não possui conversas.
                    </p>
                  ) : (
                    conversations.map((conversation) => {
                      const isActive =
                        activeChatProfessional?.id === String(conversation.otherUserId);

                      return (
                        <button
                          key={conversation.conversationId}
                          onClick={() =>
                            void openConversation(
                              conversation.otherUserId,
                              conversation.otherUserName,
                              conversation.otherUserPhoto ?? ""
                            )
                          }
                          className={`w-full text-left px-4 py-3 border-b border-gray-100 transition-colors ${
                            isActive ? "bg-blue-50" : "hover:bg-white"
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            {conversation.otherUserPhoto ? (
                              <img
                                src={conversation.otherUserPhoto}
                                alt={conversation.otherUserName}
                                className="w-9 h-9 rounded-full object-cover"
                                loading="lazy"
                              />
                            ) : (
                              <div
                                className={`w-9 h-9 rounded-full flex items-center justify-center ${
                                  isActive ? "bg-blue-100 text-blue-600" : "bg-gray-200 text-gray-500"
                                }`}
                              >
                                <User className="w-4 h-4" />
                              </div>
                            )}

                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-2">
                                <p
                                  className="text-sm text-gray-800 truncate"
                                  style={{ fontWeight: isActive ? 700 : 600 }}
                                >
                                  {conversation.otherUserName}
                                </p>
                                <span className="text-[11px] text-gray-400 flex-shrink-0">
                                  {conversation.lastMessage.time ??
                                    new Date(
                                      conversation.lastMessage.createdAt ?? Date.now()
                                    ).toLocaleTimeString("pt-BR", {
                                      hour: "2-digit",
                                      minute: "2-digit"
                                    })}
                                </span>
                              </div>

                              <div className="flex items-center gap-2 mt-0.5">
                                <p className="text-xs text-gray-500 truncate flex-1">
                                  {conversation.lastMessage.text}
                                </p>
                                {conversation.unreadCount > 0 && (
                                  <span className="min-w-[18px] h-[18px] px-1 rounded-full bg-blue-600 text-white text-[10px] flex items-center justify-center">
                                    {conversation.unreadCount > 9 ? "9+" : conversation.unreadCount}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </button>
                      );
                    })
                  )}
                </div>
              </aside>

              <section className="flex flex-col min-h-[34rem]">
                <div className="flex items-center gap-3 p-4 border-b border-gray-100 bg-blue-600 text-white">
                  {activeChatProfessional?.photo ? (
                    <img
                      src={activeChatProfessional.photo}
                      alt={activeChatProfessional.name}
                      className="w-9 h-9 rounded-full object-cover"
                      loading="lazy"
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
                      {activeChatProfessional
                        ? "Conversa ativa"
                        : "Escolha uma conversa na lista ao lado"}
                    </p>
                  </div>
                </div>

                <div className="h-80 overflow-y-auto p-4 flex flex-col gap-3 bg-gray-50 flex-1">
                  {!activeChatProfessional ? (
                    <p className="text-sm text-gray-500 text-center mt-8">
                      Selecione uma conversa para começar.
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
              </section>
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
                  Você ainda não possui serviços concluidos para avaliar.
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

        {activeTab === "perfil" && (
          <div className="flex flex-col gap-4">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <h3 className="text-gray-900 mb-1">Editar perfil</h3>
              <p className="text-sm text-gray-500 mb-4">
                Atualize foto, bio e endereco do seu perfil.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <input
                  value={profileForm.name}
                  onChange={(event) => updateProfileField("name", event.target.value)}
                  placeholder="Nome"
                  className="px-3 py-2.5 rounded-xl border border-gray-200 text-sm"
                />
                <input
                  value={profileForm.phone}
                  onChange={(event) => updateProfileField("phone", event.target.value)}
                  placeholder="Telefone"
                  className="px-3 py-2.5 rounded-xl border border-gray-200 text-sm"
                />
                <div className="md:col-span-2">
                  <p className="text-xs text-gray-500 mb-1.5">Foto de perfil</p>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleUserPhotoUpload}
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm"
                  />
                  {profileForm.photoUrl && (
                    <div className="mt-2 flex items-center gap-3">
                      <img
                        src={profileForm.photoUrl}
                        alt="Preview da foto de perfil"
                        className="w-14 h-14 rounded-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => updateProfileField("photoUrl", "")}
                        className="text-xs text-red-600 hover:underline"
                      >
                        Remover foto
                      </button>
                    </div>
                  )}
                </div>
                <textarea
                  value={profileForm.bio}
                  onChange={(event) => updateProfileField("bio", event.target.value)}
                  placeholder="Sua bio (estilo LinkedIn)"
                  rows={3}
                  className="px-3 py-2.5 rounded-xl border border-gray-200 text-sm md:col-span-2 resize-none"
                />
                <input
                  value={profileForm.cep}
                  onChange={(event) => updateProfileField("cep", event.target.value)}
                  placeholder="CEP"
                  className="px-3 py-2.5 rounded-xl border border-gray-200 text-sm"
                />
                <input
                  value={profileForm.endereco}
                  onChange={(event) => updateProfileField("endereco", event.target.value)}
                  placeholder="Endereco"
                  className="px-3 py-2.5 rounded-xl border border-gray-200 text-sm"
                />
                <input
                  value={profileForm.numero}
                  onChange={(event) => updateProfileField("numero", event.target.value)}
                  placeholder="Numero"
                  className="px-3 py-2.5 rounded-xl border border-gray-200 text-sm"
                />
                <input
                  value={profileForm.complemento}
                  onChange={(event) => updateProfileField("complemento", event.target.value)}
                  placeholder="Complemento"
                  className="px-3 py-2.5 rounded-xl border border-gray-200 text-sm"
                />
                <input
                  value={profileForm.bairro}
                  onChange={(event) => updateProfileField("bairro", event.target.value)}
                  placeholder="Bairro"
                  className="px-3 py-2.5 rounded-xl border border-gray-200 text-sm"
                />
                <input
                  value={profileForm.cidade}
                  onChange={(event) => updateProfileField("cidade", event.target.value)}
                  placeholder="Cidade"
                  className="px-3 py-2.5 rounded-xl border border-gray-200 text-sm"
                />
                <input
                  value={profileForm.uf}
                  onChange={(event) => updateProfileField("uf", event.target.value)}
                  placeholder="UF"
                  className="px-3 py-2.5 rounded-xl border border-gray-200 text-sm"
                />
                <input
                  value={profileForm.estado}
                  onChange={(event) => updateProfileField("estado", event.target.value)}
                  placeholder="Estado"
                  className="px-3 py-2.5 rounded-xl border border-gray-200 text-sm"
                />
              </div>

              {user?.role === "professional" && (
                <div className="mt-4 grid grid-cols-1 gap-3">
                  <div>
                    <p className="text-xs text-gray-500 mb-1.5">Foto profissional</p>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleProfessionalPhotoUpload}
                      className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm"
                    />
                    {profileForm.professionalPhotoUrl && (
                      <div className="mt-2 flex items-center gap-3">
                        <img
                          src={profileForm.professionalPhotoUrl}
                          alt="Preview da foto profissional"
                          className="w-14 h-14 rounded-xl object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => updateProfileField("professionalPhotoUrl", "")}
                          className="text-xs text-red-600 hover:underline"
                        >
                          Remover foto
                        </button>
                      </div>
                    )}
                  </div>
                  <textarea
                    value={profileForm.professionalDescription}
                    onChange={(event) => updateProfileField("professionalDescription", event.target.value)}
                    placeholder="Descricao profissional / bio"
                    rows={4}
                    className="px-3 py-2.5 rounded-xl border border-gray-200 text-sm resize-none"
                  />
                </div>
              )}

              <button
                onClick={saveProfile}
                disabled={savingProfile}
                className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl text-sm disabled:opacity-60"
              >
                {savingProfile ? "Salvando..." : "Salvar perfil"}
              </button>

              {profileSuccess && (
                <p className="text-sm text-green-600 mt-3">Perfil atualizado com sucesso.</p>
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





