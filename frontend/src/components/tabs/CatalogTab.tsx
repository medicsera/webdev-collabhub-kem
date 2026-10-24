import React, { useState, useMemo } from 'react';
import { Search, Plus } from 'lucide-react';
import type { Project, Role, ProjectFormat } from '../../types';

interface CatalogTabProps {
  projects: Project[];
  currentRole: Role;
  onSelectProject: (project: Project) => void;
  onOpenCreateModal: () => void;
}

export const CatalogTab: React.FC<CatalogTabProps> = ({
  projects,
  currentRole,
  onSelectProject,
  onOpenCreateModal,
}) => {
  const [search, setSearch] = useState('');
  const [selectedFormat, setSelectedFormat] = useState<ProjectFormat>('all');
  const [selectedCompany, setSelectedCompany] = useState<string>('all');

  const companies = useMemo(() => {
    const set = new Set<string>();
    projects.forEach((p) => set.add(p.company));
    return Array.from(set);
  }, [projects]);

  const filteredProjects = useMemo(() => {
    const q = search.trim().toLowerCase();
    return projects.filter((p) => {
      const matchSearch =
        !q ||
        p.title.toLowerCase().includes(q) ||
        p.company.toLowerCase().includes(q) ||
        p.desc.toLowerCase().includes(q) ||
        p.tags.some((t) => t.toLowerCase().includes(q));

      const matchFormat = selectedFormat === 'all' || p.type === selectedFormat;
      const matchCompany = selectedCompany === 'all' || p.company === selectedCompany;

      return matchSearch && matchFormat && matchCompany;
    });
  }, [projects, search, selectedFormat, selectedCompany]);

  return (
    <section id="tab-catalog" className="fade-in space-y-8">
      {/* Передовица (Hero) */}
      <div className="border border-paper-border dark:border-paper-darkBorder bg-paper-card dark:bg-paper-darkCard p-6 sm:p-10 relative transition-colors duration-300">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-8 space-y-4 lg:border-r lg:border-paper-border dark:lg:border-paper-darkBorder lg:pr-8">
            <div className="flex items-center gap-3 text-[11px] font-mono uppercase tracking-widest text-oxblood dark:text-oxblood-light">
              <span>Каталог тем ВКР и стажировок</span>
              <span>—</span>
              <span>ИТ-компании Кузбасса</span>
            </div>
            <h1 className="text-3xl sm:text-5xl font-normal leading-[1.12] tracking-tight text-ink dark:text-ink-light">
              Выберите реальную задачу для своего{' '}
              <span className="italic font-semibold">диплома или стажировки</span>.
            </h1>
            <p className="text-ink-muted dark:text-stone-300 text-sm sm:text-base leading-relaxed max-w-2xl font-normal">
              Верифицированные темы от ведущих технологических компаний региона. Интеллектуальный
              подбор на основе вашего стека технологий и интересов.
            </p>
          </div>

          <div className="lg:col-span-4 space-y-4 flex flex-col justify-between">
            <div className="space-y-2">
              <div className="text-[11px] font-mono uppercase tracking-widest text-ink-muted dark:text-stone-400">
                Совет программы
              </div>
              <p className="editorial-serif italic text-lg leading-snug text-ink dark:text-stone-200">
                «Платформа помогает студентам находить актуальные задачи бизнеса, а компаниям —
                готовых молодых специалистов».
              </p>
            </div>

            {currentRole === 'hr' && (
              <div
                id="hero-hr-action"
                className="pt-4 border-t border-paper-border dark:border-paper-darkBorder fade-in"
              >
                <button
                  type="button"
                  onClick={onOpenCreateModal}
                  className="w-full py-3 px-5 bg-oxblood hover:bg-oxblood-hover text-paper-light text-xs font-mono uppercase tracking-widest transition flex items-center justify-center gap-2"
                >
                  <Plus className="w-4 h-4" /> Опубликовать новый проект
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Фильтры и поиск */}
      <div className="border-y border-paper-border dark:border-paper-darkBorder py-4 flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between transition-colors duration-300">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-ink-muted absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            id="search-input"
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Поиск по названию, компании или стеку (React, FastAPI, PostgreSQL)..."
            className="w-full pl-9 pr-4 py-2 text-sm bg-transparent border border-paper-border dark:border-paper-darkBorder focus:outline-none focus:border-ink dark:focus:border-ink-light placeholder:text-ink-muted/70 text-ink dark:text-ink-light"
          />
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <select
            id="filter-type"
            value={selectedFormat}
            onChange={(e) => setSelectedFormat(e.target.value as ProjectFormat)}
            className="text-xs font-mono uppercase tracking-wider px-3 py-2.5 bg-paper-card dark:bg-paper-darkCard border border-paper-border dark:border-paper-darkBorder focus:outline-none text-ink dark:text-ink-light cursor-pointer"
          >
            <option value="all">Все форматы</option>
            <option value="ВКР / Диплом">ВКР / Диплом</option>
            <option value="Стажировка">Стажировка</option>
            <option value="Курсовой проект">Курсовой проект</option>
          </select>
          <select
            id="filter-company"
            value={selectedCompany}
            onChange={(e) => setSelectedCompany(e.target.value)}
            className="text-xs font-mono uppercase tracking-wider px-3 py-2.5 bg-paper-card dark:bg-paper-darkCard border border-paper-border dark:border-paper-darkBorder focus:outline-none text-ink dark:text-ink-light cursor-pointer"
          >
            <option value="all">Все компании</option>
            {companies.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Сетка проектов */}
      {filteredProjects.length === 0 ? (
        <div className="p-12 text-center border border-paper-border dark:border-paper-darkBorder bg-paper-card dark:bg-paper-darkCard space-y-2">
          <p className="editorial-serif italic text-2xl text-ink-muted dark:text-stone-400">
            По заданным фильтрам проекты не найдены
          </p>
          <p className="text-xs font-mono text-ink-muted uppercase tracking-wider">
            Попробуйте изменить поисковый запрос или сбросить фильтры
          </p>
        </div>
      ) : (
        <div
          id="projects-grid"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px bg-paper-border dark:bg-paper-darkBorder border border-paper-border dark:border-paper-darkBorder"
        >
          {filteredProjects.map((p) => (
            <article
              key={p.id}
              className="bg-paper-card dark:bg-paper-darkCard p-6 sm:p-7 flex flex-col justify-between hover:bg-paper-muted/40 dark:hover:bg-paper-dark/80 transition-colors"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-paper-border dark:border-paper-darkBorder pb-2.5 text-[11px] font-mono">
                  <span className="uppercase tracking-widest text-oxblood dark:text-oxblood-light font-medium">
                    {p.index} • {p.company}
                  </span>
                  <span className="text-hunter dark:text-emerald-400 font-medium">
                    СЕМАНТИЧЕСКИЙ МАТЧ: {p.match}%
                  </span>
                </div>

                <div className="text-[10px] font-mono uppercase tracking-widest text-ink-muted dark:text-stone-400">
                  {p.type} — Группа: {p.teamSize}
                </div>

                <h3 className="text-2xl font-semibold leading-snug text-ink dark:text-ink-light">
                  {p.title}
                </h3>

                <p className="text-xs sm:text-sm text-ink-muted dark:text-stone-300 leading-relaxed line-clamp-3">
                  {p.desc}
                </p>
              </div>

              <div className="pt-6 mt-6 border-t border-paper-border dark:border-paper-darkBorder space-y-4">
                <div className="flex flex-wrap gap-1.5">
                  {p.tags.map((t) => (
                    <span
                      key={t}
                      className="px-2 py-0.5 text-[10px] font-mono border border-paper-border dark:border-paper-darkBorder bg-paper-light dark:bg-paper-dark text-ink-muted dark:text-stone-300"
                    >
                      {t}
                    </span>
                  ))}
                </div>

                <div className="flex items-center justify-between pt-2">
                  <span className="text-[11px] editorial-serif italic text-ink-muted dark:text-stone-400">
                    Заказчик: {p.department}
                  </span>
                  {p.applied ? (
                    <span className="px-3 py-1.5 text-[10px] font-mono uppercase tracking-widest bg-hunter text-paper-light">
                      Заявка отправлена
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => onSelectProject(p)}
                      className="px-4 py-1.5 text-[10px] font-mono uppercase tracking-widest border border-ink dark:border-ink-light text-ink dark:text-ink-light hover:bg-ink hover:text-paper-light dark:hover:bg-ink-light dark:hover:text-paper-dark transition"
                    >
                      Подробнее →
                    </button>
                  )}
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
};
