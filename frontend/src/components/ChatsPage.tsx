import React, { useState, useRef, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
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
  ArrowLeft,
} from 'lucide-react';
import type { Chat, ProjectApplication, Role } from '../types';
import { useApp } from '../context/AppContext';

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
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTargetId = searchParams.get('chatId') || activeChatId || '';

  const [selectedId, setSelectedId] = useState<string>(initialTargetId);
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
    const target = searchParams.get('chatId') || activeChatId || '';
    setSelectedId(target);
  }, [searchParams, activeChatId]);

  const activeChat = selectedId ? (chats.find((c) => c.id === selectedId) || null) : null;
  const relatedApplication = applications.find((a) => a.chatId === activeChat?.id || `chat-${a.id}` === activeChat?.id);
  const { markChatAsRead } = useApp();

  useEffect(() => {
    if (activeChat?.id) {
      markChatAsRead(activeChat.id);
    }
  }, [activeChat?.id, activeChat?.messages?.length, markChatAsRead]);

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

  const isMessageFromMe = (msg: { senderId: number | string; senderRole: string }) => {
    if (currentUserId && String(msg.senderId) === String(currentUserId)) return true;
    if (msg.senderRole === currentRole) return true;
    return false;
  };

  const handleSelect = (id: string) => {
    setSelectedId(id);
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set('chatId', id);
      return next;
    }, { replace: true });
    if (onSelectChat) onSelectChat(id);
  };

  const handleBackToList = () => {
    setSelectedId('');
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.delete('chatId');
      return next;
    }, { replace: true });
    if (onSelectChat) onSelectChat('');
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
      <div className="h-[calc(100vh-220px)] min-h-[560px] max-h-[850px] flex overflow-hidden border border-paper-border dark:border-paper-darkBorder bg-paper-card dark:bg-paper-darkCard">
        {/* ЛЕВАЯ КОЛОНКА: САЙДБАР СО СПИСКОМ ДИАЛОГОВ */}
        <aside className={`${activeChat ? 'hidden md:flex' : 'flex'} w-full md:w-80 lg:w-96 border-r border-paper-border dark:border-paper-darkBorder flex-col shrink-0 bg-paper-card dark:bg-paper-darkCard`}>
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
                const isLastFromMe = lastMsg ? isMessageFromMe(lastMsg) : false;

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
                    <div className="w-9 h-9 shrink-0 border border-paper-border dark:border-stone-700 bg-paper-light dark:stone-800 flex items-center justify-center text-oxblood dark:text-oxblood-light font-bold text-xs">
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
                          <span className="text-[10px] font-mono text-ink-muted dark:text-stone-400 shrink-0">
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

                      <div className="text-xs truncate">
                        {lastMsg ? (
                          <div className="flex items-center gap-1.5 truncate">
                            {isLastFromMe ? (
                              <>
                                <span className="font-semibold text-oxblood dark:text-oxblood-light shrink-0">Вы:</span>
                                <span className="text-stone-600 dark:text-stone-300 truncate">{lastMsg.content}</span>
                                <span className="ml-auto shrink-0 pl-1 flex items-center">
                                  {lastMsg.status === 'read' || lastMsg.isRead ? (
                                    <span title="Прочитано собеседником">
                                      <CheckCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                                    </span>
                                  ) : lastMsg.status === 'delivered' ? (
                                    <span title="Доставлено">
                                      <CheckCheck className="w-3.5 h-3.5 text-stone-400 dark:text-stone-500" />
                                    </span>
                                  ) : (
                                    <span title="Отправлено">
                                      <Check className="w-3.5 h-3.5 text-stone-400 dark:text-stone-500" />
                                    </span>
                                  )}
                                </span>
                              </>
                            ) : (
                              <span className="text-stone-600 dark:text-stone-300 truncate">{lastMsg.content}</span>
                            )}
                          </div>
                        ) : (
                          <span className="text-stone-400 italic">Нет сообщений</span>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </aside>

        {/* 
          ПРАВАЯ КОЛОНКА (АКТИВНЫЙ ЧАТ ИЛИ EMPTY STATE):
          display: flex; flex-direction: column; height: 100%; min-height: 0;
        */}
        <div className={`${activeChat ? 'flex' : 'hidden md:flex'} flex-1 flex-col h-full min-h-0 bg-paper-light/30 dark:bg-paper-dark/60`}>
          {activeChat ? (
            <>
              {/* 
                ШАПКА АКТИВНОГО ЧАТА:
                зафиксирована сверху (flex-shrink: 0)
              */}
              <div className="shrink-0 p-3.5 sm:p-4 border-b border-paper-border dark:border-paper-darkBorder bg-paper-card dark:bg-paper-darkCard flex items-start justify-between gap-3">
                <div className="flex items-start gap-2.5 min-w-0">
                  <button
                    type="button"
                    onClick={handleBackToList}
                    className="md:hidden mt-0.5 p-1 -ml-1 text-ink-muted hover:text-ink dark:text-stone-400 dark:hover:text-stone-200 transition-colors flex items-center gap-1"
                    title="Назад к списку чатов"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span className="text-[11px] font-mono uppercase tracking-wider">Назад</span>
                  </button>
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
                    const isMy = isMessageFromMe(msg);

                    return (
                      <div
                        key={msg.id}
                        className={`flex flex-col ${isMy ? 'items-end' : 'items-start'}`}
                      >
                        <div className="flex items-center gap-1.5 mb-1 px-1 text-[10px] font-mono text-ink-muted dark:text-stone-400">
                          <span className={`font-semibold ${isMy ? 'text-oxblood dark:text-oxblood-light' : 'text-ink dark:text-stone-300'}`}>
                            {isMy ? 'Вы' : msg.senderName}
                          </span>
                          <span>•</span>
                          <span className="uppercase text-[9px] text-oxblood dark:text-oxblood-light">
                            {msg.senderRole === 'hr' ? 'Компания' : 'Студент'}
                          </span>
                        </div>

                        <div
                          className={`max-w-[85%] sm:max-w-[70%] p-3.5 text-xs sm:text-sm leading-relaxed border shadow-2xs ${
                            isMy
                              ? 'bg-[#EDE5D8] dark:bg-[#27231E] text-ink dark:text-[#F5F2EB] border-[#CCC2AF] dark:border-[#423C34]'
                              : 'bg-paper-card dark:bg-[#181715] text-ink dark:text-ink-light border-paper-border dark:border-paper-darkBorder'
                          }`}
                        >
                          <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                          <div
                            className={`flex items-center justify-end gap-1.5 mt-1.5 text-[10px] font-mono ${
                              isMy ? 'text-stone-600 dark:text-stone-400' : 'text-stone-500 dark:text-stone-400'
                            }`}
                          >
                            <span>
                              {new Date(msg.createdAt).toLocaleTimeString('ru-RU', {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                            {isMy && (
                              <span
                                className="flex items-center ml-0.5"
                                title={
                                  msg.status === 'read' || msg.isRead
                                    ? 'Прочитано собеседником'
                                    : msg.status === 'delivered'
                                    ? 'Доставлено собеседнику'
                                    : 'Отправлено на сервер'
                                }
                              >
                                {msg.status === 'read' || msg.isRead ? (
                                  <CheckCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                                ) : msg.status === 'delivered' ? (
                                  <CheckCheck className="w-3.5 h-3.5 text-stone-500 dark:text-stone-400" />
                                ) : (
                                  <Check className="w-3.5 h-3.5 text-stone-400 dark:text-stone-500" />
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
                className="shrink-0 mt-auto p-3 sm:p-4 border-t border-paper-border dark:border-paper-darkBorder bg-paper-card dark:bg-paper-darkCard flex items-stretch gap-2.5"
              >
                <div className="flex-1 relative flex">
                  <textarea
                    rows={2}
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={`Написать сообщение от имени ${currentUserName}... (Enter для отправки)`}
                    className="block w-full p-2.5 text-xs sm:text-sm bg-paper-light dark:bg-paper-dark border border-paper-border dark:border-paper-darkBorder focus:outline-none focus:border-oxblood text-ink dark:text-ink-light placeholder:text-ink-muted/60 resize-none max-h-24 leading-normal"
                  />
                </div>

                <button
                  type="submit"
                  disabled={!text.trim()}
                  className="btn-editorial px-5 bg-ink text-paper-light dark:bg-paper-light dark:text-ink disabled:opacity-40 disabled:cursor-not-allowed text-xs font-mono uppercase tracking-wider transition flex items-center justify-center gap-1.5 cursor-pointer shrink-0 border border-ink dark:border-paper-light"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Отправить</span>
                </button>
              </form>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
              <div className="w-14 h-14 bg-paper-light dark:bg-stone-800 border border-paper-border dark:border-stone-700 flex items-center justify-center text-oxblood dark:text-oxblood-light mb-4">
                <MessageSquare className="w-7 h-7" />
              </div>
              <h3 className="text-base font-semibold text-ink dark:text-ink-light mb-1">
                Диалог не выбран
              </h3>
              <p className="text-xs font-mono text-ink-muted dark:text-stone-400 max-w-sm">
                Выберите нужный чат из списка слева, чтобы начать общение
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
