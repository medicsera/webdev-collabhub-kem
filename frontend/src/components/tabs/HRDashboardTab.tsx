import React from 'react';
import { Plus } from 'lucide-react';
import type { Candidate } from '../../types';

interface HRDashboardTabProps {
  candidates: Candidate[];
  activeProjectsCount: number;
  totalApplicationsCount: number;
  onOpenCreateModal: () => void;
  onApproveCandidate: (candidateId: string) => void;
  onContactCandidate: (candidateName: string) => void;
}

export const HRDashboardTab: React.FC<HRDashboardTabProps> = ({
  candidates,
  activeProjectsCount,
  totalApplicationsCount,
  onOpenCreateModal,
  onApproveCandidate,
  onContactCandidate,
}) => {
  return (
    <section id="tab-hr-dashboard" className="fade-in space-y-8">
      {/* Шапка панели */}
      <div className="double-rule-b pb-5 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <div className="text-[11px] font-mono uppercase tracking-widest text-oxblood dark:text-oxblood-light mb-1">
            Кабинет работодателя • Компания: Софт Инжиниринг
          </div>
          <h2 className="text-3xl sm:text-4xl font-normal text-ink dark:text-ink-light">
            Управление проектными задачами и кандидатами
          </h2>
        </div>
        <button
          type="button"
          onClick={onOpenCreateModal}
          className="px-5 py-2.5 bg-ink text-paper-light dark:bg-ink-light dark:text-paper-dark hover:bg-oxblood dark:hover:bg-oxblood text-xs font-mono uppercase tracking-widest transition flex items-center gap-2 self-start sm:self-auto"
        >
          <Plus className="w-3.5 h-3.5" /> Добавить проект
        </button>
      </div>

      {/* Сводка (Статистика) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-px bg-paper-border dark:bg-paper-darkBorder border border-paper-border dark:border-paper-darkBorder">
        <div className="bg-paper-card dark:bg-paper-darkCard p-6">
          <div className="text-[11px] font-mono uppercase tracking-widest text-ink-muted dark:text-stone-400">
            Активных задач
          </div>
          <div className="editorial-serif text-4xl font-bold mt-2 text-ink dark:text-ink-light">
            {String(activeProjectsCount).padStart(2, '0')}
          </div>
          <div className="text-xs font-mono text-hunter dark:text-emerald-400 mt-2">
            ● Одобрено университетом
          </div>
        </div>
        <div className="bg-paper-card dark:bg-paper-darkCard p-6">
          <div className="text-[11px] font-mono uppercase tracking-widest text-ink-muted dark:text-stone-400">
            Заявок от студентов
          </div>
          <div className="editorial-serif text-4xl font-bold mt-2 text-oxblood dark:text-oxblood-light">
            {String(totalApplicationsCount).padStart(2, '0')}
          </div>
          <div className="text-xs font-mono text-ink-muted dark:text-stone-400 mt-2">
            Отсортировано по семантическому матчу
          </div>
        </div>
        <div className="bg-paper-card dark:bg-paper-darkCard p-6">
          <div className="text-[11px] font-mono uppercase tracking-widest text-ink-muted dark:text-stone-400">
            Департамент от компании
          </div>
          <div className="editorial-serif text-xl font-semibold mt-3 text-ink dark:text-ink-light">
            Департамент веб-разработки
          </div>
          <div className="text-xs font-mono text-ink-muted dark:text-stone-400 mt-2">
            Связь со студентами
          </div>
        </div>
      </div>

      {/* Список кандидатов */}
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
            Осенний семестр
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
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="editorial-serif text-2xl font-semibold text-ink dark:text-ink-light">
                      {c.name}
                    </span>
                    <span className="px-2.5 py-0.5 text-[10px] font-mono uppercase tracking-widest bg-hunter text-paper-light">
                      Совпадение: {c.match}%
                    </span>
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
                  <div className="flex flex-wrap gap-2 pt-1">
                    {c.stack.map((s) => (
                      <span
                        key={s}
                        className="px-3 py-1 text-xs font-mono font-medium border border-paper-border dark:border-paper-darkBorder bg-paper-light dark:bg-paper-dark text-ink dark:text-ink-light shadow-2xs"
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <button
                    type="button"
                    disabled={isAccepted}
                    onClick={() => onApproveCandidate(c.id)}
                    className={`px-4 py-2 text-[10px] font-mono uppercase tracking-widest transition ${
                      isAccepted
                        ? 'bg-paper-muted text-ink-muted dark:bg-paper-dark dark:text-stone-500 cursor-not-allowed'
                        : 'bg-oxblood hover:bg-oxblood-hover text-paper-light'
                    }`}
                  >
                    {isAccepted ? 'Приглашение отправлено' : 'Пригласить в проект'}
                  </button>
                  <button
                    type="button"
                    onClick={() => onContactCandidate(c.name)}
                    className="px-4 py-2 border border-paper-border dark:border-paper-darkBorder text-[10px] font-mono uppercase tracking-widest hover:border-ink dark:hover:border-stone-400 text-ink dark:text-ink-light transition"
                  >
                    Написать
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
