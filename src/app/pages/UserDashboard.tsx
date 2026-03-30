import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  ClipboardList,
  MessageCircle,
  Star,
  CreditCard,
  Wallet,
  Search,
  Trash2,
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
  conversationId?: string;
}

interface DashboardOrder {
  id: string;
  requesterId?: string;
  requesterName?: string;
  requesterPhoto?: string;
  professionalId: string;
  professionalName: string;
  professionalPhoto?: string;
  professional?: DashboardProfessional;
  category: string;
  description?: string | null;
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
  const [conversationSearch, setConversationSearch] = useState("");
  const [deletingConversationId, setDeletingConversationId] = useState<string | null>(null);
  const [deletingMessageId, setDeletingMessageId] = useState<string | null>(null);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

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
    { id: "avaliacoes", label: "Avaliacoes", icon: Star },
    { id: "pagamento", label: "Pagamento", icon: CreditCard },
    { id: "perfil", label: "Perfil", icon: User }
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
          throw new Error("Nao foi possivel carregar o painel do usuario.");
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

  const isProfessionalDashboard = user?.role === "professional";

  function getOrderCounterpart(order: DashboardOrder) {
    if (isProfessionalDashboard) {
      return {
        id: order.requesterId ?? "",
        name: order.requesterName ?? "Cliente",
        photo: order.requesterPhoto ?? ""
      };
    }

    return {
      id: order.professionalId,
      name: order.professionalName,
      photo: order.professional?.photo ?? order.professionalPhoto ?? ""
    };
  }

  const dashboardHighlights: {
    label: string;
    value: string;
    icon: typeof CheckCircle;
    tone: string;
    softBg: string;
  }[] = [
    {
      label: "Servicos concluidos",
      value: String(completedOrders.length),
      icon: CheckCircle,
      tone: "text-emerald-700",
      softBg: "bg-emerald-50"
    },
    {
      label: "Em andamento",
      value: String(inProgressOrders.length),
      icon: Clock,
      tone: "text-sky-700",
      softBg: "bg-sky-50"
    },
    {
      label: isProfessionalDashboard ? "Total recebido" : "Total gasto",
      value: `R$ ${totalSpent.toFixed(2)}`,
      icon: Wallet,
      tone: "text-slate-800",
      softBg: "bg-white"
    }
  ];

  const filteredConversations = useMemo(() => {
    const term = conversationSearch.trim().toLowerCase();
    if (!term) return conversations;

    return conversations.filter((conversation) => {
      const otherUserName = conversation.otherUserName.toLowerCase();
      const lastMessageText = conversation.lastMessage.text.toLowerCase();
      return otherUserName.includes(term) || lastMessageText.includes(term);
    });
  }, [conversationSearch, conversations]);

  useEffect(() => {
    if (!messagesEndRef.current) return;
    messagesEndRef.current.scrollIntoView({
      behavior: "smooth",
      block: "end"
    });
  }, [messages, activeChatProfessional?.id]);

  const activeRatingOrder = useMemo(() => {
    if (!ratingModal) return null;
    return orders.find((order) => order.id === ratingModal) ?? null;
  }, [orders, ratingModal]);

