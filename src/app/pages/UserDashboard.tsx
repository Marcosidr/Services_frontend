import { type ChangeEvent, useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  AlertCircle,
  CheckCircle,
  ClipboardList,
  Clock,
  CreditCard,
  MessageCircle,
  Star,
  User,
  Wallet
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { getAuthorizationHeader } from "../utils/auth";
import { formatCpf } from "../utils/cpf";
import { fileToOptimizedDataUrl } from "../utils/image";
import { getPasswordValidationError } from "../utils/password";
import { ChatTab } from "./dashboard/ChatTab";
import { OrdersTab } from "./dashboard/OrdersTab";
import { PaymentsTab } from "./dashboard/PaymentsTab";
import { ProfileTab } from "./dashboard/ProfileTab";
import { ReviewsTab } from "./dashboard/ReviewsTab";
import type {
  ApiChatMessage,
  ConversationSummary,
  ConversationsResponse,
  DashboardMessage,
  DashboardOrder,
  DashboardProfessional,
  DashboardResponse,
  DashboardUser,
  MessagesResponse,
  PaymentHistoryItem,
  PaymentMethod,
  ProfileForm,
  RawDashboardOrder,
  Tab
} from "./dashboard/types";
import {
  getOrderCounterpart,
  normalizeChatMessage,
  normalizeOrderStatus,
  parsePositiveInteger
} from "./dashboard/utils";

function UserDashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const { setAuthUser } = useAuth();

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
    email: "",
    cpf: "",
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
    professionalPhotoUrl: "",
    professionalLatitude: "",
    professionalLongitude: "",
    password: "",
    confirmPassword: ""
  });
  const [savingProfile, setSavingProfile] = useState(false);
  const [professionalLocationLoading, setProfessionalLocationLoading] = useState(false);

  const [loading, setLoading] = useState(true);
  const [loadingConversations, setLoadingConversations] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [submittingRating, setSubmittingRating] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [profileError, setProfileError] = useState("");

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
        setLoadError("");

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
          email: nextUser?.email ?? "",
          cpf: nextUser?.cpf ? formatCpf(nextUser.cpf) : "",
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
          bio: typeof nextUser?.bio === "string" ? nextUser.bio : "",
          password: "",
          confirmPassword: ""
        }));
      } catch (err) {
        console.error(err);
        setLoadError("Erro ao carregar os dados do painel.");
      } finally {
        setLoading(false);
      }
    }

    void loadDashboard();
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
          latitude?: number | null;
          longitude?: number | null;
        };

        setProfileForm((prev) => ({
          ...prev,
          professionalDescription:
            typeof data.description === "string" ? data.description : "",
          professionalPhotoUrl:
            typeof data.photo === "string" ? data.photo : prev.professionalPhotoUrl,
          professionalLatitude:
            typeof data.latitude === "number" ? data.latitude.toFixed(6) : "",
          professionalLongitude:
            typeof data.longitude === "number" ? data.longitude.toFixed(6) : ""
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

  const handleUserPhotoUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const dataUrl = await fileToOptimizedDataUrl(file);
      updateProfileField("photoUrl", dataUrl);
      setProfileError("");
    } catch (err) {
      setProfileError(err instanceof Error ? err.message : "Falha ao processar a imagem.");
    } finally {
      event.target.value = "";
    }
  };

  const handleProfessionalPhotoUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const dataUrl = await fileToOptimizedDataUrl(file);
      updateProfileField("professionalPhotoUrl", dataUrl);
      setProfileError("");
    } catch (err) {
      setProfileError(err instanceof Error ? err.message : "Falha ao processar a imagem.");
    } finally {
      event.target.value = "";
    }
  };

  const useCurrentProfessionalLocation = () => {
    setProfileError("");

    if (!("geolocation" in navigator)) {
      setProfileError("Seu navegador nao suporta geolocalizacao.");
      return;
    }

    setProfessionalLocationLoading(true);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        updateProfileField("professionalLatitude", position.coords.latitude.toFixed(6));
        updateProfileField("professionalLongitude", position.coords.longitude.toFixed(6));
        setProfileError("");
        setProfessionalLocationLoading(false);
      },
      () => {
        setProfessionalLocationLoading(false);
        setProfileError("Nao foi possivel obter sua localizacao atual.");
      },
      {
        enableHighAccuracy: true,
        timeout: 10000
      }
    );
  };

  const saveProfile = async () => {
    const normalizedPassword = profileForm.password.trim();
    const normalizedConfirmPassword = profileForm.confirmPassword.trim();

    if (normalizedPassword || normalizedConfirmPassword) {
      if (!normalizedPassword || !normalizedConfirmPassword) {
        setProfileError("Preencha senha e confirmar senha para alterar a senha.");
        return;
      }

      if (normalizedPassword !== normalizedConfirmPassword) {
        setProfileError("As senhas nao coincidem.");
        return;
      }

      const passwordValidationError = getPasswordValidationError(normalizedPassword);
      if (passwordValidationError) {
        setProfileError(passwordValidationError);
        return;
      }
    }

    try {
      setSavingProfile(true);
      setProfileError("");

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
          bio: profileForm.bio,
          password: normalizedPassword,
          confirmPassword: normalizedConfirmPassword
        })
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { message?: string } | null;
        throw new Error(payload?.message || "Nao foi possivel atualizar o perfil.");
      }

      const userData = (await response.json()) as {
        user?: DashboardUser;
      };

      if (userData.user) {
        setUser(userData.user);
        setAuthUser(userData.user);
        setProfileForm((prev) => ({
          ...prev,
          email: userData.user?.email ?? prev.email,
          cpf: userData.user?.cpf ? formatCpf(userData.user.cpf) : prev.cpf
        }));
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
            photoUrl: profileForm.professionalPhotoUrl || profileForm.photoUrl,
            latitude: profileForm.professionalLatitude.trim(),
            longitude: profileForm.professionalLongitude.trim()
          })
        });

        if (!professionalResponse.ok) {
          const payload = (await professionalResponse.json().catch(() => null)) as
            | { message?: string }
            | null;
          throw new Error(payload?.message || "Perfil do profissional nao foi atualizado.");
        }
      }

      setProfileForm((prev) => ({
        ...prev,
        password: "",
        confirmPassword: ""
      }));
      setProfileSuccess(true);
      setTimeout(() => setProfileSuccess(false), 2000);
    } catch (err) {
      console.error(err);
      setProfileError(err instanceof Error ? err.message : "Erro ao salvar perfil.");
    } finally {
      setSavingProfile(false);
    }
  };

  const showChatFromOrder = (order: DashboardOrder) => {
    const counterpart = getOrderCounterpart(order, isProfessionalDashboard);
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

if (loadError) {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
      <div className="bg-white border border-red-100 rounded-2xl shadow-sm p-8 max-w-md w-full text-center">
        <AlertCircle className="w-10 h-10 text-red-500 mx-auto mb-4" />

        <h2 className="text-slate-900 text-lg mb-2">
          Falha ao carregar
        </h2>

        <p className="text-slate-500 text-sm mb-5">
          {loadError}
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
          <OrdersTab
            orders={orders}
            userRole={user?.role}
            onOpenRatingModal={openRatingModal}
            onShowChatFromOrder={showChatFromOrder}
            onCancelOrder={handleCancelOrder}
            onAcceptOrder={handleAcceptOrder}
            onRejectOrder={handleRejectOrder}
            onCompleteOrder={handleCompleteOrder}
            ratingSuccess={ratingSuccess}
          />
        )}

        {activeTab === "chat" && (
          <ChatTab
            conversationSearch={conversationSearch}
            onConversationSearchChange={setConversationSearch}
            loadingConversations={loadingConversations}
            filteredConversations={filteredConversations}
            activeChatProfessional={activeChatProfessional}
            deletingConversationId={deletingConversationId}
            onOpenConversation={openConversation}
            onDeleteConversation={deleteConversation}
            conversations={conversations}
            loadingMessages={loadingMessages}
            messages={messages}
            onDeleteMessage={deleteMessage}
            deletingMessageId={deletingMessageId}
            messagesEndRef={messagesEndRef}
            chatMessage={chatMessage}
            onChatMessageChange={setChatMessage}
            onSendMessage={sendMessage}
            sendingMessage={sendingMessage}
          />
        )}

        {activeTab === "avaliacoes" && (
          <ReviewsTab
            isProfessionalDashboard={isProfessionalDashboard}
            completedOrders={completedOrders}
            ratings={ratings}
            onSelectRating={(orderId, rating) => {
              setRatings((prev) => ({
                ...prev,
                [orderId]: rating
              }));
            }}
            onOpenRatingModal={openRatingModal}
          />
        )}

        {activeTab === "perfil" && (
          <ProfileTab
            userRole={user?.role}
            profileForm={profileForm}
            onUpdateField={updateProfileField}
            onUserPhotoUpload={handleUserPhotoUpload}
            onProfessionalPhotoUpload={handleProfessionalPhotoUpload}
            onUseCurrentProfessionalLocation={useCurrentProfessionalLocation}
            professionalLocationLoading={professionalLocationLoading}
            onSaveProfile={saveProfile}
            savingProfile={savingProfile}
            profileSuccess={profileSuccess}
            profileError={profileError}
          />
        )}

        {activeTab === "pagamento" && (
          <PaymentsTab paymentMethods={paymentMethods} paymentHistory={paymentHistory} />
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
                onClick={() => void submitRating(ratingModal)}
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







