import { AlertCircle, CheckCircle, Clock, XCircle } from "lucide-react";
import type {
  ApiChatMessage,
  DashboardMessage,
  DashboardOrder,
  OrderStatus
} from "./types";

export function parsePositiveInteger(value: string | null) {
  if (!value || !/^\d+$/.test(value)) return null;
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed <= 0) return null;
  return parsed;
}

export function normalizeOrderStatus(status: unknown): OrderStatus {
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

export function normalizeChatMessage(message: ApiChatMessage): DashboardMessage {
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

export function getOrderCounterpart(
  order: DashboardOrder,
  isProfessionalDashboard: boolean
) {
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

export const statusConfig = {
  concluido: {
    icon: CheckCircle,
    color: "text-green-600",
    bg: "bg-green-50",
    label: "Concluido"
  },
  "em andamento": {
    icon: Clock,
    color: "text-blue-600",
    bg: "bg-blue-50",
    label: "Em andamento"
  },
  cancelado: {
    icon: XCircle,
    color: "text-red-500",
    bg: "bg-red-50",
    label: "Cancelado"
  },
  aguardando: {
    icon: AlertCircle,
    color: "text-yellow-600",
    bg: "bg-yellow-50",
    label: "Aguardando"
  }
} as const;
