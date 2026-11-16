import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Sun, Moon, User } from 'lucide-react';
import type { Role, TabId, AppNotification } from '../types';
import { NotificationsDropdown } from './NotificationsDropdown';

interface HeaderProps {
  currentRole: Role;
  setRole?: (role: Role) => void;
  currentTab?: TabId;
  switchTab?: (tab: TabId) => void;
  isDark: boolean;
  toggleTheme: (event?: React.MouseEvent | { clientX: number; clientY: number }) => void;
  notifications?: AppNotification[];
  onMarkNotificationAsRead?: (id: string) => void;
  onMarkAllNotificationsAsRead?: () => void;
  onLogout?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentRole,
  currentTab,
  switchTab,
  isDark,
  toggleTheme,
  notifications = [],
  onMarkNotificationAsRead = () => {},
  onMarkAllNotificationsAsRead = () => {},
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const currentPath = location.pathname;

  const studentTabs: { id: TabId; label: string; path: string }[] = [
    { id: 'catalog', label: 'Каталог проектов', path: '/catalog' },
    { id: 'my-projects', label: 'Мои заявки', path: '/my-projects' },
    { id: 'chats', label: 'Чаты', path: '/chats' },
  ];

  const hrTabs: { id: TabId; label: string; path: string }[] = [
    { id: 'hr-dashboard', label: 'Панель управления', path: '/hr/dashboard' },
    { id: 'students-catalog', label: 'База студентов', path: '/students' },
    { id: 'chats', label: 'Чаты', path: '/chats' },
  ];

  const activeTabs = currentRole === 'student' ? studentTabs : hrTabs;

  const handleTabClick = (t: { id: TabId; path: string }) => {
    navigate(t.path);
    if (switchTab) {
      switchTab(t.id);
    }
  };

  const isTabActive = (t: { id: TabId; path: string }): boolean => {
    if (currentTab) {
      return currentTab === t.id;
    }
    if (t.path === '/catalog') {
      return currentPath === '/catalog' || currentPath === '/' || currentPath.startsWith('/projects');
    }
    if (t.path === '/hr/dashboard') {
      return currentPath.startsWith('/hr');
    }
    if (t.path === '/students') {
      return currentPath.startsWith('/students') || currentPath.startsWith('/resumes');
    }
    if (t.path === '/company/profile') {
      return currentPath.startsWith('/company');
    }
    return currentPath.startsWith(t.path);
  };

  const handleLogoClick = () => {
    const homePath = currentRole === 'student' ? '/catalog' : '/hr/dashboard';
    navigate(homePath);
    if (switchTab) {
      switchTab(currentRole === 'student' ? 'catalog' : 'hr-dashboard');
    }
  };

  const handleProfileClick = () => {
    const profilePath = currentRole === 'student' ? '/profile' : '/company/profile';
    navigate(profilePath);
    if (switchTab) {
      switchTab(currentRole === 'student' ? 'profile' : 'company-profile');
    }
  };

