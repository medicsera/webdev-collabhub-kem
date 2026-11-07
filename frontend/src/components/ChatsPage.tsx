import React, { useState, useRef, useEffect } from 'react';
import {
  MessageSquare,
  Send,
  Check,
  CheckCheck,
  Crown,
  Users,
  Search,
  Building2,
  GraduationCap,
} from 'lucide-react';
import type { Chat, ProjectApplication, Role } from '../types';

interface ChatsPageProps {
  chats: Chat[];
  applications?: ProjectApplication[];
  currentRole: Role;
  currentUserId: number | string;
  currentUserName: string;
  activeChatId?: string | null;
  onSelectChat?: (chatId: string) => void;
  onSendMessage: (chatId: string, content: string) => void;
}

export const ChatsPage: React.FC<ChatsPageProps> = ({
  chats,
  applications = [],
  currentRole,
  currentUserId,
  currentUserName,
  activeChatId,
  onSelectChat,
  onSendMessage,
}) => {
  const [selectedId, setSelectedId] = useState<string>(
    activeChatId || (chats.length > 0 ? chats[0].id : '')
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [text, setText] = useState('');
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  // Всегда остаемся в самом верху страницы при открытии вкладки "Чаты"
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }, []);

  useEffect(() => {
    if (activeChatId) {
      setSelectedId(activeChatId);
    }
  }, [activeChatId]);

  const activeChat = chats.find((c) => c.id === selectedId) || chats[0];
  const relatedApplication = applications.find((a) => a.chatId === activeChat?.id || `chat-${a.id}` === activeChat?.id);

  // Скроллим строго внутренний контейнер сообщений чата, не затрагивая страницу браузера
  useEffect(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  }, [activeChat?.id, activeChat?.messages?.length]);

  const filteredChats = chats.filter((c) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      c.projectTitle.toLowerCase().includes(q) ||
      c.companyName.toLowerCase().includes(q) ||
      (c.studentName ? c.studentName.toLowerCase().includes(q) : false)
    );
  });

  const handleSelect = (id: string) => {
    setSelectedId(id);
    if (onSelectChat) onSelectChat(id);
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || !activeChat) return;
    onSendMessage(activeChat.id, text.trim());
    setText('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend(e);
    }
  };

  return (
    <div className="space-y-4">
      {/* Заголовок модуля чатов */}
      <div className="double-rule-b pb-3 flex items-center justify-between">
        <div>
          <div className="text-[10px] font-mono uppercase tracking-widest text-oxblood dark:text-oxblood-light flex items-center gap-1.5 font-semibold">
            <MessageSquare className="w-3.5 h-3.5" /> Мессенджер проектных откликов
          </div>
          <h2 className="text-2xl sm:text-3xl font-semibold text-ink dark:text-ink-light">
            Диалоги и коммуникация по проектам
          </h2>
        </div>
        <div className="text-xs font-mono text-ink-muted dark:text-stone-400">
          Всего диалогов: {chats.length}
        </div>
      </div>

      {/* 
        ЕДИНЫЙ РОДИТЕЛЬСКИЙ КОНТЕЙНЕР ФИКСИРОВАННОЙ ВЫСОТЫ
        (height: calc(100vh - 220px), display: flex, overflow: hidden, border, border-radius)
      */}
      <div className="h-[calc(100vh-220px)] min-h-[560px] max-h-[850px] flex overflow-hidden border border-paper-border dark:border-paper-darkBorder rounded-xs bg-paper-card dark:bg-paper-darkCard shadow-sm">
        {/* ЛЕВАЯ КОЛОНКА: САЙДБАР СО СПИСКОМ ДИАЛОГОВ */}
        <aside className="w-72 sm:w-80 md:w-96 border-r border-paper-border dark:border-paper-darkBorder flex flex-col shrink-0 bg-paper-card dark:bg-paper-darkCard">
          {/* Поиск по диалогам */}
          <div className="p-3 border-b border-paper-border dark:border-paper-darkBorder bg-paper-light/50 dark:bg-paper-dark/50">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Поиск по диалогам..."
                className="w-full pl-8.5 pr-3 py-1.5 text-xs font-mono bg-paper-light dark:bg-paper-dark border border-paper-border dark:border-paper-darkBorder focus:outline-none focus:border-oxblood text-ink dark:text-ink-light placeholder:text-ink-muted/60"
              />
            </div>
          </div>

          {/* Список чатов */}
          <div className="flex-1 overflow-y-auto divide-y divide-paper-border dark:divide-paper-darkBorder">
            {filteredChats.length === 0 ? (
              <div className="p-6 text-center text-xs font-mono text-ink-muted">
                Диалогов не найдено
              </div>
            ) : (
              filteredChats.map((c) => {
                const isSelected = activeChat && activeChat.id === c.id;
                const lastMsg = c.messages[c.messages.length - 1];
                const otherPartyName = currentRole === 'student' ? c.companyName : (c.studentName || 'Студент');

                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => handleSelect(c.id)}
                    className={`w-full p-3.5 text-left transition-colors flex items-start gap-3 cursor-pointer ${
                      isSelected
                        ? 'bg-paper-muted dark:bg-paper-dark border-l-3 border-oxblood'
                        : 'hover:bg-paper-muted/30 dark:hover:bg-stone-900'
                    }`}
                  >
                    <div className="w-9 h-9 shrink-0 rounded-xs border border-paper-border dark:border-stone-700 bg-paper-light dark:bg-stone-800 flex items-center justify-center text-oxblood dark:text-oxblood-light font-bold text-xs">
                      {currentRole === 'student' ? (
                        <Building2 className="w-4 h-4" />
                      ) : (
                        <GraduationCap className="w-4 h-4" />
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1 mb-0.5">
                        <span className="text-xs font-semibold text-ink dark:text-ink-light truncate">
                          {otherPartyName}
                        </span>
                        {lastMsg && (
                          <span className="text-[10px] font-mono text-ink-muted shrink-0">
                            {new Date(lastMsg.createdAt).toLocaleTimeString('ru-RU', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        )}
                      </div>

                      <div className="text-[11px] font-mono text-oxblood dark:text-oxblood-light truncate mb-1">
                        {c.projectTitle}
                      </div>

                      <div className="text-xs text-ink-muted dark:text-stone-400 truncate line-clamp-1">
                        {lastMsg ? lastMsg.content : 'Нет сообщений'}
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </aside>

        {/* 
          ПРАВАЯ КОЛОНКА (АКТИВНЫЙ ЧАТ):
          display: flex; flex-direction: column; height: 100%; min-height: 0;
        */}
        <div className="flex-1 flex flex-col h-full min-h-0 bg-paper-light/30 dark:bg-paper-dark/60">
          {activeChat ? (
            <>
              {/* 
                ШАПКА АКТИВНОГО ЧАТА:
                зафиксирована сверху (flex-shrink: 0)
              */}
              <div className="shrink-0 p-3.5 sm:p-4 border-b border-paper-border dark:border-paper-darkBorder bg-paper-card dark:bg-paper-darkCard flex items-start justify-between gap-3">
                <div className="min-w-0 space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-bold text-ink dark:text-ink-light">
                      {currentRole === 'student' ? activeChat.companyName : (activeChat.studentName || 'Студент')}
                    </span>
                    <span className="text-paper-border">•</span>
                    <span className="text-[11px] font-mono text-oxblood dark:text-oxblood-light truncate">
                      {activeChat.projectTitle}
                    </span>
                  </div>

                  {relatedApplication?.members && relatedApplication.members.length > 0 && (
                    <div className="flex items-center gap-1.5 text-[10px] font-mono text-ink-muted dark:text-stone-400 flex-wrap">
                      <Users className="w-3 h-3 text-oxblood dark:text-oxblood-light" />
                      <span>Команда ({relatedApplication.members.length}):</span>
                      {relatedApplication.members.map((m) => (
                        <span
                          key={String(m.studentId)}
                          className="inline-flex items-center gap-0.5 px-1.5 py-0.2 bg-paper-light dark:bg-stone-800 border border-paper-border dark:border-stone-700"
                        >
                          {m.role === 'LEAD' ? <Crown className="w-2.5 h-2.5 text-brass" /> : null}
                          <span>{m.studentName}</span>
                          <span className="font-bold text-[9px]">[{m.role}]</span>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* 
                КОНТЕЙНЕР СО СПИСКОМ СООБЩЕНИЙ:
                растягивающийся и прокручиваемый (flex: 1 1 auto; overflow-y: auto; min-height: 0; padding: ...)
              */}
              <div
                ref={messagesContainerRef}
                className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-6 space-y-3.5 overscroll-contain"
              >
                <div className="text-center my-1">
                  <span className="px-3 py-1 bg-paper-card dark:bg-stone-800 border border-paper-border dark:border-stone-700 text-[10px] font-mono uppercase tracking-wider text-ink-muted">
                    Начало диалога по отклику на проект «{activeChat.projectTitle}»
                  </span>
                </div>

                {activeChat.messages.length === 0 ? (
                  <div className="py-16 text-center text-xs font-mono text-ink-muted">
                    Сообщений пока нет. Задайте вопрос по проекту!
                  </div>
                ) : (
                  activeChat.messages.map((msg) => {
                    const isMy = currentUserId
                      ? String(msg.senderId) === String(currentUserId)
                      : msg.senderRole === currentRole;

                    return (
                      <div
                        key={msg.id}
                        className={`flex flex-col ${isMy ? 'items-end' : 'items-start'}`}
                      >
                        <div className="flex items-center gap-1.5 mb-1 px-1 text-[10px] font-mono text-ink-muted dark:text-stone-400">
                          <span className="font-semibold text-ink dark:text-stone-300">
                            {msg.senderName}
                          </span>
                          <span>•</span>
                          <span className="uppercase text-[9px] text-oxblood dark:text-oxblood-light">
                            {msg.senderRole === 'hr' ? 'Компания' : 'Студент'}
                          </span>
                        </div>

                        <div
                          className={`max-w-[85%] sm:max-w-[70%] p-3 text-xs sm:text-sm leading-relaxed rounded-xs ${
                            isMy
                              ? 'bg-ink text-paper-light dark:bg-stone-200 dark:text-stone-900 shadow-2xs'
                              : 'bg-paper-card dark:bg-stone-800 text-ink dark:text-ink-light border border-paper-border dark:border-stone-700 shadow-2xs'
                          }`}
                        >
                          <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                          <div
                            className={`flex items-center justify-end gap-1 mt-1 text-[9px] font-mono ${
                              isMy ? 'text-paper-light/60 dark:text-stone-600' : 'text-stone-400'
                            }`}
                          >
                            <span>
                              {new Date(msg.createdAt).toLocaleTimeString('ru-RU', {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                            {isMy && (
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
              </div>

              {/* 
                БЛОК ВВОДА СООБЩЕНИЯ:
                жестко прижат к низу (flex-shrink: 0; margin-top: auto; border-top: 1px solid ...)
              */}
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
                    className="w-full p-2.5 text-xs sm:text-sm bg-paper-light dark:bg-paper-dark border border-paper-border dark:border-paper-darkBorder focus:outline-none focus:border-oxblood text-ink dark:text-ink-light placeholder:text-ink-muted/60 resize-none max-h-24 rounded-xs"
                  />
                </div>

                <button
                  type="submit"
                  disabled={!text.trim()}
                  className="h-10 px-4 bg-oxblood hover:bg-oxblood-hover disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-mono uppercase tracking-wider transition flex items-center gap-1.5 cursor-pointer shrink-0 shadow-xs rounded-xs"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Отправить</span>
                </button>
              </form>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center p-8 text-center text-ink-muted font-mono text-sm">
              Выберите диалог из списка слева для начала общения
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
