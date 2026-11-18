import React from 'react';

export const Footer: React.FC = () => {
  return (
    <footer className="mt-0 double-rule-t bg-paper-dark text-paper-light transition-colors duration-300">
      <div className="max-w-7xl mx-auto">
        {/* Трехколоночный макет с вертикальными разделителями */}
        <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-paper-darkBorder">
          {/* Левая колонка: Информация об университете/платформе и цитата */}
          <div className="p-6 sm:p-8 flex flex-col justify-between space-y-4">
            <div>
              <div className="font-mono text-[10px] uppercase tracking-[0.25em] text-meta mb-2">
                КемГУ × IT-Дирекция
              </div>
              <div className="font-display text-xl font-bold tracking-tight text-paper-light mb-1">
                THE COLLAB<span className="italic font-normal">HUB</span>
              </div>
              <div className="font-mono text-[11px] uppercase tracking-wider text-meta">
                Реестр проектной деятельности и стажировок
              </div>
            </div>
            <div className="font-serif italic text-sm sm:text-base text-ink-light/90 leading-relaxed border-l-2 border-oxblood pl-3.5">
              «Выпускная квалификационная работа • Реестр проектной деятельности.»
            </div>
          </div>

          {/* Центральная колонка: Стек технологий в моноширинном стиле */}
          <div className="p-6 sm:p-8 flex flex-col justify-between space-y-4">
            <div>
              <div className="font-mono text-[10px] uppercase tracking-[0.25em] text-meta mb-2">
                Архитектура &amp; Технологии
              </div>
              <div className="font-mono text-xs uppercase tracking-wider text-ink-light mb-3">
                Технология векторного поиска
              </div>
              <div className="space-y-2 font-mono text-[11px] text-meta">
                <div className="flex items-center justify-between border-b border-paper-darkBorder/60 pb-1.5">
                  <span>Модель:</span>
                  <span className="text-paper-light font-medium">MiniLM-L12-v2</span>
                </div>
                <div className="flex items-center justify-between border-b border-paper-darkBorder/60 pb-1.5">
                  <span>Хранилище:</span>
                  <span className="text-paper-light font-medium">pgvector</span>
                </div>
                <div className="flex items-center justify-between border-b border-paper-darkBorder/60 pb-1.5">
                  <span>AI Провайдер:</span>
                  <span className="text-paper-light font-medium">GigaChat</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Интерфейс:</span>
                  <span className="text-paper-light font-medium">React 19 + Tailwind v4</span>
                </div>
              </div>
            </div>
          </div>

          {/* Правая колонка: Выходные данные / авторы */}
          <div className="p-6 sm:p-8 flex flex-col justify-between space-y-4">
            <div>
              <div className="font-mono text-[10px] uppercase tracking-[0.25em] text-meta mb-2">
                Выходные данные
              </div>
              <div className="font-mono text-xs uppercase tracking-widest text-paper-light font-semibold mb-3">
                КемГУ • Институт цифры
              </div>
              <div className="space-y-1.5 font-mono text-[11px] uppercase tracking-widest text-meta">
                <div>ФИТ-231 • IV курс</div>
                <div className="text-paper-light pt-2 border-t border-paper-darkBorder/60">
                  Сергиенко А. &amp; Мирко А.
                </div>
              </div>
            </div>
            <div className="font-mono text-[10px] uppercase tracking-widest text-meta">
              Кемерово • Ноябрь 2026
            </div>
          </div>
        </div>

        {/* Нижняя колонка: копирайт */}
        <div className="border-t border-paper-darkBorder py-4 px-6 sm:px-8 text-center sm:flex sm:items-center sm:justify-between text-[10px] font-mono uppercase tracking-widest text-meta">
          <div>© 2026 The CollabHub • Кемеровский государственный университет</div>
          <div className="mt-2 sm:mt-0">Academic &amp; Industrial Colophon</div>
        </div>
      </div>
    </footer>
  );
};
