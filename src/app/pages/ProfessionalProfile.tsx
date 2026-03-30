import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router";
import {
  Star,
  MapPin,
  CheckCircle,
  Phone,
  MessageCircle,
  Calendar,
  Zap,
  ChevronLeft,
  Shield,
  Clock,
  Award,
  X,
} from "lucide-react";
import { getAuthorizationHeader, isAuthenticated } from "../utils/auth";

interface Review {
  id: string | number;
  user: string;
  userPhoto?: string;
  rating: number;
  date: string;
  text: string;
}

interface Message {
  id: string;
  sender: "user" | "professional";
  text: string;
  time: string;
}

type ApiMessage = {
  id: string;
  sender: "user" | "professional";
  text: string;
  time?: string;
  createdAt?: string;
};

type MessagesResponse = {
  items?: ApiMessage[];
};

interface Professional {
  id: string;
  name: string;
  photo: string;
  online: boolean;
  verified: boolean;
  categoryLabel: string;
  rating: number;
  reviews: number;
  city: string;
  distance: number;
  completedJobs: number;
  area: number;
  description: string;
  tags: string[];
  price: number;
  priceUnit: string;
  phone: string;
  reviewList?: Review[];
}

  function ProfessionalProfile() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [showChat, setShowChat] = useState(false);
  const [chatMessage, setChatMessage] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [chatError, setChatError] = useState("");
  const [sendingMessage, setSendingMessage] = useState(false);
  const [showBooking, setShowBooking] = useState(false);
  const [bookingType, setBookingType] = useState<"imediato" | "agendar">("imediato");
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [bookingSuccess, setBookingSuccess] = useState(false);

  const [pro, setPro] = useState<Professional | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadProfessional() {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(`/api/professionals/${id}`);

        if (!response.ok) {
          throw new Error("Não foi possível carregar o profissional.");
        }

        const data: Professional = await response.json();
        setPro(data);
      } catch (err) {
        console.error(err);
        setError("Erro ao carregar os dados do profissional.");
      } finally {
        setLoading(false);
      }
    }

    if (id) {
      loadProfessional();
    } else {
      setLoading(false);
      setError("ID do profissional não informado.");
    }
  }, [id]);

  const sendMessage = async () => {
    if (!isAuthenticated()) {
      navigate("/login");
      return;
    }

    if (!pro?.id || !chatMessage.trim()) return;

    try {
      setSendingMessage(true);
      setChatError("");

      const response = await fetch("/api/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getAuthorizationHeader(),
        },
        body: JSON.stringify({
          recipientId: Number(pro.id),
          text: chatMessage.trim(),
        }),
      });

      if (!response.ok) {
        throw new Error("Nao foi possivel enviar a mensagem.");
      }

      const savedMessage = (await response.json()) as ApiMessage;

      setMessages((prev) => [
        ...prev,
        {
          id: savedMessage.id,
          sender: savedMessage.sender,
          text: savedMessage.text,
          time:
            savedMessage.time ??
            new Date(savedMessage.createdAt ?? Date.now()).toLocaleTimeString("pt-BR", {
              hour: "2-digit",
              minute: "2-digit",
            }),
        },
      ]);
      setChatMessage("");
    } catch (err) {
      console.error(err);
      setChatError("Erro ao enviar mensagem.");
    } finally {
      setSendingMessage(false);
    }
  };

  useEffect(() => {
    async function loadConversation() {
      if (!showChat || !pro?.id || !isAuthenticated()) return;

      try {
        setChatError("");

        const response = await fetch(`/api/messages?withUserId=${pro.id}&limit=100`, {
          headers: {
            ...getAuthorizationHeader(),
          },
        });

        if (!response.ok) return;

        const data = (await response.json()) as MessagesResponse;
        const normalizedMessages = Array.isArray(data.items)
          ? data.items.map((msg) => ({
              id: msg.id,
              sender: msg.sender,
              text: msg.text,
              time:
                msg.time ??
                new Date(msg.createdAt ?? Date.now()).toLocaleTimeString("pt-BR", {
                  hour: "2-digit",
                  minute: "2-digit",
                }),
            }))
          : [];

        setMessages(normalizedMessages);
      } catch (err) {
        console.error(err);
      }
    }

    void loadConversation();
  }, [showChat, pro?.id]);

  const handleBooking = () => {
    setBookingSuccess(true);

    setTimeout(() => {
      setShowBooking(false);
      setBookingSuccess(false);
      setSelectedDate("");
      setSelectedTime("");
      setBookingType("imediato");
    }, 2500);
  };

  const stars = Array.from({ length: 5 }, (_, i) => i + 1);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">Carregando profissional...</p>
      </div>
    );
  }

  if (error || !pro) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4">
        <p className="text-red-500 mb-4">{error || "Profissional não encontrado."}</p>
        <button
          onClick={() => navigate(-1)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl transition-colors"
        >
          Voltar
        </button>
      </div>
    );
  }

  const reviews = pro.reviewList ?? [];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-100 sticky top-16 z-30">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-3 flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-gray-600" />
          </button>
          <span className="text-gray-700">Perfil do Profissional</span>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 flex flex-col gap-4">
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-start gap-4">
                <div className="relative">
                  <img
                    src={pro.photo}
                    alt={pro.name}
                    className="w-20 h-20 rounded-2xl object-cover"
                  />
                  {pro.online && (
                    <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-2 border-white flex items-center justify-center">
                      <div className="w-2 h-2 bg-white rounded-full" />
                    </div>
                  )}
                </div>

                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h1 className="text-gray-900">{pro.name}</h1>

                    {pro.verified && (
                      <span className="flex items-center gap-1 bg-blue-50 text-blue-600 text-xs px-2 py-0.5 rounded-full">
                        <CheckCircle className="w-3 h-3" />
                        Verificado
                      </span>
                    )}
                  </div>

                  <p className="text-gray-500 mt-0.5">{pro.categoryLabel}</p>

                  <div className="flex items-center gap-3 mt-2">
                    <div className="flex items-center gap-1">
                      {stars.map((s) => (
                        <Star
                          key={s}
                          className={`w-4 h-4 ${
                            s <= Math.round(pro.rating)
                              ? "text-yellow-400 fill-yellow-400"
                              : "text-gray-200 fill-gray-200"
                          }`}
                        />
                      ))}

                      <span className="text-sm text-gray-700 ml-1">
                        {pro.rating} ({pro.reviews} avaliações)
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 mt-1 text-sm text-gray-500">
                    <MapPin className="w-3.5 h-3.5" />
                    <span>
                      {pro.city} · {pro.distance} km de você
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 mt-5 pt-5 border-t border-gray-100">
                <div className="text-center">
                  <p
                    className="text-gray-900"
                    style={{ fontWeight: 700, fontSize: "1.25rem" }}
                  >
                    {pro.completedJobs}
                  </p>
                  <p className="text-xs text-gray-500">Serviços</p>
                </div>

                <div className="text-center border-x border-gray-100">
                  <p
                    className="text-gray-900"
                    style={{ fontWeight: 700, fontSize: "1.25rem" }}
                  >
                    {pro.area} km
                  </p>
                  <p className="text-xs text-gray-500">Raio de atend.</p>
                </div>

                <div className="text-center">
                  <p
                    className="text-gray-900"
                    style={{ fontWeight: 700, fontSize: "1.25rem" }}
                  >
                    {pro.rating.toFixed(1)}
                  </p>
                  <p className="text-xs text-gray-500">Avaliação</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
              <h3 className="text-gray-900 mb-2">Sobre o profissional</h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                {pro.description}
              </p>

              <div className="flex flex-wrap gap-2 mt-3">
                {pro.tags?.map((tag) => (
                  <span
                    key={tag}
                    className="text-xs bg-blue-50 text-blue-600 px-3 py-1 rounded-full"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
              <h3 className="text-gray-900 mb-4">Avaliações dos clientes</h3>

              {reviews.length === 0 ? (
                <p className="text-sm text-gray-500">
                  Este profissional ainda não possui avaliações.
                </p>
              ) : (
                <div className="flex flex-col gap-4">
                  {reviews.map((r) => (
                    <div
                      key={r.id}
                      className="pb-4 border-b border-gray-100 last:border-0 last:pb-0"
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center text-xs text-blue-600 overflow-hidden"
                            style={{ fontWeight: 600 }}
                          >
                            {r.userPhoto ? (
                              <img
                                src={r.userPhoto}
                                alt={r.user}
                                className="w-full h-full object-cover"
                                loading="lazy"
                              />
                            ) : (
                              r.user?.[0] ?? "U"
                            )}
                          </div>

                          <span
                            className="text-sm text-gray-700"
                            style={{ fontWeight: 600 }}
                          >
                            {r.user}
                          </span>
                        </div>

                        <span className="text-xs text-gray-400">{r.date}</span>
                      </div>

                      <div className="flex items-center gap-0.5 mb-1.5">
                        {Array.from({ length: 5 }, (_, i) => (
                          <Star
                            key={i}
                            className={`w-3 h-3 ${
                              i < r.rating
                                ? "text-yellow-400 fill-yellow-400"
                                : "text-gray-200 fill-gray-200"
                            }`}
                          />
                        ))}
                      </div>

                      <p className="text-sm text-gray-600">{r.text}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 sticky top-32">
              <div className="flex items-baseline gap-1 mb-1">
                <span
                  className="text-blue-600"
                  style={{ fontWeight: 700, fontSize: "1.75rem" }}
                >
                  R${pro.price}
                </span>
                <span className="text-gray-400 text-sm">/{pro.priceUnit}</span>
              </div>

              <p className="text-xs text-gray-500 mb-4">
                Preço médio estimado. Valor final após avaliação.
              </p>

              {pro.online ? (
                <div className="flex items-center gap-2 bg-green-50 text-green-700 px-3 py-2 rounded-lg mb-4 text-sm">
                  <Zap className="w-4 h-4" />
                  Disponível agora para atendimento
                </div>
              ) : (
                <div className="flex items-center gap-2 bg-gray-50 text-gray-500 px-3 py-2 rounded-lg mb-4 text-sm">
                  <Clock className="w-4 h-4" />
                  Offline no momento
                </div>
              )}

              <button
                onClick={() => setShowBooking(true)}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl transition-colors mb-2"
              >
                Contratar Agora
              </button>

              <button
                onClick={() => setShowChat(true)}
                className="w-full border border-blue-200 text-blue-600 hover:bg-blue-50 py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                <MessageCircle className="w-4 h-4" />
                Enviar mensagem
              </button>

              <a
                href={`tel:${pro.phone}`}
                className="w-full flex items-center justify-center gap-2 mt-2 border border-gray-200 text-gray-600 hover:bg-gray-50 py-3 rounded-xl transition-colors"
              >
                <Phone className="w-4 h-4" />
                {pro.phone}
              </a>

              <div className="mt-4 pt-4 border-t border-gray-100 flex flex-col gap-2">
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <Shield className="w-3.5 h-3.5 text-green-500" />
                  Identidade verificada
                </div>

                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <Award className="w-3.5 h-3.5 text-blue-500" />
                  {pro.completedJobs} serviços concluídos
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showChat && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="flex items-center gap-3 p-4 border-b border-gray-100 bg-blue-600 text-white">
              <img
                src={pro.photo}
                alt={pro.name}
                className="w-9 h-9 rounded-full object-cover"
              />

              <div className="flex-1">
                <p style={{ fontWeight: 600 }}>{pro.name}</p>
                <p className="text-xs text-blue-200">{pro.categoryLabel}</p>
              </div>

              <button onClick={() => setShowChat(false)}>
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="h-72 overflow-y-auto p-4 flex flex-col gap-3 bg-gray-50">
              {messages.length === 0 ? (
                <p className="text-sm text-gray-500 text-center mt-10">
                  Nenhuma mensagem ainda. Comece a conversa.
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
                      className={`max-w-[80%] px-3 py-2 rounded-2xl text-sm ${
                        msg.sender === "user"
                          ? "bg-blue-600 text-white rounded-br-sm"
                          : "bg-white text-gray-700 rounded-bl-sm shadow-sm"
                      }`}
                    >
                      <p>{msg.text}</p>
                      <p
                        className={`text-xs mt-1 ${
                          msg.sender === "user" ? "text-blue-200" : "text-gray-400"
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
                placeholder="Digite sua mensagem..."
                disabled={sendingMessage}
                className="flex-1 px-3 py-2 bg-gray-100 rounded-xl text-sm outline-none disabled:opacity-60"
              />

              <button
                onClick={sendMessage}
                disabled={sendingMessage}
                className="bg-blue-600 text-white px-4 py-2 rounded-xl text-sm hover:bg-blue-700 transition-colors disabled:opacity-60"
              >
                Enviar
              </button>
            </div>
            {chatError && (
              <p className="px-3 pb-3 text-xs text-red-600">{chatError}</p>
            )}
          </div>
        </div>
      )}

      {showBooking && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
            {bookingSuccess ? (
              <div className="p-8 text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-8 h-8 text-green-500" />
                </div>

                <h3 className="text-gray-900 mb-2">Pedido enviado!</h3>

                <p className="text-sm text-gray-500">
                  {pro.name} foi notificado e irá entrar em contato em breve.
                </p>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between p-4 border-b border-gray-100">
                  <h3 className="text-gray-900">Contratar {pro.name}</h3>

                  <button onClick={() => setShowBooking(false)}>
                    <X className="w-5 h-5 text-gray-400" />
                  </button>
                </div>

                <div className="p-5">
                  <div className="grid grid-cols-2 gap-3 mb-5">
                    <button
                      onClick={() => setBookingType("imediato")}
                      className={`flex items-center gap-2 p-3 rounded-xl border-2 transition-all ${
                        bookingType === "imediato"
                          ? "border-blue-500 bg-blue-50"
                          : "border-gray-200"
                      }`}
                    >
                      <Zap className="w-4 h-4 text-orange-500" />

                      <div className="text-left">
                        <p
                          className="text-sm text-gray-800"
                          style={{ fontWeight: 600 }}
                        >
                          Urgente
                        </p>
                        <p className="text-xs text-gray-400">Agora</p>
                      </div>
                    </button>

                    <button
                      onClick={() => setBookingType("agendar")}
                      className={`flex items-center gap-2 p-3 rounded-xl border-2 transition-all ${
                        bookingType === "agendar"
                          ? "border-blue-500 bg-blue-50"
                          : "border-gray-200"
                      }`}
                    >
                      <Calendar className="w-4 h-4 text-blue-500" />

                      <div className="text-left">
                        <p
                          className="text-sm text-gray-800"
                          style={{ fontWeight: 600 }}
                        >
                          Agendar
                        </p>
                        <p className="text-xs text-gray-400">Escolher data</p>
                      </div>
                    </button>
                  </div>

                  {bookingType === "agendar" && (
                    <div className="grid grid-cols-2 gap-3 mb-4">
                      <div>
                        <label className="text-xs text-gray-500 mb-1 block">
                          Data
                        </label>

                        <input
                          type="date"
                          value={selectedDate}
                          onChange={(e) => setSelectedDate(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-blue-400"
                        />
                      </div>

                      <div>
                        <label className="text-xs text-gray-500 mb-1 block">
                          Horário
                        </label>

                        <input
                          type="time"
                          value={selectedTime}
                          onChange={(e) => setSelectedTime(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-blue-400"
                        />
                      </div>
                    </div>
                  )}

                  <div className="mb-4">
                    <label className="text-xs text-gray-500 mb-1 block">
                      Descreva o serviço
                    </label>

                    <textarea
                      rows={3}
                      placeholder="Descreva o que precisa..."
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-blue-400 resize-none"
                    />
                  </div>

                  <div className="mb-5">
                    <label className="text-xs text-gray-500 mb-2 block">
                      Pagamento
                    </label>

                    <div className="flex gap-2">
                      {["Pix", "Crédito", "Débito"].map((payment) => (
                        <button
                          key={payment}
                          className="flex-1 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:border-blue-300 hover:bg-blue-50 transition-colors"
                        >
                          {payment}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center justify-between mb-4 p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm text-gray-600">
                      Estimativa base:
                    </span>

                    <span className="text-blue-600" style={{ fontWeight: 700 }}>
                      R${pro.price}/{pro.priceUnit}
                    </span>
                  </div>

                  <button
                    onClick={handleBooking}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl transition-colors"
                  >
                    Confirmar Pedido
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
export default ProfessionalProfile;

