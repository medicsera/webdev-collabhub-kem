import React, { useState } from 'react';
import { Plus, Edit, Trash2, Building2, Users, FolderKanban } from 'lucide-react';
import type { Candidate, Project, SkillItem } from '../../types';
import { SkillBadge } from '../SkillBadge';
import { SemanticMatchBadge } from '../SemanticMatchBadge';

interface HRDashboardTabProps {
  candidates: Candidate[];
  projects: Project[];
  companyName?: string;
  onOpenCreateModal: () => void;
  onEditProject: (project: Project) => void;
  onDeleteProject: (projectId: number) => void;
  onApproveCandidate: (candidateId: string) => void;
  onContactCandidate: (candidateName: string) => void;
  onNavigateToCompanyProfile: () => void;
}

export const HRDashboardTab: React.FC<HRDashboardTabProps> = ({
  candidates,
  projects,
  companyName = 'Софт Инжиниринг',
  onOpenCreateModal,
  onEditProject,
  onDeleteProject,
  onApproveCandidate,
  onContactCandidate,
  onNavigateToCompanyProfile,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'projects' | 'candidates'>('projects');

  // Фильтруем проекты конкретно этой компании (Requirement 4)
  const myCompanyProjects = projects.filter(
    (p) => p.company.toLowerCase() === companyName.toLowerCase()
  );

  return (
    <section id="tab-hr-dashboard" className="fade-in space-y-8">
      {/* Шапка панели */}
      <div className="double-rule-b pb-5 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <div className="text-[11px] font-mono uppercase tracking-widest text-oxblood dark:text-oxblood-light mb-1">
            Кабинет работодателя • Компания: {companyName}
          </div>
          <h2 className="text-3xl sm:text-4xl font-normal text-ink dark:text-ink-light">
            Управление проектами компании и кандидатами
          </h2>
        </div>
        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
          <button
            type="button"
            onClick={onNavigateToCompanyProfile}
            className="px-4 py-2 border border-paper-border dark:border-paper-darkBorder hover:border-ink dark:hover:border-stone-400 text-xs font-mono uppercase tracking-widest text-ink dark:text-ink-light transition flex items-center gap-1.5 cursor-pointer"
          >
            <Building2 className="w-3.5 h-3.5" /> Профиль компании
          </button>
          <button
            type="button"
            onClick={onOpenCreateModal}
            className="px-5 py-2 bg-oxblood hover:bg-oxblood-hover text-white text-xs font-mono uppercase tracking-widest transition flex items-center gap-2 cursor-pointer shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" /> Добавить проект
          </button>
        </div>
      </div>

      {/* Сводка (Статистика) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-px bg-paper-border dark:bg-paper-darkBorder border border-paper-border dark:border-paper-darkBorder">
        <div className="bg-paper-card dark:bg-paper-darkCard p-6">
          <div className="text-[11px] font-mono uppercase tracking-widest text-ink-muted dark:text-stone-400">
            Задач нашей компании
          </div>
          <div className="editorial-serif text-4xl font-bold mt-2 text-ink dark:text-ink-light">
            {String(myCompanyProjects.length).padStart(2, '0')}
          </div>
          <div className="text-xs font-mono text-hunter dark:text-emerald-400 mt-2">
            ● Доступны для студентов КемГУ
          </div>
        </div>

        <div className="bg-paper-card dark:bg-paper-darkCard p-6">
          <div className="text-[11px] font-mono uppercase tracking-widest text-ink-muted dark:text-stone-400">
            Заявок от студентов
          </div>
          <div className="editorial-serif text-4xl font-bold mt-2 text-oxblood dark:text-oxblood-light">
            {String(candidates.length).padStart(2, '0')}
          </div>
          <div className="text-xs font-mono text-ink-muted dark:text-stone-400 mt-2">
            Отсортировано по семантическому матчу
          </div>
        </div>

        <div className="bg-paper-card dark:bg-paper-darkCard p-6">
          <div className="text-[11px] font-mono uppercase tracking-widest text-ink-muted dark:text-stone-400">
            Согласование с кафедрой
          </div>
          <div className="editorial-serif text-xl font-semibold mt-3 text-ink dark:text-ink-light">
            ФИТ-231 (IV курс)
          </div>
          <div className="text-xs font-mono text-ink-muted dark:text-stone-400 mt-2">
            Утверждение тем ВКР
          </div>
        </div>
      </div>

      {/* Переключение вкладок: Проекты компании / Кандидаты */}
      <div className="flex border-b border-paper-border dark:border-paper-darkBorder gap-2 sm:gap-6 text-xs uppercase font-mono tracking-wider">
        <button
          type="button"
          onClick={() => setActiveSubTab('projects')}
          className={`py-3 px-2 border-b-2 font-semibold transition-colors flex items-center gap-2 cursor-pointer ${
            activeSubTab === 'projects'
              ? 'border-oxblood text-oxblood dark:text-oxblood-light'
              : 'border-transparent text-ink-muted hover:text-ink dark:hover:text-white'
          }`}
        >
          <FolderKanban className="w-4 h-4" /> Проекты нашей компании ({myCompanyProjects.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveSubTab('candidates')}
          className={`py-3 px-2 border-b-2 font-semibold transition-colors flex items-center gap-2 cursor-pointer ${
            activeSubTab === 'candidates'
              ? 'border-oxblood text-oxblood dark:text-oxblood-light'
              : 'border-transparent text-ink-muted hover:text-ink dark:hover:text-white'
          }`}
        >
          <Users className="w-4 h-4" /> Заявки и кандидаты ({candidates.length})
        </button>
      </div>

      {/* Содержимое вкладки: Проекты компании (Requirement 4) */}
      {activeSubTab === 'projects' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-paper-muted/40 dark:bg-paper-dark/60 border border-paper-border dark:border-paper-darkBorder">
            <div className="text-xs font-mono text-ink-muted dark:text-stone-300">
              Показаны проекты компании <strong className="text-ink dark:text-white">{companyName}</strong>.
              Здесь вы можете редактировать стек, изменять требуемые уровни компетенций или удалять проекты.
            </div>
            <button
              type="button"
              onClick={onOpenCreateModal}
              className="px-4 py-2 bg-ink text-paper-light dark:bg-ink-light dark:text-paper-dark hover:bg-oxblood text-xs font-mono uppercase tracking-wider transition flex items-center gap-1.5 cursor-pointer shrink-0"
            >
              <Plus className="w-3.5 h-3.5" /> Новый проект
            </button>
          </div>

          {myCompanyProjects.length === 0 ? (
            <div className="p-12 text-center border border-paper-border dark:border-paper-darkBorder bg-paper-card dark:bg-paper-darkCard space-y-3">
              <p className="editorial-serif italic text-2xl text-ink-muted dark:text-stone-400">
                У вашей компании пока нет опубликованных проектов
              </p>
              <button
                type="button"
                onClick={onOpenCreateModal}
                className="px-5 py-2.5 bg-oxblood text-white font-mono text-xs uppercase tracking-wider cursor-pointer shadow-xs"
              >
                + Опубликовать первую задачу
              </button>
            </div>
          ) : (
            <div className="divide-y divide-paper-border dark:divide-paper-darkBorder border border-paper-border dark:border-paper-darkBorder bg-paper-card dark:bg-paper-darkCard">
              {myCompanyProjects.map((p) => {
                const skillsToDisplay =
                  p.requiredSkills && p.requiredSkills.length > 0
                    ? p.requiredSkills
                    : p.tags.map((t) => ({ name: t, level: 'INTERMEDIATE' as const }));

                return (
                  <div
                    key={p.id}
                    className="p-6 space-y-4 hover:bg-paper-muted/30 dark:hover:bg-paper-dark/50 transition"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-paper-border/60 dark:border-paper-darkBorder/60 pb-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-mono font-medium text-oxblood dark:text-oxblood-light">
                          {p.index} • {p.type} • Группа: {p.teamSize}
                        </span>
                        <SemanticMatchBadge score={p.match} size="sm" />
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => onEditProject(p)}
                          className="px-3 py-1.5 text-xs font-mono uppercase tracking-wider border border-paper-border dark:border-paper-darkBorder hover:border-ink dark:hover:border-stone-400 text-ink dark:text-ink-light transition flex items-center gap-1.5 cursor-pointer"
                        >
                          <Edit className="w-3.5 h-3.5" /> Редактировать
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (window.confirm(`Удалить проект «${p.title}»?`)) {
                              onDeleteProject(p.id);
                            }
                          }}
                          className="px-3 py-1.5 text-xs font-mono uppercase tracking-wider border border-oxblood/30 hover:bg-oxblood/10 text-oxblood dark:text-oxblood-light transition flex items-center gap-1.5 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" /> Удалить
                        </button>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <h3 className="text-xl sm:text-2xl font-semibold text-ink dark:text-ink-light">
                        {p.title}
                      </h3>
                      <p className="text-xs font-mono text-ink-muted dark:text-stone-400">
                        Отдел / Заказчик: <strong className="text-ink dark:text-white">{p.department}</strong>
                      </p>
                      <p className="text-sm text-ink-muted dark:text-stone-300 leading-relaxed font-normal pt-1">
                        {p.desc}
                      </p>
                    </div>

                    <div>
                      <div className="text-[10px] font-mono uppercase tracking-widest text-ink-muted dark:text-stone-400 mb-2">
                        Требуемый технологический стек и уровень компетенций:
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
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Содержимое вкладки: Кандидаты и заявки */}
      {activeSubTab === 'candidates' && (
        <div className="border border-paper-border dark:border-paper-darkBorder bg-paper-card dark:bg-paper-darkCard transition-colors duration-300">
          <div className="p-6 border-b border-paper-border dark:border-paper-darkBorder flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="text-2xl font-normal text-ink dark:text-ink-light">
                Список кандидатов и студенческих команд
              </h3>
              <p className="text-xs text-ink-muted dark:text-stone-400 font-mono mt-0.5">
                Ранжирование по семантическому матчу навыков и стека
              </p>
            </div>
            <span className="text-[11px] font-mono uppercase px-2.5 py-1 border border-paper-border dark:border-paper-darkBorder text-ink-muted dark:text-stone-400 self-start sm:self-auto">
              Осенний семестр 2026/2027
            </span>
          </div>

          <div
            id="hr-candidates-list"
            className="divide-y divide-paper-border dark:divide-paper-darkBorder"
          >
            {candidates.map((c) => {
              const isAccepted = c.status === 'Принят' || c.status === 'Приглашен';

              return (
                <div
                  key={c.id}
                  className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:bg-paper-muted/30 dark:hover:bg-paper-dark/60 transition"
                >
                  <div className="space-y-2.5">
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="editorial-serif text-2xl font-semibold text-ink dark:text-ink-light">
                        {c.name}
                      </span>
                      {/* Выделенный семантический матч (Requirement 3) */}
                      <SemanticMatchBadge score={c.match} size="sm" />
                      {isAccepted && (
                        <span className="px-2.5 py-0.5 text-[10px] font-mono uppercase tracking-widest border border-brass text-brass">
                          {c.status}
                        </span>
                      )}
                    </div>
                    <div className="text-xs font-mono text-ink-muted dark:text-stone-400">
                      {c.group} — Выбранный проект:{' '}
                      <strong className="text-ink dark:text-stone-200 font-normal underline">
                        {c.project}
                      </strong>
                    </div>
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {c.stack.map((s) => (
                        <SkillBadge
                          key={typeof s === 'string' ? s : s.name}
                          skill={s as string | SkillItem}
                          size="sm"
                        />
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <button
                      type="button"
                      disabled={isAccepted}
                      onClick={() => onApproveCandidate(c.id)}
                      className={`px-4 py-2 text-[10px] font-mono uppercase tracking-widest transition cursor-pointer ${
                        isAccepted
                          ? 'bg-paper-muted text-ink-muted dark:bg-paper-dark dark:text-stone-500 cursor-not-allowed'
                          : 'bg-oxblood hover:bg-oxblood-hover text-paper-light shadow-xs'
                      }`}
                    >
                      {isAccepted ? 'Приглашение отправлено' : 'Пригласить в проект'}
                    </button>
                    <button
                      type="button"
                      onClick={() => onContactCandidate(c.name)}
                      className="px-4 py-2 border border-paper-border dark:border-paper-darkBorder text-[10px] font-mono uppercase tracking-widest hover:border-ink dark:hover:border-stone-400 text-ink dark:text-ink-light transition cursor-pointer"
                    >
                      Написать
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
};
