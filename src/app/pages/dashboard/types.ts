export type Tab = "pedidos" | "chat" | "avaliacoes" | "pagamento" | "perfil";

export type OrderStatus = "concluido" | "em andamento" | "cancelado" | "aguardando";

export interface DashboardUser {
  id: string;
  name: string;
  email?: string;
  cpf?: string | null;
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

export interface DashboardMessage {
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

export interface DashboardProfessional {
  id: string;
  name: string;
  photo?: string;
  categoryLabel?: string;
  online?: boolean;
  conversationId?: string;
}

export interface DashboardOrder {
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

export interface PaymentMethod {
  id: string;
  type: string;
  description: string;
  icon?: string;
  active: boolean;
}

export interface PaymentHistoryItem {
  id: string;
  professionalName: string;
  date: string;
  method: string;
  amount: number;
  status: string;
}

export interface DashboardResponse {
  user: DashboardUser | null;
  orders: RawDashboardOrder[];
  messages: DashboardMessage[];
  paymentMethods: PaymentMethod[];
  paymentHistory: PaymentHistoryItem[];
  activeChatProfessional?: DashboardProfessional | null;
}

export type ApiChatMessage = {
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

export type MessagesResponse = {
  items?: ApiChatMessage[];
};

export type ConversationSummary = {
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

export type ConversationsResponse = {
  items?: ConversationSummary[];
};

export type RawDashboardOrder = Omit<DashboardOrder, "status"> & {
  status?: string;
};

export type ProfileForm = {
  email: string;
  cpf: string;
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
  professionalLatitude: string;
  professionalLongitude: string;
  password: string;
  confirmPassword: string;
};
