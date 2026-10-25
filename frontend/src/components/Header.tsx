import React from 'react';
import { Sun, Moon, User, LogOut } from 'lucide-react';
import type { Role, TabId } from '../types';

interface HeaderProps {
  currentRole: Role;
  setRole?: (role: Role) => void;
  currentTab: TabId;
  switchTab: (tab: TabId) => void;
  isDark: boolean;
  toggleTheme: () => void;
  onLogout?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentRole,
  currentTab,
  switchTab,
  isDark,
  toggleTheme,
  onLogout,
}) => {
  const studentTabs: { id: TabId; label: string }[] = [
    { id: 'catalog', label: 'Каталог проектов' },
    { id: 'my-projects', label: 'Мои заявки и ВКР' },
    { id: 'profile', label: 'Мой профиль и ИИ' },
  ];

  const hrTabs: { id: TabId; label: string }[] = [
    { id: 'hr-dashboard', label: 'Панель компании' },
    { id: 'company-profile', label: 'Профиль компании' },
    { id: 'catalog', label: 'Каталог проектов' },
  ];

  const activeTabs = currentRole === 'student' ? studentTabs : hrTabs;

  return (
    <header className="sticky top-0 z-30 bg-paper-light/95 dark:bg-paper-dark/95 backdrop-blur-sm double-rule-b transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Основная полоса заголовка */}
        <div className="py-5 flex flex-col md:flex-row items-center justify-between gap-4 border-b border-paper-border dark:border-paper-darkBorder">
          {/* Левый блок: академический бейдж */}
          <div className="hidden md:flex items-center gap-2">
            <span className="text-[10px] font-mono uppercase tracking-[0.2em] px-2.5 py-1 border border-paper-border dark:border-paper-darkBorder text-oxblood dark:text-oxblood-light bg-paper-card dark:bg-paper-darkCard">
              {currentRole === 'student' ? 'Студенческий доступ' : 'Индустриальный партнер'}
            </span>
          </div>

          {/* Центральный логотип */}
          <div
            onClick={() => switchTab('catalog')}
            className="cursor-pointer text-center group select-none"
          >
            <div className="text-[10px] font-mono uppercase tracking-[0.3em] text-oxblood dark:text-oxblood-light mb-0.5 transition-colors">
              Academic &amp; Industrial Registry
            </div>
            <div className="editorial-serif text-3xl sm:text-4xl font-bold tracking-tight text-ink dark:text-ink-light group-hover:opacity-80 transition">
              THE COLLAB<span className="italic font-normal">HUB</span>
            </div>
          </div>

          {/* Правый блок: Переключение темы и Профиль с выезжающей кнопкой выхода */}
          <div className="flex items-center gap-3 sm:gap-4 self-end md:self-center">
            <button
              id="theme-toggle-btn"
              type="button"
              onClick={toggleTheme}
              title={isDark ? 'Переключить тему (Рассвет)' : 'Переключить тему (Закат)'}
              className="w-[98px] h-[34px] shrink-0 border border-paper-border dark:border-paper-darkBorder bg-paper-card dark:bg-paper-darkCard text-ink dark:text-ink-light hover:border-ink dark:hover:border-stone-500 active:scale-95 transition-all duration-300 flex items-center justify-center gap-1.5 text-xs font-mono uppercase select-none relative overflow-hidden group shadow-xs cursor-pointer"
            >
              {/* Солнце и Луна с плавным восходом / закатом */}
              <div className="relative w-3.5 h-3.5 overflow-hidden shrink-0 flex items-center justify-center">
                <Sun
                  className={`w-3.5 h-3.5 text-brass absolute transition-all duration-500 ease-out ${
                    isDark
                      ? 'translate-y-4 opacity-0 rotate-90 scale-50'
                      : 'translate-y-0 opacity-100 rotate-0 scale-100'
                  }`}
                />
                <Moon
                  className={`w-3.5 h-3.5 text-brass absolute transition-all duration-500 ease-out ${
                    isDark
                      ? 'translate-y-0 opacity-100 rotate-0 scale-100'
                      : '-translate-y-4 opacity-0 -rotate-90 scale-50'
                  }`}
                />
              </div>

              {/* Текстовая метка */}
              <div className="w-[50px] h-3.5 relative overflow-hidden shrink-0 flex items-center">
                <span
                  id="theme-label-light"
                  className={`absolute inset-0 text-[10px] tracking-wider transition-all duration-500 ease-out flex items-center ${
                    isDark ? 'translate-y-3.5 opacity-0 pointer-events-none' : 'translate-y-0 opacity-100'
                  }`}
                >
                  Светлая
                </span>
                <span
                  id="theme-label-dark"
                  className={`absolute inset-0 text-[10px] tracking-wider transition-all duration-500 ease-out flex items-center ${
                    isDark ? 'translate-y-0 opacity-100' : '-translate-y-3.5 opacity-0 pointer-events-none'
                  }`}
                >
                  Темная
                </span>
              </div>
            </button>

            {/* Контейнер профиля с выезжающей кнопкой выхода при наведении */}
            <div className="relative group/profile flex items-center pl-3 sm:pl-4 border-l border-paper-border dark:border-paper-darkBorder">
              {/* Выезжающая кнопка выхода (выезжает слева/рядом при hover) */}
              <div className="overflow-hidden transition-all duration-300 ease-out max-w-0 opacity-0 group-hover/profile:max-w-[110px] group-hover/profile:opacity-100 mr-0 group-hover/profile:mr-2">
                <button
                  id="header-logout-btn"
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (onLogout) onLogout();
                  }}
                  title="Выйти из аккаунта"
                  className="px-2.5 py-1.5 bg-oxblood hover:bg-oxblood-hover text-white text-[11px] font-mono uppercase tracking-wider flex items-center gap-1.5 transition-colors whitespace-nowrap cursor-pointer shadow-xs"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Выйти</span>
                </button>
              </div>

              {/* Плашка профиля */}
              <div
                onClick={() => switchTab(currentRole === 'student' ? 'profile' : 'company-profile')}
                className="flex items-center gap-2.5 sm:gap-3 cursor-pointer group select-none"
                title="Перейти в профиль"
              >
                <div
                  id="user-avatar"
                  className="w-9 h-9 border border-ink dark:border-ink-light bg-paper-muted dark:bg-paper-darkCard flex items-center justify-center text-ink dark:text-ink-light transition-colors group-hover:border-oxblood dark:group-hover:border-oxblood-light"
                >
                  <User className="w-5 h-5" />
                </div>
                <div className="hidden sm:block text-left">
                  <div
                    id="user-name"
                    className="text-xs font-semibold tracking-wide uppercase group-hover:text-oxblood dark:group-hover:text-oxblood-light transition-colors"
                  >
                    {currentRole === 'student' ? 'Сергиенко А.' : 'Валерия (HR)'}
                  </div>
                  <div
                    id="user-sub"
                    className="text-[10px] font-mono text-ink-muted dark:text-stone-400"
                  >
                    {currentRole === 'student'
                      ? 'ФИТ-231 • IV курс'
                      : 'Софт Инжиниринг'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Рубрикатор (Навигация) */}
        <nav
          id="main-nav"
          className="flex items-center justify-center gap-2 sm:gap-8 py-2.5 overflow-x-auto text-xs uppercase tracking-[0.15em] font-medium"
        >
          {activeTabs.map((t) => {
            const isActive = currentTab === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => switchTab(t.id)}
                className={`px-3 py-1 transition-all whitespace-nowrap ${
                  isActive
                    ? 'text-oxblood dark:text-oxblood-light font-semibold border-b-2 border-oxblood'
                    : 'text-ink-muted hover:text-ink dark:hover:text-white'
                }`}
              >
                {t.label}
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
};
