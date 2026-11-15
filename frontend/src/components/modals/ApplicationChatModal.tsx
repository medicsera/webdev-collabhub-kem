import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, Send, MessageSquare, Check, CheckCheck, Crown, Users } from 'lucide-react';
import type { Chat, ProjectApplication, Project, Role } from '../../types';

interface ApplicationChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  chat: Chat | null;
  application: ProjectApplication | null;
  project: Project | null;
  currentRole: Role;
  currentUserId: number | string;
  currentUserName: string;
  onSendMessage: (chatId: string, content: string) => void;
}

export const ApplicationChatModal: React.FC<ApplicationChatModalProps> = ({
  isOpen,
  onClose,
  chat,
  application,
  project,
  currentRole,
  currentUserId,
  currentUserName,
  onSendMessage,
}) => {
  const [text, setText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [isOpen, chat?.messages]);

  if (!isOpen || !chat) return null;
  if (typeof document === 'undefined') return null;

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    onSendMessage(chat.id, text.trim());
    setText('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend(e);
    }
  };

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case 'ACCEPTED':
        return <span className="px-2 py-0.5 text-[9px] font-mono uppercase bg-hunter text-white">Принят</span>;
      case 'INTERVIEW':
        return <span className="px-2 py-0.5 text-[9px] font-mono uppercase bg-brass text-white">Собеседование</span>;
      case 'REVIEWING':
        return <span className="px-2 py-0.5 text-[9px] font-mono uppercase bg-oxblood/80 text-white">На рассмотрении</span>;
      case 'REJECTED':
        return <span className="px-2 py-0.5 text-[9px] font-mono uppercase bg-stone-500 text-white">Отклонен</span>;
      default:
        return <span className="px-2 py-0.5 text-[9px] font-mono uppercase border border-paper-border text-ink-muted">Новая заявка</span>;
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 z-50 bg-ink/75 backdrop-blur-xs flex justify-center items-center overflow-y-auto p-3 sm:p-5"
      onClick={onClose}
    >
      <div
        className="relative bg-paper-card dark:bg-paper-darkCard border-2 border-ink dark:border-stone-600 rounded-xs max-w-2xl w-full shadow-2xl fade-in flex flex-col h-[660px] max-h-[calc(100vh-2.5rem)] min-h-0 my-auto overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Шапка чата */}
        <div className="shrink-0 border-b border-paper-border dark:border-paper-darkBorder px-5 py-3.5 bg-paper-card dark:bg-paper-darkCard flex items-start justify-between gap-3">
          <div className="min-w-0 space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-mono uppercase tracking-widest text-oxblood dark:text-oxblood-light flex items-center gap-1 font-semibold">
                <MessageSquare className="w-3.5 h-3.5" /> Чат по отклику (chats + messages)
              </span>
              <span className="text-paper-border dark:text-paper-darkBorder">•</span>
              <span className="text-xs font-mono font-medium text-ink dark:text-ink-light truncate">
                {chat.companyName}
              </span>
              {application && getStatusBadge(application.status)}
            </div>

            <h3 className="text-base sm:text-lg font-semibold text-ink dark:text-ink-light truncate">
              {project?.title || chat.projectTitle}
            </h3>

            {/* Состав команды (application_members) */}
            {application?.members && application.members.length > 0 && (
              <div className="flex items-center gap-2 text-[10px] font-mono text-ink-muted dark:text-stone-400 flex-wrap pt-0.5">
                <span className="flex items-center gap-1 text-ink dark:text-stone-300">
                  <Users className="w-3 h-3 text-oxblood dark:text-oxblood-light" />
                  Команда ({application.members.length}):
                </span>
                {application.members.map((m) => (
                  <span
                    key={String(m.studentId)}
                    className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-paper-light dark:bg-stone-800 border border-paper-border dark:border-stone-700"
                  >
                    {m.role === 'LEAD' ? (
                      <Crown className="w-2.5 h-2.5 text-brass" />
                    ) : null}
                    <span>{m.studentName}</span>
                    <span className="text-[9px] text-oxblood dark:text-oxblood-light font-bold">
                      [{m.role}]
                    </span>
                  </span>
                ))}
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1 text-ink-muted hover:text-ink dark:hover:text-white transition-colors cursor-pointer shrink-0"
            title="Закрыть чат"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Область сообщений */}
        <div className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-5 space-y-3 bg-paper-light/40 dark:bg-paper-dark/60 overscroll-contain">
          {/* Системное сообщение о создании чата */}
          <div className="text-center my-2">
            <span className="px-3 py-1 bg-paper-card dark:bg-stone-800 border border-paper-border dark:border-stone-700 text-[10px] font-mono uppercase tracking-wider text-ink-muted dark:text-stone-400">
              Чат открыт в рамках отклика на проект • {chat.projectTitle}
            </span>
          </div>

          {chat.messages.length === 0 ? (
            <div className="py-12 text-center text-xs font-mono text-ink-muted">
              Сообщений пока нет. Начните диалог первым!
            </div>
          ) : (
            chat.messages.map((msg) => {
              const isMyMessage = currentUserId
                ? String(msg.senderId) === String(currentUserId)
                : msg.senderRole === currentRole;

              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${isMyMessage ? 'items-end' : 'items-start'}`}
                >
                  <div className="flex items-center gap-1.5 mb-1 px-1 text-[10px] font-mono text-ink-muted dark:text-stone-400">
                    <span className="font-semibold text-ink dark:text-stone-300">{msg.senderName}</span>
                    <span>•</span>
                    <span className="uppercase text-[9px] text-oxblood dark:text-oxblood-light">
                      {msg.senderRole === 'hr' ? 'Компания' : 'Студент'}
                    </span>
                  </div>

                  <div
                    className={`max-w-[85%] sm:max-w-[75%] p-3.5 text-xs sm:text-sm leading-relaxed ${
                      isMyMessage
                        ? 'bg-ink text-paper-light dark:bg-stone-200 dark:text-stone-900 shadow-xs'
                        : 'bg-paper-card dark:bg-stone-800 text-ink dark:text-ink-light border border-paper-border dark:border-stone-700 shadow-xs'
                    }`}
                  >
                    <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                    <div
                      className={`flex items-center justify-end gap-1 mt-1 text-[9px] font-mono ${
                        isMyMessage ? 'text-paper-light/60 dark:text-stone-600' : 'text-stone-400'
                      }`}
                    >
                      <span>
                        {new Date(msg.createdAt).toLocaleTimeString('ru-RU', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                      {isMyMessage && (
                        <span>
                          {msg.isRead ? (
                            <CheckCheck className="w-3 h-3 text-hunter dark:text-emerald-500" />
                          ) : (
                            <Check className="w-3 h-3" />
                          )}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Форма отправки сообщения */}
        <form
          onSubmit={handleSend}
          className="shrink-0 mt-auto p-3 sm:p-4 border-t border-paper-border dark:border-paper-darkBorder bg-paper-card dark:bg-paper-darkCard flex items-end gap-2"
        >
          <div className="flex-1 relative">
            <textarea
              rows={2}
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={`Написать сообщение от имени ${currentUserName}... (Enter для отправки)`}
              className="w-full p-2.5 text-xs sm:text-sm bg-paper-light dark:bg-paper-dark border border-paper-border dark:border-paper-darkBorder focus:outline-none focus:border-oxblood text-ink dark:text-ink-light placeholder:text-ink-muted/60 resize-none max-h-24"
            />
          </div>

          <button
            type="submit"
            disabled={!text.trim()}
            className="h-10 px-4 bg-oxblood hover:bg-oxblood-hover disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-mono uppercase tracking-wider transition flex items-center gap-1.5 cursor-pointer shrink-0 shadow-xs"
          >
            <Send className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Отправить</span>
          </button>
        </form>
      </div>
    </div>,
    document.body
  );
};

