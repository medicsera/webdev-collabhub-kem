import React from 'react';
import type { Project } from '../../types';

interface MyProjectsTabProps {
  projects: Project[];
}

export const MyProjectsTab: React.FC<MyProjectsTabProps> = ({ projects }) => {
  const appliedProjects = projects.filter((p) => p.applied);

  return (
    <section id="tab-my-projects" className="fade-in space-y-8">
      {/* Шапка раздела */}
      <div className="double-rule-b pb-4 flex flex-col sm:flex-row sm:items-end justify-between gap-2">
        <div>
          <div className="text-[11px] font-mono uppercase tracking-widest text-oxblood dark:text-oxblood-light">
            Личный кабинет студента
          </div>
          <h2 className="text-3xl sm:text-4xl font-normal mt-1 text-ink dark:text-ink-light">
            Активные исследования и поданные заявки
          </h2>
        </div>
        <div className="text-xs font-mono text-ink-muted dark:text-stone-400">
          Учебный год 2026/2027
        </div>
      </div>

      {/* Дипломный проект (ВКР) */}
      <div className="border border-paper-border dark:border-paper-darkBorder bg-paper-card dark:bg-paper-darkCard p-6 sm:p-8 transition-colors duration-300">
        <div className="flex flex-wrap items-center justify-between gap-4 pb-5 border-b border-paper-border dark:border-paper-darkBorder">
          <div className="flex items-center gap-3">
            <span className="px-3 py-1 text-[11px] font-mono uppercase tracking-widest bg-hunter text-paper-light">
              Статус: Утверждено к защите (ВКР)
            </span>
            <span className="text-xs font-mono text-ink-muted dark:text-stone-400">
              Шифр: FIT-2026-CH
            </span>
          </div>
          <span className="text-xs font-mono uppercase tracking-wider text-oxblood dark:text-oxblood-light font-medium">
            Срок сдачи: 15 Ноября 2026
          </span>
        </div>

        <div className="mt-6 grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-8 space-y-4">
            <h3 className="text-2xl sm:text-3xl font-semibold leading-snug text-ink dark:text-ink-light">
              Информационная система взаимодействия студентов и профильных организаций в сфере
              проектной деятельности
            </h3>
            <p className="text-sm text-ink-muted dark:text-stone-300 leading-relaxed font-normal">
              Проектирование и программная реализация веб-платформы с интеллектуальным микросервисом
              рекомендаций на базе векторного поиска (
              <span className="font-mono text-xs text-ink dark:text-stone-200">pgvector</span>) и
              локальных больших языковых моделей.
            </p>
            <div className="pt-3 flex flex-wrap gap-2">
              {['React', 'TypeScript', 'FastAPI', 'PostgreSQL + pgvector'].map((tech) => (
                <span
                  key={tech}
                  className="px-3.5 py-1.5 text-xs sm:text-sm font-mono font-medium border border-paper-border dark:border-paper-darkBorder bg-paper-light dark:bg-paper-dark text-ink dark:text-ink-light shadow-2xs"
                >
                  {tech}
                </span>
              ))}
            </div>
          </div>

          <div className="lg:col-span-4 bg-paper-muted/60 dark:bg-paper-dark p-5 border border-paper-border dark:border-paper-darkBorder space-y-4">
            <div className="text-[11px] font-mono uppercase tracking-widest text-ink-muted dark:text-stone-400 border-b border-paper-border dark:border-paper-darkBorder pb-2">
              Состав команды и заказчик
            </div>
            <div className="space-y-2.5 text-xs font-mono">
              <div className="flex justify-between items-center">
                <span className="text-ink-muted dark:text-stone-400">Разработчик / PM:</span>
                <span className="font-semibold text-ink dark:text-ink-light">Сергиенко А.</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-ink-muted dark:text-stone-400">Разработчик / ИИ:</span>
                <span className="font-semibold text-ink dark:text-ink-light">Мирко А.</span>
              </div>
              <div className="flex justify-between items-center pt-2.5 border-t border-paper-border dark:border-paper-darkBorder">
                <span className="text-ink-muted dark:text-stone-400">Отдел / Партнер:</span>
                <span className="editorial-serif italic text-base font-semibold text-oxblood dark:text-oxblood-light">
                  IT-дирекция КемГУ
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Список отправленных заявок */}
      <div className="space-y-4">
        <h3 className="text-2xl font-normal border-b border-paper-border dark:border-paper-darkBorder pb-2 text-ink dark:text-ink-light">
          Отправленные заявки на проекты
        </h3>
        <div
          id="student-applications-list"
          className="divide-y divide-paper-border dark:divide-paper-darkBorder border border-paper-border dark:border-paper-darkBorder bg-paper-card dark:bg-paper-darkCard transition-colors duration-300"
        >
          {appliedProjects.length === 0 ? (
            <div className="p-8 text-center text-sm editorial-serif italic text-ink-muted dark:text-stone-400">
              У вас пока нет отправленных заявок. Выберите интересующий проект в каталоге.
            </div>
          ) : (
            appliedProjects.map((p) => (
              <div
                key={p.id}
                className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-paper-muted/30 dark:hover:bg-paper-dark/60 transition-colors"
              >
                <div>
                  <div className="text-[10px] font-mono uppercase tracking-widest text-oxblood dark:text-oxblood-light">
                    {p.index} • {p.company} • {p.type}
                  </div>
                  <div className="editorial-serif text-xl font-semibold mt-0.5 text-ink dark:text-ink-light">
                    {p.title}
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="px-3 py-1 text-[10px] font-mono uppercase tracking-widest border border-brass text-brass">
                    На рассмотрении у компании
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </section>
  );
};
