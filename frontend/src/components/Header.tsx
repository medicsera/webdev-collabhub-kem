import React from 'react';
import { Sun, Moon, User } from 'lucide-react';
import type { Role, TabId } from '../types';

interface HeaderProps {
  currentRole: Role;
  setRole: (role: Role) => void;
  currentTab: TabId;
  switchTab: (tab: TabId) => void;
  isDark: boolean;
  toggleTheme: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentRole,
  setRole,
  currentTab,
  switchTab,
  isDark,
  toggleTheme,
}) => {
  const studentTabs: { id: TabId; label: string }[] = [
    { id: 'catalog', label: 'Каталог проектов' },
    { id: 'my-projects', label: 'Мои заявки и ВКР' },
    { id: 'profile', label: 'Мой профиль и ИИ' },
  ];

  const hrTabs: { id: TabId; label: string }[] = [
    { id: 'hr-dashboard', label: 'Панель компании' },
    { id: 'catalog', label: 'Каталог проектов' },
  ];

  const activeTabs = currentRole === 'student' ? studentTabs : hrTabs;

  return (
    <header className="sticky top-0 z-30 bg-paper-light/95 dark:bg-paper-dark/95 backdrop-blur-sm double-rule-b transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Основная полоса заголовка */}
        <div className="py-5 flex flex-col md:flex-row items-center justify-between gap-4 border-b border-paper-border dark:border-paper-darkBorder">
          {/* Выбор режима (Студент / Компания) */}
          <div className="flex items-center gap-2 self-start md:self-center">
            <span className="text-[10px] font-mono uppercase tracking-widest text-ink-muted dark:text-stone-400 mr-1">
              Режим:
            </span>
            <div className="inline-flex border border-paper-border dark:border-paper-darkBorder bg-paper-card dark:bg-paper-darkCard p-0.5">
              <button
                id="role-student-btn"
                type="button"
                onClick={() => setRole('student')}
                className={`px-3 py-1 text-xs font-medium tracking-wide transition-colors ${
                  currentRole === 'student'
                    ? 'bg-ink text-paper-light dark:bg-ink-light dark:text-paper-dark'
                    : 'text-ink-muted dark:text-stone-400 hover:text-ink dark:hover:text-white'
                }`}
              >
                Студент
              </button>
              <button
                id="role-hr-btn"
                type="button"
                onClick={() => setRole('hr')}
                className={`px-3 py-1 text-xs font-medium tracking-wide transition-colors ${
                  currentRole === 'hr'
                    ? 'bg-ink text-paper-light dark:bg-ink-light dark:text-paper-dark'
                    : 'text-ink-muted dark:text-stone-400 hover:text-ink dark:hover:text-white'
                }`}
              >
                Компания (HR)
              </button>
            </div>
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

          {/* Правый блок: Переключение темы и Профиль */}
          <div className="flex items-center gap-4 self-end md:self-center">
            <button
              type="button"
              onClick={toggleTheme}
              title="Переключить тему оформления"
              className="px-3 py-1.5 border border-paper-border dark:border-paper-darkBorder bg-paper-card dark:bg-paper-darkCard text-ink dark:text-ink-light hover:border-ink dark:hover:border-stone-500 transition flex items-center gap-1.5 text-xs font-mono uppercase"
            >
              {isDark ? (
                <Moon className="w-3.5 h-3.5 text-brass" />
              ) : (
                <Sun className="w-3.5 h-3.5 text-brass" />
              )}
              <span id="theme-label" className="text-[10px]">
                {isDark ? 'Темная' : 'Светлая'}
              </span>
            </button>

            <div
              onClick={() => switchTab(currentRole === 'student' ? 'profile' : 'hr-dashboard')}
              className="flex items-center gap-3 pl-4 border-l border-paper-border dark:border-paper-darkBorder cursor-pointer group select-none"
              title="Перейти в профиль"
            >
              <div
                id="user-avatar"
                className="w-9 h-9 border border-ink dark:border-ink-light bg-paper-muted dark:bg-paper-darkCard flex items-center justify-center text-ink dark:text-ink-light transition-colors"
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