  return (
    <header className="sticky top-0 z-30 bg-paper-light/95 dark:bg-paper-dark/95 backdrop-blur-md double-rule-b transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="h-14 sm:h-16 flex items-center justify-between gap-3 sm:gap-6">
          {/* Левый блок: Логотип и академический статус */}
          <div className="flex items-center gap-3 shrink-0">
            <div
              onClick={handleLogoClick}
              className="cursor-pointer group select-none flex items-baseline gap-2"
              title="На главную страницу"
            >
              <span className="editorial-serif text-2xl sm:text-3xl font-bold tracking-tight text-ink dark:text-ink-light group-hover:opacity-85 transition">
                COLLAB<span className="italic font-normal">HUB</span>
              </span>
              <span className="hidden xl:inline text-[9px] font-mono uppercase tracking-[0.2em] text-meta">
                №01 • 2026
              </span>
            </div>

            <div className="hidden lg:flex items-center pl-3 border-l border-paper-border dark:border-paper-darkBorder">
              <span className="text-[9px] font-mono uppercase tracking-[0.15em] px-2 py-0.5 border border-paper-border dark:border-paper-darkBorder text-oxblood dark:text-oxblood-light bg-paper-card dark:bg-paper-darkCard">
                {currentRole === 'student' ? 'Студент' : 'Партнер'}
              </span>
            </div>
          </div>

          {/* Центр: Компактный рубрикатор (Навигационные вкладки) */}
          <nav
            id="main-nav"
            className="flex items-center gap-1 sm:gap-3 md:gap-5 overflow-x-auto h-full scrollbar-none font-sans"
          >
            {activeTabs.map((t) => {
              const isActive = isTabActive(t);
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => handleTabClick(t)}
                  className={`h-full px-2 sm:px-3.5 inline-flex items-center justify-center transition-colors whitespace-nowrap cursor-pointer select-none border-b-2 text-xs sm:text-[13px] md:text-sm font-medium ${
                    isActive
                      ? 'border-oxblood dark:border-oxblood-light text-oxblood dark:text-oxblood-light font-semibold'
                      : 'border-transparent text-stone-700 hover:text-ink dark:text-stone-200 dark:hover:text-white'
                  }`}
                >
                  {t.label}
                </button>
              );
            })}
          </nav>

          {/* Правый блок: Уведомления, Переключатель темы (Circular Reveal) и Профиль */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Уведомления */}
            <NotificationsDropdown
              notifications={notifications}
              onMarkAsRead={onMarkNotificationAsRead}
              onMarkAllAsRead={onMarkAllNotificationsAsRead}
            />

            {/* Переключатель темы со встроенным Circular Reveal */}
            <button
              id="theme-toggle-btn"
              type="button"
              onClick={(e) => toggleTheme(e)}
              title={isDark ? 'Переключить на светлую бумагу' : 'Переключить на темную печать'}
              className="w-8 h-8 sm:w-9 sm:h-9 shrink-0 border border-paper-border dark:border-paper-darkBorder bg-paper-card dark:bg-paper-darkCard text-ink dark:text-ink-light hover:border-ink dark:hover:border-stone-500 active:scale-95 transition-all flex items-center justify-center cursor-pointer select-none"
            >
              <div className="relative w-3.5 h-3.5 overflow-hidden shrink-0 flex items-center justify-center">
                <Sun
                  className={`w-3.5 h-3.5 text-brass absolute transition-all duration-300 ease-out ${
                    isDark
                      ? 'translate-y-4 opacity-0 rotate-90 scale-50'
                      : 'translate-y-0 opacity-100 rotate-0 scale-100'
                  }`}
                />
                <Moon
                  className={`w-3.5 h-3.5 text-brass absolute transition-all duration-300 ease-out ${
                    isDark
                      ? 'translate-y-0 opacity-100 rotate-0 scale-100'
                      : '-translate-y-4 opacity-0 -rotate-90 scale-50'
                  }`}
                />
              </div>
            </button>

            {/* Карточка профиля (вместо кнопки Logout в шапке) */}
            <div
              onClick={handleProfileClick}
              className={`flex items-center gap-2 sm:gap-2.5 cursor-pointer group select-none pl-2 sm:pl-3 border-l border-paper-border dark:border-paper-darkBorder ${
                currentPath.startsWith(currentRole === 'student' ? '/profile' : '/company')
                  ? 'text-oxblood dark:text-oxblood-light font-medium'
                  : ''
              }`}
              title="Перейти в личный профиль"
            >
              <div
                id="user-avatar"
                className={`w-8 h-8 sm:w-8.5 sm:h-8.5 border flex items-center justify-center transition-colors ${
                  currentPath.startsWith(currentRole === 'student' ? '/profile' : '/company')
                    ? 'border-oxblood dark:border-oxblood-light bg-oxblood/10 text-oxblood dark:text-oxblood-light'
                    : 'border-ink dark:border-ink-light bg-paper-muted dark:bg-paper-darkCard text-ink dark:text-ink-light group-hover:border-oxblood dark:group-hover:border-oxblood-light'
                }`}
              >
                <User className="w-4 h-4" />
              </div>
              <div className="hidden md:block text-left">
                <div
                  id="user-name"
                  className="text-xs font-semibold tracking-wide uppercase group-hover:text-oxblood dark:group-hover:text-oxblood-light transition-colors leading-tight"
                >
                  {currentRole === 'student' ? 'Сергиенко А.' : 'Валерия (HR)'}
                </div>
                <div
                  id="user-sub"
                  className="text-[9px] font-mono text-ink-muted dark:text-stone-300 leading-tight"
                >
                  {currentRole === 'student' ? 'ФИТ-231' : 'Софт Инжиниринг'}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
