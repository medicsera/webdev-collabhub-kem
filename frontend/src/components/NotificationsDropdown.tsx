import React, { useState, useRef, useEffect } from 'react';
import { Bell, UserPlus, UserCheck, Briefcase, Sparkles, Check, Info } from 'lucide-react';
import type { AppNotification } from '../types';

interface NotificationsDropdownProps {
  notifications: AppNotification[];
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
}

export const NotificationsDropdown: React.FC<NotificationsDropdownProps> = ({
  notifications,
  onMarkAsRead,
  onMarkAllAsRead,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const getIcon = (type: AppNotification['type']) => {
    switch (type) {
      case 'FRIEND_REQUEST':
        return <UserPlus className="w-4 h-4 text-oxblood dark:text-oxblood-light" />;
      case 'FRIEND_ACCEPTED':
        return <UserCheck className="w-4 h-4 text-hunter dark:text-emerald-400" />;
      case 'INTERVIEW_INVITE':
        return <Briefcase className="w-4 h-4 text-brass" />;
      case 'APPLICATION_STATUS_CHANGED':
        return <Sparkles className="w-4 h-4 text-oxblood dark:text-oxblood-light" />;
      default:
        return <Info className="w-4 h-4 text-ink-muted" />;
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        title="Уведомления платформы"
        className="w-[34px] h-[34px] shrink-0 border border-paper-border dark:border-paper-darkBorder bg-paper-card dark:bg-paper-darkCard text-ink dark:text-ink-light hover:border-ink dark:hover:border-stone-500 flex items-center justify-center transition-colors cursor-pointer relative shadow-xs"
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-oxblood text-white text-[9px] font-bold rounded-full flex items-center justify-center animate-pulse">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-paper-card dark:bg-paper-darkCard border-2 border-ink dark:border-stone-600 shadow-2xl z-50 fade-in flex flex-col max-h-[480px]">
          {/* Header */}
          <div className="px-4 py-3 border-b border-paper-border dark:border-paper-darkBorder flex items-center justify-between bg-paper-light dark:bg-paper-dark">
            <div className="text-xs font-mono uppercase tracking-widest font-semibold text-ink dark:text-ink-light flex items-center gap-1.5">
              <Bell className="w-3.5 h-3.5 text-oxblood dark:text-oxblood-light" />
              <span>Уведомления ({unreadCount} новых)</span>
            </div>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={onMarkAllAsRead}
                className="text-[10px] font-mono uppercase tracking-wider text-oxblood dark:text-oxblood-light hover:underline cursor-pointer flex items-center gap-1"
              >
                <Check className="w-3 h-3" /> Прочитать все
              </button>
            )}
          </div>

          {/* List */}
          <div className="overflow-y-auto divide-y divide-paper-border dark:divide-paper-darkBorder overscroll-contain">
            {notifications.length === 0 ? (
              <div className="p-6 text-center text-xs font-mono text-ink-muted dark:text-stone-400">
                Уведомлений нет
              </div>
            ) : (
              notifications.map((notif) => (
                <div
                  key={notif.id}
                  onClick={() => onMarkAsRead(notif.id)}
                  className={`p-3.5 transition-colors cursor-pointer flex items-start gap-3 ${
                    notif.isRead
                      ? 'bg-transparent opacity-75 hover:bg-paper-muted/30 dark:hover:bg-paper-dark/50'
                      : 'bg-oxblood/5 dark:bg-oxblood/10 hover:bg-oxblood/10 font-medium'
                  }`}
                >
                  <div className="mt-0.5 shrink-0 p-1.5 bg-paper-light dark:bg-paper-dark border border-paper-border dark:border-paper-darkBorder">
                    {getIcon(notif.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <h4 className="text-xs font-semibold text-ink dark:text-ink-light truncate">
                        {notif.title}
                      </h4>
                      {!notif.isRead && (
                        <span className="w-2 h-2 rounded-full bg-oxblood shrink-0" />
                      )}
                    </div>
                    <p className="text-[11px] text-ink-muted dark:text-stone-300 mt-1 leading-snug">
                      {notif.body}
                    </p>
                    <div className="text-[9px] font-mono text-stone-400 mt-1.5">
                      {new Date(notif.createdAt).toLocaleDateString('ru-RU', {
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

