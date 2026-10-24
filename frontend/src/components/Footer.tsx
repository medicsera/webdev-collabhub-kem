import React from 'react';

export const Footer: React.FC = () => {
  return (
    <footer className="mt-16 border-t border-paper-border dark:border-paper-darkBorder bg-paper-card dark:bg-paper-darkCard py-6 px-4 sm:px-8 text-xs text-ink-muted transition-colors duration-300">
      <div className="max-w-7xl mx-auto space-y-4">
        {/* Индексная строка */}
        <div className="border-b border-paper-border dark:border-paper-darkBorder pb-4 text-[11px] font-mono tracking-wider uppercase flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-4">
            <span>КЕМГУ × IT-ДИРЕКЦИЯ</span>
            <span className="hidden sm:inline">•</span>
            <span className="hidden sm:inline">ПРОЕКТЫ ВКР И СТАЖИРОВКИ</span>
            <span className="hidden md:inline">•</span>
            <span className="hidden md:inline">ОКТЯБРЬ 2026</span>
          </div>
          <div className="flex items-center gap-5">
            <span>
              ИНДЕКС СОВПАДЕНИЯ AI:{' '}
              <strong className="text-hunter dark:text-emerald-400">96.4%</strong>
            </span>
            <span className="hidden sm:inline">
              МОДЕЛЬ:{' '}
              <strong className="text-ink dark:text-ink-light">RuBERT + Qwen 2.5</strong>
            </span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
          <div className="editorial-serif italic text-base text-ink dark:text-stone-300">
            Выпускная квалификационная работа • Реестр проектной деятельности.
          </div>
          <div className="font-mono text-[11px] uppercase tracking-widest text-center sm:text-right">
            КемГУ • ФИТ-231 • Сергиенко А. &amp; Мирко А. • 2026
          </div>
        </div>
      </div>
    </footer>
  );
};
