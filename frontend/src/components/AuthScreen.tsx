import React, { useState } from 'react';
import {
  GraduationCap,
  Building2,
  Phone,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  Sun,
  Moon,
} from 'lucide-react';
import type { Role } from '../types';

interface AuthScreenProps {
  onLogin: (role: Role, phone?: string) => void;
  isDark: boolean;
  toggleTheme: () => void;
  themeTransition?: 'dawn' | 'sunset' | null;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({
  onLogin,
  isDark,
  toggleTheme,
  themeTransition,
}) => {
  const [selectedRole, setSelectedRole] = useState<Role>('student');
  const [phone, setPhone] = useState('');
  const [step, setStep] = useState<'input' | 'sms'>('input');
  const [smsCode, setSmsCode] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Форматирование номера телефона: +7 (XXX) XXX-XX-XX
  const formatPhoneNumber = (value: string) => {
    const digits = value.replace(/\D/g, '');
    let clean = digits;
    if (clean.startsWith('7') || clean.startsWith('8')) {
      clean = clean.slice(1);
    }
    clean = clean.slice(0, 10);

    let res = '+7';
    if (clean.length > 0) res += ` (${clean.slice(0, 3)}`;
    if (clean.length >= 3) res += `) ${clean.slice(3, 6)}`;
    if (clean.length >= 6) res += `-${clean.slice(6, 8)}`;
    if (clean.length >= 8) res += `-${clean.slice(8, 10)}`;
    return res;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    setError(null);
    if (!raw || raw === '+') {
      setPhone('');
      return;
    }
    setPhone(formatPhoneNumber(raw));
  };

  const handleSendCode = (e: React.FormEvent) => {
    e.preventDefault();
    const digitsOnly = phone.replace(/\D/g, '');
    if (digitsOnly.length < 11) {
      setError('Введите полный 11-значный номер телефона');
      return;
    }
    setStep('sms');
    setError(null);
  };

  const handleVerifySms = (e: React.FormEvent) => {
    e.preventDefault();
    if (smsCode.trim().length < 4) {
      setError('Введите 4-значный проверочный код (например 1234)');
      return;
    }
    onLogin(selectedRole, phone);
  };

  const handleQuickDemo = (role: Role) => {
    onLogin(role);
  };

  return (
    <div className="min-h-screen bg-paper-light dark:bg-paper-dark text-ink dark:text-ink-light flex flex-col justify-between selection:bg-oxblood selection:text-white transition-colors duration-300">
      {/* Шапка — идентична основному Header (без профиля) */}
      <header className="sticky top-0 z-30 bg-paper-light/95 dark:bg-paper-dark/95 backdrop-blur-sm double-rule-b transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-5 flex flex-col md:flex-row items-center justify-between gap-4 border-b border-paper-border dark:border-paper-darkBorder">
            {/* Левый блок-заглушка для симметрии с основным хедером */}
            <div className="hidden md:flex items-center gap-2">
              <span className="text-[10px] font-mono uppercase tracking-[0.2em] px-2.5 py-1 border border-paper-border dark:border-paper-darkBorder text-oxblood dark:text-oxblood-light bg-paper-card dark:bg-paper-darkCard">
                Вход в платформу
              </span>
            </div>

            {/* Центральный логотип (точная копия из Header) */}
            <div className="text-center select-none">
              <div className="text-[10px] font-mono uppercase tracking-[0.3em] text-oxblood dark:text-oxblood-light mb-0.5 transition-colors">
                Academic &amp; Industrial Registry
              </div>
              <div className="editorial-serif text-3xl sm:text-4xl font-bold tracking-tight text-ink dark:text-ink-light">
                THE COLLAB<span className="italic font-normal">HUB</span>
              </div>
            </div>

            {/* Правый блок: только кнопка темы (точная копия из Header) */}
            <div className="flex items-center self-end md:self-center">
              <button
                id="auth-theme-toggle"
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

                {/* Текстовая метка фиксированной ширины */}
                <div className="w-[50px] h-3.5 relative overflow-hidden shrink-0 flex items-center">
                  <span
                    className={`absolute inset-0 text-[10px] tracking-wider transition-all duration-500 ease-out flex items-center ${
                      isDark ? 'translate-y-3.5 opacity-0 pointer-events-none' : 'translate-y-0 opacity-100'
                    }`}
                  >
                    Светлая
                  </span>
                  <span
                    className={`absolute inset-0 text-[10px] tracking-wider transition-all duration-500 ease-out flex items-center ${
                      isDark ? 'translate-y-0 opacity-100' : '-translate-y-3.5 opacity-0 pointer-events-none'
                    }`}
                  >
                    Темная
                  </span>
                </div>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Центральный контент авторизации */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-10 sm:py-16 flex flex-col justify-center">
        <div className="text-center mb-10 space-y-2">
          <span className="text-[11px] font-mono uppercase tracking-[0.25em] text-oxblood dark:text-oxblood-light">
            Вход в академическо-индустриальный хаб
          </span>
          <h1 className="editorial-serif text-3xl sm:text-5xl font-normal leading-tight text-ink dark:text-ink-light">
            Вход и регистрация
          </h1>
          <p className="text-sm font-mono text-ink-muted dark:text-stone-400 max-w-lg mx-auto">
            Выберите, как вы хотите использовать платформу — как студент или индустриальный партнер
          </p>
        </div>

        {/* Выбор роли в стиле hh.ru (2 карточки) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          {/* Карточка: Студент */}
          <button
            type="button"
            onClick={() => setSelectedRole('student')}
            className={`p-6 text-left border-2 transition-all cursor-pointer bg-paper-card dark:bg-paper-darkCard flex flex-col justify-between relative group ${
              selectedRole === 'student'
                ? 'border-oxblood dark:border-oxblood-light ring-2 ring-oxblood/10 shadow-md'
                : 'border-paper-border dark:border-paper-darkBorder hover:border-ink/50 dark:hover:border-stone-400'
            }`}
          >
            {selectedRole === 'student' && (
              <span className="absolute top-3 right-3 text-oxblood dark:text-oxblood-light font-mono text-xs flex items-center gap-1 font-bold">
                <CheckCircle2 className="w-4 h-4" /> Выбрано
              </span>
            )}
            <div>
              <div className="w-12 h-12 mb-4 border border-paper-border dark:border-paper-darkBorder bg-paper-muted dark:bg-paper-dark flex items-center justify-center text-oxblood dark:text-oxblood-light">
                <GraduationCap className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-semibold mb-1 text-ink dark:text-ink-light">
                Я студент
              </h3>
              <p className="text-xs font-mono text-ink-muted dark:text-stone-400 leading-relaxed mb-4">
                Ищу практику, стажировку, тему ВКР или проект для диплома с компаниями Кузбасса
              </p>
            </div>
            <div className="pt-3 border-t border-paper-border/60 dark:border-paper-darkBorder/60 flex items-center justify-between text-xs font-mono uppercase tracking-wider text-ink-muted dark:text-stone-400 group-hover:text-ink dark:group-hover:text-stone-200">
              <span>Каталог и AI-подбор</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </button>

          {/* Карточка: Компания / HR */}
          <button
            type="button"
            onClick={() => setSelectedRole('hr')}
            className={`p-6 text-left border-2 transition-all cursor-pointer bg-paper-card dark:bg-paper-darkCard flex flex-col justify-between relative group ${
              selectedRole === 'hr'
                ? 'border-oxblood dark:border-oxblood-light ring-2 ring-oxblood/10 shadow-md'
                : 'border-paper-border dark:border-paper-darkBorder hover:border-ink/50 dark:hover:border-stone-400'
            }`}
          >
            {selectedRole === 'hr' && (
              <span className="absolute top-3 right-3 text-oxblood dark:text-oxblood-light font-mono text-xs flex items-center gap-1 font-bold">
                <CheckCircle2 className="w-4 h-4" /> Выбрано
              </span>
            )}
            <div>
              <div className="w-12 h-12 mb-4 border border-paper-border dark:border-paper-darkBorder bg-paper-muted dark:bg-paper-dark flex items-center justify-center text-hunter dark:text-emerald-400">
                <Building2 className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-semibold mb-1 text-ink dark:text-ink-light">
                Я работодатель
              </h3>
              <p className="text-xs font-mono text-ink-muted dark:text-stone-400 leading-relaxed mb-4">
                Ищу студентов на стажировки, публикую реальные производственные кейсы и задачи
              </p>
            </div>
            <div className="pt-3 border-t border-paper-border/60 dark:border-paper-darkBorder/60 flex items-center justify-between text-xs font-mono uppercase tracking-wider text-ink-muted dark:text-stone-400 group-hover:text-ink dark:group-hover:text-stone-200">
              <span>Реестр кандидатов и HR</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </button>
        </div>

        {/* Форма входа / регистрации по номеру телефона */}
        <div className="border border-paper-border dark:border-paper-darkBorder bg-paper-card dark:bg-paper-darkCard p-6 sm:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-paper-border dark:border-paper-darkBorder pb-4">
            <div>
              <h2 className="text-lg font-semibold text-ink dark:text-ink-light flex items-center gap-2">
                <Phone className="w-4 h-4 text-oxblood dark:text-oxblood-light" />
                Вход или быстрая регистрация по телефону
              </h2>
              <p className="text-xs font-mono text-ink-muted dark:text-stone-400 mt-0.5">
                Мы отправим проверочный SMS-код для безопасного входа
              </p>
            </div>
            <span className="text-[10px] font-mono uppercase tracking-widest text-hunter dark:text-emerald-400 bg-hunter/10 dark:bg-emerald-500/10 px-2 py-1 border border-hunter/20 dark:border-emerald-500/20 self-start sm:self-center">
              Без пароля
            </span>
          </div>

          {step === 'input' ? (
            <form onSubmit={handleSendCode} className="space-y-4">
              <div>
                <label
                  htmlFor="auth-phone-input"
                  className="block text-xs font-mono uppercase tracking-wider text-ink-muted dark:text-stone-400 mb-2"
                >
                  Номер телефона
                </label>
                <div className="relative">
                  <input
                    id="auth-phone-input"
                    type="tel"
                    placeholder="+7 (999) 000-00-00"
                    value={phone}
                    onChange={handlePhoneChange}
                    className="w-full px-4 py-3 bg-paper-light dark:bg-paper-dark border border-paper-border dark:border-paper-darkBorder text-ink dark:text-ink-light font-mono text-base tracking-wider focus:outline-none focus:border-oxblood dark:focus:border-oxblood-light transition"
                    autoFocus
                  />
                </div>
                {error && (
                  <p className="text-xs font-mono text-oxblood dark:text-oxblood-light mt-1.5">
                    {error}
                  </p>
                )}
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
                <button
                  id="auth-submit-phone"
                  type="submit"
                  className="px-6 py-3 bg-oxblood hover:bg-oxblood-hover text-white text-xs font-mono uppercase tracking-widest transition flex items-center justify-center gap-2 cursor-pointer shadow-xs font-semibold"
                >
                  <span>Продолжить</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
                <span className="text-[11px] font-mono text-ink-muted dark:text-stone-400 text-center sm:text-left">
                  Нажимая «Продолжить», вы соглашаетесь с условиями сервиса CollabHub
                </span>
              </div>
            </form>
          ) : (
            <form onSubmit={handleVerifySms} className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label
                    htmlFor="auth-sms-input"
                    className="block text-xs font-mono uppercase tracking-wider text-ink-muted dark:text-stone-400"
                  >
                    Код из SMS (для номера {phone})
                  </label>
                  <button
                    type="button"
                    onClick={() => setStep('input')}
                    className="text-xs font-mono text-oxblood dark:text-oxblood-light hover:underline cursor-pointer"
                  >
                    Изменить номер
                  </button>
                </div>
                <input
                  id="auth-sms-input"
                  type="text"
                  maxLength={6}
                  placeholder="1234"
                  value={smsCode}
                  onChange={(e) => {
                    setError(null);
                    setSmsCode(e.target.value.replace(/\D/g, ''));
                  }}
                  className="w-full sm:w-48 px-4 py-3 bg-paper-light dark:bg-paper-dark border border-paper-border dark:border-paper-darkBorder text-ink dark:text-ink-light font-mono text-xl tracking-[0.3em] text-center focus:outline-none focus:border-oxblood dark:focus:border-oxblood-light transition"
                  autoFocus
                />
                {error && (
                  <p className="text-xs font-mono text-oxblood dark:text-oxblood-light mt-1.5">
                    {error}
                  </p>
                )}
                <p className="text-[11px] font-mono text-ink-muted dark:text-stone-400 mt-2">
                  Тестовый режим: введите любой 4-значный код (например 1234)
                </p>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  id="auth-verify-code"
                  type="submit"
                  className="px-6 py-3 bg-oxblood hover:bg-oxblood-hover text-white text-xs font-mono uppercase tracking-widest transition flex items-center gap-2 cursor-pointer shadow-xs font-semibold"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>Войти как {selectedRole === 'student' ? 'Студент' : 'Компания'}</span>
                </button>
              </div>
            </form>
          )}

          {/* Быстрый вход в 1 клик для демонстрации */}
          <div className="pt-4 border-t border-paper-border/60 dark:border-paper-darkBorder/60 flex flex-wrap items-center justify-between gap-3">
            <span className="text-[11px] font-mono text-ink-muted dark:text-stone-400 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-brass" /> Быстрый демо-вход без ввода номера:
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => handleQuickDemo('student')}
                className="px-3 py-1.5 text-xs font-mono uppercase border border-paper-border dark:border-paper-darkBorder hover:border-ink dark:hover:border-stone-300 transition cursor-pointer"
              >
                Войти как Студент
              </button>
              <button
                type="button"
                onClick={() => handleQuickDemo('hr')}
                className="px-3 py-1.5 text-xs font-mono uppercase border border-paper-border dark:border-paper-darkBorder hover:border-ink dark:hover:border-stone-300 transition cursor-pointer"
              >
                Войти как Компания
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Простой подвал */}
      <footer className="border-t border-paper-border dark:border-paper-darkBorder py-4 px-4 text-center text-xs font-mono text-ink-muted dark:text-stone-400">
        CollabHub Kemerovo • Платформа совместной проектной деятельности вузов и индустрии
      </footer>

      {/* Атмосферный эффект рассвета и заката при переключении темы */}
      {themeTransition && (
        <div
          className={`fixed inset-0 pointer-events-none z-50 ${
            themeTransition === 'dawn' ? 'dawn-overlay' : 'sunset-overlay'
          }`}
          aria-hidden="true"
        />
      )}
    </div>
  );
};
