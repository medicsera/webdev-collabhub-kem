import React, { useMemo } from 'react';
import { MessageSquare, Users, Crown, FileText, CheckCircle2, Clock } from 'lucide-react';
import type { Project, ProjectApplication } from '../../types';
import { SkillBadge } from '../SkillBadge';
import { SemanticMatchBadge } from '../SemanticMatchBadge';
import { canUserAccessApplicationChat } from '../../utils/dbValidation';

interface MyProjectsTabProps {
  projects: Project[];
  applications?: ProjectApplication[];
  currentStudentId?: number | string;
  onOpenChat?: (chatId: string) => void;
  onViewCompany?: (companyId: number, companyName: string) => void;
}

export const MyProjectsTab: React.FC<MyProjectsTabProps> = ({
  projects,
  applications = [],
  currentStudentId = 1,
  onOpenChat,
  onViewCompany,
}) => {
  // Список поданных заявок, где текущий студент является LEAD или MEMBER (application_members)
  const myApplications = useMemo(() => {
    return applications.filter((app) =>
      canUserAccessApplicationChat(currentStudentId, 'student', app)
    );
  }, [applications, currentStudentId]);

  const hasApplications = myApplications.length > 0;

  const getApplicationStatusBadge = (status: ProjectApplication['status']) => {
    switch (status) {
      case 'ACCEPTED':
        return (
          <span className="px-3 py-1 text-[10px] font-mono uppercase tracking-widest bg-hunter text-white flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" /> Принят в проект
          </span>
        );
      case 'INTERVIEW':
        return (
          <span className="px-3 py-1 text-[10px] font-mono uppercase tracking-widest bg-brass text-white flex items-center gap-1">
            <Clock className="w-3 h-3" /> Приглашение на интервью
          </span>
        );
      case 'REVIEWING':
        return (
          <span className="px-3 py-1 text-[10px] font-mono uppercase tracking-widest border border-oxblood text-oxblood dark:text-oxblood-light flex items-center gap-1">
            <Clock className="w-3 h-3" /> На рассмотрении
          </span>
        );
      case 'REJECTED':
        return (
          <span className="px-3 py-1 text-[10px] font-mono uppercase tracking-widest bg-stone-500 text-white">
            Отклонен
          </span>
        );
      default:
        return (
          <span className="px-3 py-1 text-[10px] font-mono uppercase tracking-widest border border-brass text-brass">
            Новая заявка
          </span>
        );
    }
  };

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
          <div className="flex flex-wrap items-center gap-3">
            <span className="px-3 py-1 text-[11px] font-mono uppercase tracking-widest bg-hunter text-paper-light">
              Статус: Утверждено к защите (ВКР)
            </span>
            <span className="text-xs font-mono text-ink-muted dark:text-stone-400">
              Шифр: FIT-2026-CH
            </span>
            <SemanticMatchBadge score={98} size="sm" label="Семантический матч ВКР" />
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
              локальных больших языковых моделей (Qwen 2.5 + RuBERT).
            </p>
            <div className="pt-3 flex flex-wrap gap-2">
              {[
                { name: 'React', level: 'ADVANCED' as const },
                { name: 'TypeScript', level: 'ADVANCED' as const },
                { name: 'FastAPI', level: 'INTERMEDIATE' as const },
                { name: 'PostgreSQL + pgvector', level: 'ADVANCED' as const },
                { name: 'Docker', level: 'INTERMEDIATE' as const },
              ].map((skill) => (
                <SkillBadge key={skill.name} skill={skill} size="sm" />
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

      {/* Список отправленных заявок (applications + application_members + chats) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-paper-border dark:border-paper-darkBorder pb-2">
          <h3 className="text-2xl font-normal text-ink dark:text-ink-light">
            Отправленные отклики на проекты ({hasApplications ? myApplications.length : projects.filter((p) => p.applied).length})
          </h3>
          <span className="text-xs font-mono text-ink-muted">
            Командные и индивидуальные заявки (LEAD / MEMBER)
          </span>
        </div>

        <div
          id="student-applications-list"
          className="divide-y divide-paper-border dark:divide-paper-darkBorder border border-paper-border dark:border-paper-darkBorder bg-paper-card dark:bg-paper-darkCard transition-colors duration-300"
        >
          {hasApplications ? (
            myApplications.map((app) => {
              const project = projects.find((p) => p.id === app.projectId);
              if (!project) return null;

              const isLead = String(app.studentId) === String(currentStudentId);
              const isMember = app.members?.some((m) => String(m.studentId) === String(currentStudentId) && m.role === 'MEMBER');

              const skillsToDisplay =
                project.requiredSkills && project.requiredSkills.length > 0
                  ? project.requiredSkills
                  : project.tags.map((t) => ({ name: t, level: 'INTERMEDIATE' as const }));

              return (
                <div
                  key={app.id}
                  className="p-5 sm:p-6 space-y-4 hover:bg-paper-muted/30 dark:hover:bg-paper-dark/60 transition-colors"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-widest text-oxblood dark:text-oxblood-light">
                        <span>{project.index} •</span>
                        {onViewCompany && project.companyId ? (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onViewCompany(project.companyId!, project.company);
                            }}
                            className="flex items-center gap-1 hover:underline cursor-pointer group"
                            title={`Посмотреть профиль компании «${project.company}»`}
                          >
                            <span className="w-3.5 h-3.5 border border-oxblood/40 dark:border-oxblood-light/40 group-hover:border-oxblood flex items-center justify-center text-[8px] font-bold bg-paper-muted dark:bg-paper-dark">
                              {project.company.slice(0, 1)}
                            </span>
                            <span>{project.company}</span>
                          </button>
                        ) : (
                          <span>{project.company}</span>
                        )}
                        <span>• {project.type}</span>
                      </div>
                      <SemanticMatchBadge score={project.match} size="sm" />
                      {app.isTeam && (
                        <span className="px-2 py-0.5 text-[10px] font-mono uppercase tracking-wider bg-oxblood/10 text-oxblood dark:text-oxblood-light border border-oxblood/30 flex items-center gap-1">
                          <Users className="w-3 h-3" /> Командный отклик
                        </span>
                      )}
                      {isLead ? (
                        <span className="px-2 py-0.5 text-[10px] font-mono uppercase tracking-wider bg-brass/20 text-brass border border-brass/40 flex items-center gap-1 font-semibold">
                          <Crown className="w-3 h-3" /> Вы — Team Lead
                        </span>
                      ) : isMember ? (
                        <span className="px-2 py-0.5 text-[10px] font-mono uppercase tracking-wider bg-hunter/15 text-hunter dark:text-emerald-400 border border-hunter/30 font-semibold">
                          Вы — участник команды (MEMBER)
                        </span>
                      ) : null}
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {getApplicationStatusBadge(app.status)}
                    </div>
                  </div>

                  <div>
                    <h4 className="text-xl font-semibold text-ink dark:text-ink-light leading-snug">
                      {project.title}
                    </h4>
                    <p className="text-xs text-ink-muted dark:text-stone-300 mt-1 line-clamp-2">
                      {project.desc}
                    </p>
                  </div>

                  {/* Состав команды заявки (application_members) */}
                  {app.members && app.members.length > 0 && (
                    <div className="p-3 bg-paper-light dark:bg-paper-dark border border-paper-border dark:border-paper-darkBorder space-y-1.5">
                      <div className="text-[10px] font-mono uppercase tracking-widest text-ink-muted dark:text-stone-400 flex items-center gap-1.5">
                        <Users className="w-3 h-3 text-oxblood" />
                        Состав заявителей (application_members):
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {app.members.map((m) => (
                          <div
                            key={String(m.studentId)}
                            className="px-2.5 py-1 text-xs font-mono bg-paper-card dark:bg-stone-800 border border-paper-border dark:border-stone-700 flex items-center gap-1.5"
                          >
                            {m.role === 'LEAD' ? (
                              <Crown className="w-3 h-3 text-brass" />
                            ) : null}
                            <span className="font-medium text-ink dark:text-ink-light">
                              {m.studentName}
                            </span>
                            <span className="text-[9px] uppercase px-1 bg-oxblood text-white font-bold">
                              {m.role}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Сопроводительное письмо */}
                  {app.coverLetter && (
                    <div className="text-xs text-ink-muted dark:text-stone-300 bg-paper-muted/20 dark:bg-stone-900/40 p-3 border-l-2 border-oxblood">
                      <div className="text-[10px] font-mono uppercase tracking-widest text-oxblood dark:text-oxblood-light mb-1 flex items-center gap-1">
                        <FileText className="w-3 h-3" /> Сопроводительное письмо:
                      </div>
                      <p className="italic">«{app.coverLetter}»</p>
                    </div>
                  )}

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-paper-border/60 dark:border-paper-darkBorder/60">
                    <div className="flex flex-wrap gap-1.5">
                      {skillsToDisplay.map((skill) => (
                        <SkillBadge
                          key={typeof skill === 'string' ? skill : skill.name}
                          skill={skill}
                          size="sm"
                        />
                      ))}
                    </div>

                    {/* Задача 5: Кнопка чата с работодателем */}
                    {onOpenChat && (
                      <button
                        type="button"
                        onClick={() => onOpenChat(app.chatId || `chat-${app.id}`)}
                        className="px-4 py-2 bg-ink text-paper-light dark:bg-stone-200 dark:text-stone-900 hover:bg-oxblood dark:hover:bg-oxblood dark:hover:text-white text-xs font-mono uppercase tracking-wider transition flex items-center gap-2 cursor-pointer shadow-xs shrink-0"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>Чат с работодателем</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="p-8 text-center text-sm editorial-serif italic text-ink-muted dark:text-stone-400">
              У вас пока нет отправленных заявок. Выберите интересующий проект в каталоге.
            </div>
          )}
        </div>
      </div>
    </section>
  );
};
