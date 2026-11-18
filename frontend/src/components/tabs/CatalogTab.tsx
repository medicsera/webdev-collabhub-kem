import React, { useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Search, Plus, RotateCcw, ChevronDown, Check } from 'lucide-react';
import type { Project, Role, ProjectFormat, StudentProfile } from '../../types';
import { SkillBadge } from '../SkillBadge';
import { SemanticMatchBadge } from '../SemanticMatchBadge';
import { useSemanticMatches } from '../../hooks/useSemanticMatches';

interface CatalogTabProps {
  projects: Project[];
  currentRole: Role;
  onSelectProject?: (project: Project) => void;
  onOpenCreateModal?: () => void;
  /** Текущий студент — для векторного матча «я ↔ проект» */
  studentProfile?: StudentProfile;
  onViewCompany?: (companyId: number, companyName: string) => void;
}

export const CatalogTab: React.FC<CatalogTabProps> = ({
  projects,
  currentRole,
  studentProfile,
  onSelectProject,
  onOpenCreateModal,
  onViewCompany,
}) => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const search = searchParams.get('q') || '';
  const selectedFormat = (searchParams.get('format') as ProjectFormat) || 'all';
  const selectedCompany = searchParams.get('company') || 'all';

  const updateFilters = (updates: { q?: string; format?: string; company?: string }) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (updates.q !== undefined) {
        if (updates.q) next.set('q', updates.q);
        else next.delete('q');
      }
      if (updates.format !== undefined) {
        if (updates.format && updates.format !== 'all') next.set('format', updates.format);
        else next.delete('format');
      }
      if (updates.company !== undefined) {
        if (updates.company && updates.company !== 'all') next.set('company', updates.company);
        else next.delete('company');
      }
      return next;
    }, { replace: true });
  };

  const handleResetFilters = () => {
    setSearchParams({}, { replace: true });
  };

  // Векторный матч текущего студента с каждым проектом (MiniLM embeddings)
  const studentForMatch = useMemo(
    () => (currentRole === 'student' && studentProfile ? [studentProfile] : []),
    [currentRole, studentProfile],
  );
  const { getScore, status: semanticStatus } = useSemanticMatches(studentForMatch, projects);

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
        p.tags.some((t) => t.toLowerCase().includes(q)) ||
        (p.requiredSkills &&
          p.requiredSkills.some((s) => s.name.toLowerCase().includes(q)));

      const matchFormat = selectedFormat === 'all' || p.type === selectedFormat;
      const matchCompany = selectedCompany === 'all' || p.company === selectedCompany;

      return matchSearch && matchFormat && matchCompany;
    });
  }, [projects, search, selectedFormat, selectedCompany]);

  const handleCreateClick = () => {
    if (onOpenCreateModal) {
      onOpenCreateModal();
    } else {
      navigate('/hr/projects/create');
    }
  };

  const handleCompanyClick = (companyId: number, companyName: string) => {
    if (onViewCompany) {
      onViewCompany(companyId, companyName);
    } else {
      navigate(`/companies/${companyId}`);
    }
  };

  return (
    <section id="tab-catalog" className="space-y-6 sm:space-y-8">
      {/* Передовица (Hero) */}
      <div className="border border-paper-border dark:border-paper-darkBorder bg-paper-card dark:bg-paper-darkCard p-6 sm:p-9 relative transition-colors duration-300">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-8 space-y-3.5 lg:border-r lg:border-paper-border dark:lg:border-paper-darkBorder lg:pr-8">
            <div className="flex items-center gap-3 text-[11px] font-mono uppercase tracking-widest text-oxblood dark:text-oxblood-light">
              <span>Каталог тем ВКР и стажировок</span>
              <span>—</span>
              <span>ИТ-индустрия региона</span>
            </div>
            <h1 className="text-3xl sm:text-5xl font-normal leading-[1.1] tracking-tight text-ink dark:text-ink-light">
              Выберите реальную задачу для своего{' '}
              <span className="italic font-semibold">диплома или стажировки</span>.
            </h1>
            <p className="text-ink-muted dark:text-stone-300 text-sm sm:text-base leading-relaxed max-w-2xl font-normal">
              Верифицированные темы от ведущих технологических компаний региона. Интеллектуальный
              семантический подбор на основе вашего стека технологий и уровня компетенций.
            </p>
          </div>

          <div className="lg:col-span-4 space-y-4 flex flex-col justify-between">
            <div className="space-y-2">
              <div className="text-[11px] font-mono uppercase tracking-widest text-ink-muted dark:text-stone-400">
                Совет программы
              </div>
              <p className="editorial-serif italic text-lg leading-snug text-ink dark:text-stone-200">
                «Платформа помогает студентам находить актуальные задачи бизнеса, а компаниям —
                готовых молодых специалистов с требуемым уровнем навыков».
              </p>
            </div>

            {currentRole === 'hr' && (
              <div
                id="hero-hr-action"
                className="pt-4 border-t border-paper-border dark:border-paper-darkBorder"
              >
                <button
                  type="button"
                  onClick={handleCreateClick}
                  className="btn-editorial w-full py-3 px-5 bg-ink text-paper-light dark:bg-paper-light dark:text-ink text-xs font-mono uppercase tracking-widest transition flex items-center justify-center gap-2 cursor-pointer border border-ink dark:border-paper-light"
                >
                  <Plus className="w-4 h-4" /> Опубликовать новый проект
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Фильтры и поиск */}
      <div className="border-y border-paper-border dark:border-paper-darkBorder py-3.5 flex flex-col md:flex-row gap-3.5 items-stretch md:items-center justify-between transition-colors duration-300">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-ink-muted absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            id="search-input"
            type="text"
            value={search}
            onChange={(e) => updateFilters({ q: e.target.value })}
            placeholder="Поиск по названию, компании или стеку (React, FastAPI, PostgreSQL)..."
            className="w-full pl-9 pr-4 py-2 text-sm bg-transparent border border-paper-border dark:border-paper-darkBorder focus:outline-none focus:border-ink dark:focus:border-ink-light placeholder:text-ink-muted/70 text-ink dark:text-ink-light font-mono text-xs"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="relative inline-flex items-center">
            <select
              id="filter-type"
              value={selectedFormat}
              onChange={(e) => updateFilters({ format: e.target.value })}
              className="appearance-none text-xs font-mono uppercase tracking-wider pl-3.5 pr-9 py-2 bg-paper-card dark:bg-paper-darkCard border border-paper-border dark:border-paper-darkBorder focus:outline-none focus:border-oxblood text-ink dark:text-ink-light cursor-pointer"
            >
              <option value="all">Все форматы</option>
              <option value="ВКР / Диплом">ВКР / Диплом</option>
              <option value="Стажировка">Стажировка</option>
              <option value="Курсовой проект">Курсовой проект</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 absolute right-3 pointer-events-none text-ink-muted dark:text-stone-400" />
          </div>

          <div className="relative inline-flex items-center">
            <select
              id="filter-company"
              value={selectedCompany}
              onChange={(e) => updateFilters({ company: e.target.value })}
              className="appearance-none text-xs font-mono uppercase tracking-wider pl-3.5 pr-9 py-2 bg-paper-card dark:bg-paper-darkCard border border-paper-border dark:border-paper-darkBorder focus:outline-none focus:border-oxblood text-ink dark:text-ink-light cursor-pointer"
            >
              <option value="all">Все компании</option>
              {companies.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 absolute right-3 pointer-events-none text-ink-muted dark:text-stone-400" />
          </div>
        </div>
      </div>

      {/* Сетка проектов (динамически обновляемый модуль div) */}
      <div id="catalog-projects-container" className="transition-opacity duration-200">
        {filteredProjects.length === 0 ? (
          <div className="p-12 text-center border border-paper-border dark:border-paper-darkBorder bg-paper-card dark:bg-paper-darkCard space-y-3">
            <p className="editorial-serif italic text-2xl text-ink-muted dark:text-stone-400">
              По заданным фильтрам проекты не найдены
            </p>
            <p className="text-xs font-mono text-ink-muted uppercase tracking-wider">
              Попробуйте изменить поисковый запрос или сбросить фильтры
            </p>
            <div>
              <button
                type="button"
                onClick={handleResetFilters}
                className="btn-editorial mt-2 px-4 py-2 bg-ink text-paper-light dark:bg-paper-light dark:text-ink text-xs font-mono uppercase tracking-wider transition-colors cursor-pointer inline-flex items-center gap-1.5 border border-ink dark:border-paper-light"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Сбросить фильтры
              </button>
            </div>
          </div>
        ) : (
          <div
            id="projects-grid"
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {filteredProjects.map((p) => {
              const skillsToDisplay =
                p.requiredSkills && p.requiredSkills.length > 0
                  ? p.requiredSkills
                  : p.tags.map((t) => ({ name: t, level: 'INTERMEDIATE' as const }));

              // Приоритет: векторный счёт ai-service, иначе локальная эвристика проекта
              const aiScore =
                studentForMatch.length > 0 && studentProfile
                  ? getScore(studentProfile, p)
                  : undefined;
              const matchScore = aiScore ?? p.match;
              const aiPowered = aiScore !== undefined;

              return (
                <article
                  key={p.id}
                  className="border border-paper-border dark:border-paper-darkBorder bg-paper-card dark:bg-paper-darkCard p-6 sm:p-7 flex flex-col justify-between hover:border-ink dark:hover:border-paper-light transition-colors relative"
                >
                  <div className="space-y-4 relative z-10">
                    {/* Заголовок карточки с выделенным семантическим матчем */}
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-paper-border dark:border-paper-darkBorder pb-2.5 text-[11px] font-mono">
                      <div className="flex items-center gap-2">
                        <span className="uppercase tracking-widest text-oxblood dark:text-oxblood-light font-medium">
                          {p.index}
                        </span>
                        <span className="text-paper-border dark:text-paper-darkBorder">•</span>
                        {p.companyId ? (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCompanyClick(p.companyId!, p.company);
                            }}
                            className="flex items-center gap-1.5 font-medium text-ink dark:text-ink-light hover:text-oxblood dark:hover:text-oxblood-light transition cursor-pointer group"
                            title={`Посмотреть профиль компании «${p.company}»`}
                          >
                            <span className="w-4 h-4 border border-paper-border dark:border-paper-darkBorder group-hover:border-oxblood flex items-center justify-center text-[9px] font-bold bg-paper-muted dark:bg-paper-dark">
                              {p.company.slice(0, 1)}
                            </span>
                            <span className="uppercase tracking-widest">{p.company}</span>
                          </button>
                        ) : (
                        <span className="uppercase tracking-widest text-ink dark:text-ink-light font-medium">
                          {p.company}
                        </span>
                      )}
                    </div>
                    <SemanticMatchBadge
                      score={matchScore}
                      size="sm"
                      aiPowered={aiPowered}
                      pending={studentForMatch.length > 0 && semanticStatus === 'loading' && !aiPowered}
                    />
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

                <div className="pt-6 mt-6 border-t border-paper-border dark:border-paper-darkBorder space-y-4 relative z-10">
                  {/* Требуемые навыки и уровни владения */}
                  <div>
                    <div className="text-[10px] font-mono uppercase tracking-widest text-ink-muted dark:text-stone-400 mb-2">
                      Требуемый стек и уровень:
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {skillsToDisplay.map((skill) => (
                        <SkillBadge
                          key={typeof skill === 'string' ? skill : skill.name}
                          skill={skill}
                          size="sm"
                        />
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 border-t border-paper-border/60 dark:border-paper-darkBorder/60">
                    <div className="text-sm sm:text-base editorial-serif text-ink-muted dark:text-stone-300 leading-snug">
                      Заказчик:{' '}
                      <strong className="font-bold text-ink dark:text-ink-light not-italic">
                        {p.department}
                      </strong>
                    </div>
                    {p.applied ? (
                      <button
                        type="button"
                        onClick={() => (onSelectProject ? onSelectProject(p) : undefined)}
                        className="btn-editorial px-3 py-1.5 text-[10px] font-mono uppercase tracking-widest bg-hunter text-paper-light font-semibold border border-hunter hover:bg-hunter/90 transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                        title="Посмотреть подробное описание проекта и статус поданной заявки"
                      >
                        <Check className="w-3 h-3" />
                        <span>Заявка подана</span>
                        <span className="opacity-75 text-[9px]">→</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => (onSelectProject ? onSelectProject(p) : undefined)}
                        className="btn-editorial px-4 py-1.5 text-[10px] font-mono uppercase tracking-widest border border-ink dark:border-ink-light text-ink dark:text-ink-light hover:bg-ink hover:text-paper-light dark:hover:bg-paper-light dark:hover:text-ink transition cursor-pointer"
                      >
                        Подробнее →
                      </button>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
      </div>
    </section>
  );
};
