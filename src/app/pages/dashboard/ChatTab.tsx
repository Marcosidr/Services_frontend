import { Search, Send, Trash2, User } from "lucide-react";
import type { RefObject } from "react";
import type { ConversationSummary, DashboardMessage, DashboardProfessional } from "./types";

type ChatTabProps = {
  conversationSearch: string;
  onConversationSearchChange: (value: string) => void;
  loadingConversations: boolean;
  filteredConversations: ConversationSummary[];
  activeChatProfessional: DashboardProfessional | null;
  deletingConversationId: string | null;
  onOpenConversation: (
    withUserId: number,
    withUserName?: string,
    withUserPhoto?: string,
    conversationId?: string
  ) => Promise<void>;
  onDeleteConversation: (conversation: ConversationSummary) => Promise<void>;
  conversations: ConversationSummary[];
  loadingMessages: boolean;
  messages: DashboardMessage[];
  onDeleteMessage: (message: DashboardMessage) => Promise<void>;
  deletingMessageId: string | null;
  messagesEndRef: RefObject<HTMLDivElement | null>;
  chatMessage: string;
  onChatMessageChange: (value: string) => void;
  onSendMessage: () => Promise<void>;
  sendingMessage: boolean;
};

export function ChatTab({
  conversationSearch,
  onConversationSearchChange,
  loadingConversations,
  filteredConversations,
  activeChatProfessional,
  deletingConversationId,
  onOpenConversation,
  onDeleteConversation,
  conversations,
  loadingMessages,
  messages,
  onDeleteMessage,
  deletingMessageId,
  messagesEndRef,
  chatMessage,
  onChatMessageChange,
  onSendMessage,
  sendingMessage
}: ChatTabProps) {
  return (
    <div className="surface-card overflow-hidden">
      <div className="grid min-h-[34rem] grid-cols-1 md:grid-cols-[300px,1fr]">
        <aside className="border-b border-slate-200 bg-slate-50/50 md:border-b-0 md:border-r">
          <div className="border-b border-slate-200 bg-white/80 px-3 py-3 backdrop-blur">
            <p className="text-sm text-slate-800" style={{ fontWeight: 600 }}>
              Conversas
            </p>
            <div className="mt-2 relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={conversationSearch}
                onChange={(event) => onConversationSearchChange(event.target.value)}
                placeholder="Buscar conversa..."
                className="input-surface w-full bg-white/85 py-2 pl-9 pr-3"
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
                const deletingCurrent = deletingConversationId === conversation.conversationId;

                return (
                  <div
                    key={conversation.conversationId}
                    className={`border-b border-slate-100 ${isActive ? "bg-primary/10" : "hover:bg-white/80"}`}
                  >
                    <div className="flex items-center gap-2 px-2 py-2">
                      <button
                        type="button"
                        onClick={() =>
                          void onOpenConversation(
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
                              isActive ? "bg-primary/15 text-primary" : "bg-slate-200 text-slate-500"
                            }`}
                          >
                            <User className="w-4 h-4" />
                          </div>
                        )}

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <p className="truncate text-sm text-slate-800" style={{ fontWeight: isActive ? 700 : 600 }}>
                              {conversation.otherUserName}
                            </p>
                            <span className="flex-shrink-0 text-[11px] text-slate-400">
                              {conversation.lastMessage.time ??
                                new Date(conversation.lastMessage.createdAt ?? Date.now()).toLocaleTimeString("pt-BR", {
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
                        onClick={() => void onDeleteConversation(conversation)}
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
          <div className="flex items-center gap-3 border-b border-slate-200 bg-gradient-to-r from-primary to-secondary p-4 text-white">
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
                {activeChatProfessional ? "Conversa ativa" : "Escolha uma conversa na lista ao lado"}
              </p>
            </div>

            {activeChatProfessional?.id && (
              <button
                type="button"
                onClick={() => {
                  const currentConversation = conversations.find(
                    (conversation) => String(conversation.otherUserId) === activeChatProfessional.id
                  );
                  if (currentConversation) {
                    void onDeleteConversation(currentConversation);
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
              <p className="mt-8 text-center text-sm text-slate-500">Selecione uma conversa para comecar.</p>
            ) : loadingMessages ? (
              <p className="mt-8 text-center text-sm text-slate-500">Carregando mensagens...</p>
            ) : messages.length === 0 ? (
              <p className="mt-8 text-center text-sm text-slate-500">Nenhuma mensagem ainda.</p>
            ) : (
              <div className="space-y-3">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex items-end gap-1 ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-xl rounded-2xl px-4 py-2.5 text-sm shadow-sm ${
                        msg.sender === "user"
                          ? "rounded-br-sm bg-primary text-white"
                          : "rounded-bl-sm bg-white text-slate-700"
                      }`}
                    >
                      <p>{msg.text}</p>
                      <p className={`text-xs mt-1 ${msg.sender === "user" ? "text-slate-300" : "text-slate-400"}`}>
                        {msg.time}
                      </p>
                    </div>

                    {msg.sender === "user" && /^\d+$/.test(msg.id) && (
                      <button
                        type="button"
                        onClick={() => void onDeleteMessage(msg)}
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
              onChange={(event) => onChatMessageChange(event.target.value)}
              onKeyDown={(event) => event.key === "Enter" && void onSendMessage()}
              placeholder="Digite uma mensagem..."
              disabled={!activeChatProfessional || sendingMessage || loadingMessages}
              className="input-surface flex-1 disabled:opacity-60"
            />

            <button
              onClick={() => void onSendMessage()}
              disabled={!activeChatProfessional || sendingMessage || loadingMessages}
              className="btn-primary rounded-xl p-2.5 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