  const loadConversationMessages = async (withUserId: number) => {
    try {
      setLoadingMessages(true);

      const response = await fetch(`/api/messages?withUserId=${withUserId}&limit=100`, {
        headers: {
          ...getAuthorizationHeader()
        }
      });

      if (!response.ok) {
        setMessages([]);
        return;
      }

      const data = (await response.json()) as MessagesResponse;
      const normalizedMessages = Array.isArray(data.items)
        ? data.items.map((message) => normalizeChatMessage(message))
        : [];

      setMessages(normalizedMessages);
    } finally {
      setLoadingMessages(false);
    }
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
      const selectedConversationId =
        selectedConversation?.conversationId || activeChatProfessional?.conversationId;

      setActiveChatProfessional({
        id: String(nextUserId),
        name: selectedUserName,
        photo: selectedUserPhoto,
        categoryLabel: "Mensagem direta",
        online: false,
        conversationId: selectedConversationId
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
    withUserPhoto = "",
    conversationId = ""
  ) => {
    setActiveChatProfessional({
      id: String(withUserId),
      name: withUserName || `Conversa #${withUserId}`,
      photo: withUserPhoto,
      categoryLabel: "Mensagem direta",
      online: false,
      conversationId: conversationId || undefined
    });
    setMessages([]);
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
        throw new Error("Nao foi possivel enviar a mensagem.");
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

  const deleteConversation = async (conversation: ConversationSummary) => {
    if (deletingConversationId) return;

    const confirmed = window.confirm(
      `Apagar a conversa com ${conversation.otherUserName}? Esta acao remove todas as mensagens.`
    );
    if (!confirmed) return;

    try {
      setDeletingConversationId(conversation.conversationId);

      const response = await fetch(`/api/messages/conversations/with-user/${conversation.otherUserId}`, {
        method: "DELETE",
        headers: {
          ...getAuthorizationHeader()
        }
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { message?: string } | null;
        throw new Error(payload?.message || "Falha ao apagar conversa.");
      }

      const isActiveConversation =
        activeChatProfessional?.conversationId === conversation.conversationId ||
        activeChatProfessional?.id === String(conversation.otherUserId);

      setConversations((prev) =>
        prev.filter((item) => item.conversationId !== conversation.conversationId)
      );

      if (isActiveConversation) {
        setActiveChatProfessional(null);
        setMessages([]);
      }

      await loadConversations();
    } catch (err) {
      console.error(err);
      const message = err instanceof Error ? err.message : "Nao foi possivel apagar a conversa.";
      window.alert(message);
    } finally {
      setDeletingConversationId(null);
    }
  };

  const deleteMessage = async (message: DashboardMessage) => {
    if (!activeChatProfessional?.id) return;
    if (!/^\d+$/.test(message.id)) return;
    if (deletingMessageId) return;

    const confirmed = window.confirm("Apagar esta mensagem?");
    if (!confirmed) return;

    try {
      setDeletingMessageId(message.id);

      const response = await fetch(`/api/messages/${message.id}`, {
        method: "DELETE",
        headers: {
          ...getAuthorizationHeader()
        }
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { message?: string } | null;
        throw new Error(payload?.message || "Falha ao apagar mensagem.");
      }

      setMessages((prev) => prev.filter((currentMessage) => currentMessage.id !== message.id));

      const activeRecipientId = parsePositiveInteger(activeChatProfessional.id);
      if (activeRecipientId) {
        await loadConversations(
          activeRecipientId,
          activeChatProfessional.name,
          activeChatProfessional.photo ?? ""
        );
      } else {
        await loadConversations();
      }
    } catch (err) {
      console.error(err);
      const messageText = err instanceof Error ? err.message : "Nao foi possivel apagar a mensagem.";
      window.alert(messageText);
    } finally {
      setDeletingMessageId(null);
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
        throw new Error("Nao foi possivel enviar a avaliacao.");
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
        throw new Error("Nao foi possivel cancelar o pedido.");
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

  const handleAcceptOrder = async (orderId: string) => {
    try {
      const response = await fetch(`/api/dashboard/orders/${orderId}/accept`, {
        method: "POST",
        headers: {
          ...getAuthorizationHeader()
        }
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { message?: string } | null;
        throw new Error(payload?.message || "Nao foi possivel aceitar o pedido.");
      }

      setOrders((prev) =>
        prev.map((order) =>
          order.id === orderId ? { ...order, status: "em andamento" } : order
        )
      );
    } catch (err) {
      console.error(err);
      window.alert(err instanceof Error ? err.message : "Falha ao aceitar pedido.");
    }
  };

  const handleRejectOrder = async (orderId: string) => {
    try {
      const response = await fetch(`/api/dashboard/orders/${orderId}/reject`, {
        method: "POST",
        headers: {
          ...getAuthorizationHeader()
        }
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { message?: string } | null;
        throw new Error(payload?.message || "Nao foi possivel recusar o pedido.");
      }

      setOrders((prev) =>
        prev.map((order) =>
          order.id === orderId ? { ...order, status: "cancelado" } : order
        )
      );
    } catch (err) {
      console.error(err);
      window.alert(err instanceof Error ? err.message : "Falha ao recusar pedido.");
    }
  };

  const handleCompleteOrder = async (orderId: string) => {
    try {
      const response = await fetch(`/api/dashboard/orders/${orderId}/complete`, {
        method: "POST",
        headers: {
          ...getAuthorizationHeader()
        }
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { message?: string } | null;
        throw new Error(payload?.message || "Nao foi possivel finalizar atendimento.");
      }

      setOrders((prev) =>
        prev.map((order) =>
          order.id === orderId ? { ...order, status: "concluido" } : order
        )
      );
    } catch (err) {
      console.error(err);
      window.alert(err instanceof Error ? err.message : "Falha ao finalizar atendimento.");
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
    const counterpart = getOrderCounterpart(order);
    const targetUserId = parsePositiveInteger(counterpart.id);
    if (!targetUserId) return;

    const counterpartName = counterpart.name;
    const counterpartPhoto = counterpart.photo;
    const existingConversationId =
      conversations.find((item) => item.otherUserId === targetUserId)?.conversationId ?? "";

    void openConversation(
      targetUserId,
      counterpartName,
      counterpartPhoto,
      existingConversationId
    );
    void loadConversations(targetUserId, counterpartName, counterpartPhoto);
  };

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const chatWith = parsePositiveInteger(params.get("chatWith"));
    const chatName = (params.get("chatName") ?? "").trim();
    const tabParam = (params.get("tab") ?? "").trim();

    if (
      tabParam === "pedidos" ||
      tabParam === "chat" ||
      tabParam === "avaliacoes" ||
      tabParam === "pagamento" ||
      tabParam === "perfil"
    ) {
      setActiveTab(tabParam);
    }

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
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
        <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-sm text-center">
          <p className="text-slate-700" style={{ fontWeight: 600 }}>
            Carregando painel...
          </p>
          <p className="mt-1 text-sm text-slate-500">
            Estamos preparando pedidos, chat e avaliacoes.
          </p>
        </div>
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
          className="bg-slate-900 hover:bg-slate-800 text-white px-5 py-2.5 rounded-xl transition-colors"
        >
          Tentar novamente
        </button>
      </div>
    </div>
  );
}

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_right,_#fef3c7_0%,_transparent_32%),radial-gradient(circle_at_bottom_left,_#bfdbfe_0%,_transparent_38%),#f8fafc] pb-10">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-8">
        <section className="relative overflow-hidden rounded-3xl border border-slate-200 bg-gradient-to-r from-slate-900 via-slate-800 to-cyan-900 text-white shadow-xl">
          <div className="absolute -right-14 -top-14 h-40 w-40 rounded-full bg-cyan-300/20 blur-2xl" />
          <div className="absolute -left-10 -bottom-10 h-32 w-32 rounded-full bg-amber-200/20 blur-2xl" />

          <div className="relative px-5 py-6 sm:px-8 sm:py-8">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-4">
                {user?.photo ? (
                  <img
                    src={user.photo}
                    alt={user.name}
                    className="h-14 w-14 rounded-2xl object-cover ring-2 ring-white/20"
                    loading="lazy"
                  />
                ) : (
                  <div className="h-14 w-14 rounded-2xl bg-white/15 flex items-center justify-center">
                    <User className="h-7 w-7 text-white" />
                  </div>
                )}

                <div>
                  <h1 className="text-2xl text-white" style={{ fontWeight: 700 }}>
                    Ola, {user?.name || "usuario"}!
                  </h1>
                  <p className="text-sm text-slate-200">
                    Seu painel com pedidos, mensagens e avaliacoes
                  </p>
                </div>
              </div>

              <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs text-slate-100">
                <span className="h-2 w-2 rounded-full bg-emerald-300" />
                Conta ativa
              </div>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
              {dashboardHighlights.map((item) => {
                const Icon = item.icon;
                return (
                  <div
                    key={item.label}
                    className="rounded-2xl border border-white/10 bg-white/95 p-4 text-slate-900 shadow-sm transition-transform hover:-translate-y-0.5"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-xs uppercase tracking-wide text-slate-500">
                          {item.label}
                        </p>
                        <p className={`mt-1 text-xl ${item.tone}`} style={{ fontWeight: 700 }}>
                          {item.value}
                        </p>
                      </div>
                      <div className={`rounded-xl p-2.5 ${item.softBg}`}>
                        <Icon className={`h-5 w-5 ${item.tone}`} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      </div>

      <div className="sticky top-16 z-20 mt-5">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="flex gap-2 overflow-x-auto rounded-2xl border border-slate-200 bg-white/90 p-2 shadow-sm backdrop-blur">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm whitespace-nowrap transition-all ${
                  activeTab === tab.id
                    ? "bg-slate-900 text-white shadow-sm"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
        {activeTab === "pedidos" && (
          <div className="space-y-4">
            {orders.length === 0 ? (
              <div className="rounded-2xl border border-slate-200 bg-white/95 p-8 text-center text-slate-500 shadow-sm">
                Nenhum pedido encontrado.
              </div>
            ) : (
              orders.map((order) => {
                const config = statusConfig[order.status];
                const StatusIcon = config.icon;
                const counterpart = getOrderCounterpart(order);
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
                          <p
                            className="text-gray-900 truncate"
                            style={{ fontWeight: 600 }}
                          >
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
                          {order.category} |{" "}
                          {new Date(order.date).toLocaleDateString("pt-BR")}
                        </p>

                        {order.description ? (
                          <p className="mt-1 text-xs text-slate-500 line-clamp-2">
                            {order.description}
                          </p>
                        ) : null}

                        <p
                          className="mt-1 text-sm text-slate-900"
                          style={{ fontWeight: 600 }}
                        >
                          R$ {order.price.toFixed(2)}
                        </p>
                      </div>
                    </div>

                    {!isProfessionalDashboard && order.status === "concluido" && !hasRating && (
                      <button
                        onClick={() => openRatingModal(order.id)}
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
                             i < (order.rating ?? 0)
                                ? "text-yellow-400 fill-yellow-400"
                                : "text-gray-200"
                            }`}
                          />
                        ))}
                        <span className="ml-1 text-xs text-slate-400">
                          Sua avaliacao
                        </span>
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
                          onClick={() => showChatFromOrder(order)}
                          className="flex-1 flex items-center justify-center gap-1 rounded-xl border border-slate-200 bg-slate-50 py-2.5 text-sm text-slate-700 transition-colors hover:bg-slate-100"
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                          Chat
                        </button>

                        <button
                          onClick={() => handleCancelOrder(order.id)}
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
                          onClick={() => void handleAcceptOrder(order.id)}
                          className="flex-1 flex items-center justify-center gap-1 rounded-xl border border-emerald-200 bg-emerald-50 py-2.5 text-sm text-emerald-700 transition-colors hover:bg-emerald-100"
                        >
                          <CheckCircle className="w-3.5 h-3.5" />
                          Aceitar
                        </button>
                        <button
                          onClick={() => void handleRejectOrder(order.id)}
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
                          onClick={() => showChatFromOrder(order)}
                          className="flex-1 flex items-center justify-center gap-1 rounded-xl border border-slate-200 bg-slate-50 py-2.5 text-sm text-slate-700 transition-colors hover:bg-slate-100"
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                          Chat
                        </button>
                        <button
                          onClick={() => void handleCompleteOrder(order.id)}
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
        )}

        {activeTab === "chat" && (
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white/95 shadow-sm">
            <div className="grid min-h-[34rem] grid-cols-1 md:grid-cols-[300px,1fr]">
              <aside className="border-b border-slate-200 bg-slate-50/70 md:border-b-0 md:border-r">
                <div className="border-b border-slate-200 bg-white px-3 py-3">
                  <p className="text-sm text-slate-800" style={{ fontWeight: 600 }}>
                    Conversas
                  </p>
                  <div className="mt-2 relative">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={conversationSearch}
                      onChange={(event) => setConversationSearch(event.target.value)}
                      placeholder="Buscar conversa..."
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-sm text-slate-700 outline-none focus:border-slate-400"
                    />
                  </div>
                </div>

                <div className="max-h-[30rem] overflow-y-auto">
                  {loadingConversations ? (
                    <p className="px-4 py-4 text-sm text-slate-500">Carregando conversas...</p>
                  ) : filteredConversations.length === 0 ? (
                    <p className="px-4 py-4 text-sm text-slate-500">
                      {conversationSearch.trim()
                        ? "Nenhuma conversa encontrada."
                        : "Voce ainda nao possui conversas."}
                    </p>
                  ) : (
                    filteredConversations.map((conversation) => {
                      const isActive =
                        activeChatProfessional?.conversationId === conversation.conversationId ||
                        activeChatProfessional?.id === String(conversation.otherUserId);
                      const deletingCurrent =
                        deletingConversationId === conversation.conversationId;

                      return (
                        <div
                          key={conversation.conversationId}
                          className={`border-b border-slate-100 ${
                            isActive ? "bg-slate-100/80" : "hover:bg-white"
                          }`}
                        >
                          <div className="flex items-center gap-2 px-2 py-2">
                            <button
                              type="button"
                              onClick={() =>
                                void openConversation(
                                  conversation.otherUserId,
                                  conversation.otherUserName,
                                  conversation.otherUserPhoto ?? "",
                                  conversation.conversationId
                                )
                              }
                              className="flex flex-1 items-start gap-3 rounded-xl px-2 py-2 text-left transition-colors hover:bg-white"
                            >
                              {conversation.otherUserPhoto ? (
                                <img
                                  src={conversation.otherUserPhoto}
                                  alt={conversation.otherUserName}
                                  className="h-10 w-10 rounded-full object-cover ring-1 ring-slate-200"
                                  loading="lazy"
                                />
                              ) : (
                                <div
                                  className={`h-10 w-10 rounded-full flex items-center justify-center ${
                                    isActive
                                      ? "bg-slate-200 text-slate-700"
                                      : "bg-slate-200 text-slate-500"
                                  }`}
                                >
                                  <User className="w-4 h-4" />
                                </div>
                              )}

                              <div className="min-w-0 flex-1">
                                <div className="flex items-center justify-between gap-2">
                                  <p
                                    className="truncate text-sm text-slate-800"
                                    style={{ fontWeight: isActive ? 700 : 600 }}
                                  >
                                    {conversation.otherUserName}
                                  </p>
                                  <span className="flex-shrink-0 text-[11px] text-slate-400">
                                    {conversation.lastMessage.time ??
                                      new Date(
                                        conversation.lastMessage.createdAt ?? Date.now()
                                      ).toLocaleTimeString("pt-BR", {
                                        hour: "2-digit",
                                        minute: "2-digit"
                                      })}
                                  </span>
                                </div>

                                <div className="mt-0.5 flex items-center gap-2">
                                  <p className="flex-1 truncate text-xs text-slate-500">
                                    {conversation.lastMessage.text}
                                  </p>
                                  {conversation.unreadCount > 0 && (
                                    <span className="flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-slate-900 px-1 text-[10px] text-white">
                                      {conversation.unreadCount > 9 ? "9+" : conversation.unreadCount}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </button>

                            <button
                              type="button"
                              onClick={() => void deleteConversation(conversation)}
                              disabled={deletingCurrent}
                              className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                              title="Apagar conversa"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </aside>

              <section className="flex min-h-[34rem] flex-col">
                <div className="flex items-center gap-3 border-b border-slate-200 bg-gradient-to-r from-slate-900 to-cyan-900 p-4 text-white">
                  {activeChatProfessional?.photo ? (
                    <img
                      src={activeChatProfessional.photo}
                      alt={activeChatProfessional.name}
                      className="h-9 w-9 rounded-full object-cover ring-1 ring-white/20"
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
                    <p className="text-xs text-slate-200">
                      {activeChatProfessional
                        ? "Conversa ativa"
                        : "Escolha uma conversa na lista ao lado"}
                    </p>
                  </div>

                  {activeChatProfessional?.id && (
                    <button
                      type="button"
                      onClick={() => {
                        const currentConversation = conversations.find(
                          (conversation) =>
                            String(conversation.otherUserId) === activeChatProfessional.id
                        );
                        if (currentConversation) {
                          void deleteConversation(currentConversation);
                        }
                      }}
                      className="ml-auto rounded-lg p-2 text-slate-200 transition-colors hover:bg-white/10 hover:text-white"
                      title="Apagar conversa"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>

                <div className="h-80 flex-1 overflow-y-auto bg-[linear-gradient(180deg,#f8fafc_0%,#f1f5f9_100%)] p-4">
                  {!activeChatProfessional ? (
                    <p className="mt-8 text-center text-sm text-slate-500">
                      Selecione uma conversa para comecar.
                    </p>
                  ) : loadingMessages ? (
                    <p className="mt-8 text-center text-sm text-slate-500">
                      Carregando mensagens...
                    </p>
                  ) : messages.length === 0 ? (
                    <p className="mt-8 text-center text-sm text-slate-500">
                      Nenhuma mensagem ainda.
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {messages.map((msg) => (
                        <div
                          key={msg.id}
                          className={`flex items-end gap-1 ${
                            msg.sender === "user" ? "justify-end" : "justify-start"
                          }`}
                        >
                          <div
                            className={`max-w-xl rounded-2xl px-4 py-2.5 text-sm shadow-sm ${
                              msg.sender === "user"
                                ? "rounded-br-sm bg-slate-900 text-white"
                                : "rounded-bl-sm bg-white text-slate-700"
                            }`}
                          >
                            <p>{msg.text}</p>
                            <p
                              className={`text-xs mt-1 ${
                                msg.sender === "user"
                                  ? "text-slate-300"
                                  : "text-slate-400"
                              }`}
                            >
                              {msg.time}
                            </p>
                          </div>

                          {msg.sender === "user" && /^\d+$/.test(msg.id) && (
                            <button
                              type="button"
                              onClick={() => void deleteMessage(msg)}
                              disabled={deletingMessageId === msg.id}
                              className="mb-0.5 rounded-md p-1.5 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                              title="Apagar mensagem"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                      ))}
                      <div ref={messagesEndRef} />
                    </div>
                  )}
                </div>

                <div className="flex gap-2 border-t border-slate-200 bg-white p-3">
                  <input
                    type="text"
                    value={chatMessage}
                    onChange={(e) => setChatMessage(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                    placeholder="Digite uma mensagem..."
                    disabled={!activeChatProfessional || sendingMessage || loadingMessages}
                    className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none transition focus:border-slate-400 disabled:opacity-60"
                  />

                  <button
                    onClick={sendMessage}
                    disabled={!activeChatProfessional || sendingMessage || loadingMessages}
                    className="rounded-xl bg-slate-900 p-2.5 text-white transition-colors hover:bg-slate-800 disabled:opacity-60"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </section>
            </div>
          </div>
        )}

        {activeTab === "avaliacoes" && (
          <div className="space-y-4">
            <div className="rounded-2xl border border-slate-200 bg-white/95 p-5 shadow-sm">
              <h3 className="mb-1 text-slate-900">Suas avaliacoes</h3>
              <p className="mb-4 text-sm text-slate-500">
                Avalie os atendimentos concluidos.
              </p>

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
                        <p
                          className="text-sm text-slate-800"
                          style={{ fontWeight: 600 }}
                        >
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
                              onClick={() =>
                                setRatings((prev) => ({
                                  ...prev,
                                  [order.id]: i + 1
                                }))
                              }
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
                              onClick={() => openRatingModal(order.id)}
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
        )}

        {activeTab === "perfil" && (
          <div className="space-y-4">
            <div className="rounded-2xl border border-slate-200 bg-white/95 p-5 shadow-sm">
              <h3 className="mb-1 text-slate-900">Editar perfil</h3>
              <p className="mb-4 text-sm text-slate-500">
                Atualize foto, bio e endereco do seu perfil.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <input
                  value={profileForm.name}
                  onChange={(event) => updateProfileField("name", event.target.value)}
                  placeholder="Nome"
                  className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-slate-400"
                />
                <input
                  value={profileForm.phone}
                  onChange={(event) => updateProfileField("phone", event.target.value)}
                  placeholder="Telefone"
                  className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-slate-400"
                />
                <div className="md:col-span-2">
                  <p className="mb-1.5 text-xs text-slate-500">Foto de perfil</p>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleUserPhotoUpload}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
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
                  className="resize-none rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-slate-400 md:col-span-2"
                />
                <input
                  value={profileForm.cep}
                  onChange={(event) => updateProfileField("cep", event.target.value)}
                  placeholder="CEP"
                  className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-slate-400"
                />
                <input
                  value={profileForm.endereco}
                  onChange={(event) => updateProfileField("endereco", event.target.value)}
                  placeholder="Endereco"
                  className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-slate-400"
                />
                <input
                  value={profileForm.numero}
                  onChange={(event) => updateProfileField("numero", event.target.value)}
                  placeholder="Numero"
                  className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-slate-400"
                />
                <input
                  value={profileForm.complemento}
                  onChange={(event) => updateProfileField("complemento", event.target.value)}
                  placeholder="Complemento"
                  className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-slate-400"
                />
                <input
                  value={profileForm.bairro}
                  onChange={(event) => updateProfileField("bairro", event.target.value)}
                  placeholder="Bairro"
                  className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-slate-400"
                />
                <input
                  value={profileForm.cidade}
                  onChange={(event) => updateProfileField("cidade", event.target.value)}
                  placeholder="Cidade"
                  className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-slate-400"
                />
                <input
                  value={profileForm.uf}
                  onChange={(event) => updateProfileField("uf", event.target.value)}
                  placeholder="UF"
                  className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-slate-400"
                />
                <input
                  value={profileForm.estado}
                  onChange={(event) => updateProfileField("estado", event.target.value)}
                  placeholder="Estado"
                  className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-slate-400"
                />
              </div>

              {user?.role === "professional" && (
                <div className="mt-4 grid grid-cols-1 gap-3">
                  <div>
                    <p className="mb-1.5 text-xs text-slate-500">Foto profissional</p>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleProfessionalPhotoUpload}
                      className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
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
                    className="resize-none rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-slate-400"
                  />
                </div>
              )}

              <button
                onClick={saveProfile}
                disabled={savingProfile}
                className="mt-4 rounded-xl bg-slate-900 px-4 py-2.5 text-sm text-white transition-colors hover:bg-slate-800 disabled:opacity-60"
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
          <div className="space-y-4">
            <div className="rounded-2xl border border-slate-200 bg-white/95 p-5 shadow-sm">
              <h3 className="mb-4 text-slate-900">Formas de pagamento</h3>

              <div className="flex flex-col gap-3">
                {paymentMethods.length === 0 ? (
                  <p className="text-sm text-slate-500">
                    Nenhuma forma de pagamento cadastrada.
                  </p>
                ) : (
                  paymentMethods.map((method) => (
                    <div
                      key={method.id}
                      className={`flex items-center gap-3 rounded-xl border p-3 ${
                        method.active
                          ? "border-cyan-200 bg-cyan-50"
                          : "border-slate-200"
                      }`}
                    >
                      <span className="text-2xl">{method.icon || "CARD"}</span>

                      <div className="flex-1">
                        <p
                          className="text-sm text-slate-800"
                          style={{ fontWeight: 600 }}
                        >
                          {method.type}
                        </p>
                        <p className="text-xs text-slate-500">
                          {method.description}
                        </p>
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
                  <p className="text-sm text-slate-500">
                    Nenhum pagamento encontrado.
                  </p>
                ) : (
                  paymentHistory.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between border-b border-slate-100 py-2 last:border-0"
                    >
                      <div>
                        <p className="text-sm text-slate-800">
                          {item.professionalName}
                        </p>
                        <p className="text-xs text-slate-400">
                          {new Date(item.date).toLocaleDateString("pt-BR")} |{" "}
                          {item.method}
                        </p>
                      </div>

                      <div className="text-right">
                        <p
                          className={`text-sm ${
                            item.status.toLowerCase() === "cancelado"
                              ? "text-red-500"
                              : "text-slate-800"
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
        )}
      </div>

      {ratingModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
            <h3 className="mb-1 text-slate-900">Como foi o servico?</h3>
            <p className="mb-4 text-xs text-slate-500">
              {activeRatingOrder
                ? `Avaliando: ${activeRatingOrder.professionalName}`
                : "Selecione a nota e envie sua avaliacao."}
            </p>

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
              placeholder="Deixe um comentario (opcional)..."
              className="mb-4 w-full resize-none rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-slate-400"
            />

            <div className="flex gap-2">
              <button
                onClick={() => setRatingModal(null)}
                className="flex-1 rounded-xl border border-slate-200 py-2.5 text-sm text-slate-500"
              >
                Cancelar
              </button>

              <button
                onClick={() => submitRating(ratingModal)}
                disabled={!ratings[ratingModal] || submittingRating}
                className="flex-1 rounded-xl bg-slate-900 py-2.5 text-sm text-white transition-colors hover:bg-slate-800 disabled:opacity-60"
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






