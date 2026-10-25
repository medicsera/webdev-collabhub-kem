import React from 'react';
import {
  Building2,
  ExternalLink,
  Mail,
  Send,
  Edit,
  CheckCircle2,
  Award,
  Plus,
  LogOut,
} from 'lucide-react';
import type { CompanyProfile, Project } from '../../types';
import { SkillBadge } from '../SkillBadge';
import { SemanticMatchBadge } from '../SemanticMatchBadge';

interface CompanyProfileTabProps {
  company: CompanyProfile;
  projects: Project[];
  onOpenEditModal: () => void;
  onOpenCreateProjectModal: () => void;
  onEditProject: (project: Project) => void;
  onLogout?: () => void;
}

export const CompanyProfileTab: React.FC<CompanyProfileTabProps> = ({
  company,
  projects,
  onOpenEditModal,
  onOpenCreateProjectModal,
  onEditProject,
  onLogout,
}) => {
  const companyProjects = projects.filter(
    (p) => p.company.toLowerCase() === company.name.toLowerCase()
  );

  return (
    <section id="tab-company-profile" className="fade-in space-y-8">
      {/* Шапка раздела */}
      <div className="double-rule-b pb-4 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <div className="text-[11px] font-mono uppercase tracking-widest text-oxblood dark:text-oxblood-light flex items-center gap-1.5">
            <Building2 className="w-3.5 h-3.5" /> Карточка работодателя и партнера университета
          </div>
          <h2 className="text-3xl sm:text-4xl font-normal mt-1 text-ink dark:text-ink-light">
            Профиль компании и условия практики
          </h2>
        </div>
        <button
          type="button"
          onClick={onOpenEditModal}
          className="px-4 py-2 bg-ink text-paper-light dark:bg-ink-light dark:text-paper-dark hover:bg-oxblood dark:hover:bg-oxblood text-xs font-mono uppercase tracking-widest transition flex items-center gap-2 self-start sm:self-auto cursor-pointer shadow-xs"
        >
          <Edit className="w-3.5 h-3.5" /> Редактировать профиль компании
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Левая колонка: Визитка компании и контакты HR */}
        <div className="lg:col-span-5 space-y-6">
          <div className="border border-paper-border dark:border-paper-darkBorder bg-paper-card dark:bg-paper-darkCard p-6 sm:p-7 space-y-6">
            <div className="flex items-start gap-4 border-b border-paper-border dark:border-paper-darkBorder pb-5">
              <div className="w-16 h-16 border-2 border-ink dark:border-ink-light bg-paper-muted dark:bg-paper-dark flex items-center justify-center text-ink dark:text-ink-light shrink-0 text-2xl font-bold font-serif">
                {company.name.slice(0, 2).toUpperCase()}
              </div>
              <div>
                <h3 className="text-2xl font-semibold leading-tight text-ink dark:text-ink-light">
                  {company.name}
                </h3>
                <p className="text-xs font-mono text-oxblood dark:text-oxblood-light mt-1">
                  {company.department}
                </p>
                <div className="mt-2 inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-mono uppercase tracking-widest bg-hunter text-paper-light">
                  <Award className="w-3 h-3" /> Аккредитованный ИТ-партнер КемГУ
                </div>
              </div>
            </div>

            <div className="space-y-3 text-xs font-mono">
              <div className="flex justify-between py-1 border-b border-paper-border/60 dark:border-paper-darkBorder/60">
                <span className="text-ink-muted dark:text-stone-400">ОТРАСЛЬ:</span>
                <span className="font-medium text-ink dark:text-stone-200 text-right">
                  {company.industry}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-paper-border/60 dark:border-paper-darkBorder/60">
                <span className="text-ink-muted dark:text-stone-400">ГОРОД:</span>
                <span className="font-medium text-ink dark:text-stone-200">{company.city}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-paper-border/60 dark:border-paper-darkBorder/60">
                <span className="text-ink-muted dark:text-stone-400">АДРЕС:</span>
                <span className="font-medium text-ink dark:text-stone-200 text-right">
                  {company.address}
                </span>
              </div>
              {company.website && (
                <div className="flex justify-between py-1 border-b border-paper-border/60 dark:border-paper-darkBorder/60">
                  <span className="text-ink-muted dark:text-stone-400">ВЕБ-САЙТ:</span>
                  <a
                    href={company.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-oxblood dark:text-oxblood-light hover:underline flex items-center gap-1"
                  >
                    {company.website.replace('https://', '')} <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}
            </div>

            {/* Контакты представителя */}
            <div className="p-4 bg-paper-muted/50 dark:bg-paper-dark border border-paper-border dark:border-paper-darkBorder space-y-3">
              <div className="text-[10px] font-mono uppercase tracking-widest text-ink-muted dark:text-stone-400">
                Куратор производственной практики:
              </div>
              <div className="space-y-1">
                <div className="text-base font-semibold text-ink dark:text-ink-light">
                  {company.contactPerson}
                </div>
                <div className="text-xs font-mono text-ink-muted dark:text-stone-400">
                  {company.contactRole}
                </div>
              </div>
              <div className="flex flex-wrap gap-2 pt-2">
                {company.contactTelegram && (
                  <a
                    href={`https://t.me/${company.contactTelegram.replace('@', '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 text-xs font-mono border border-paper-border dark:border-paper-darkBorder hover:border-oxblood dark:hover:border-oxblood-light text-oxblood dark:text-oxblood-light flex items-center gap-1.5 transition"
                  >
                    <Send className="w-3 h-3" /> {company.contactTelegram}
                  </a>
                )}
                {company.contactEmail && (
                  <a
                    href={`mailto:${company.contactEmail}`}
                    className="px-3 py-1.5 text-xs font-mono border border-paper-border dark:border-paper-darkBorder hover:border-ink text-ink dark:text-ink-light flex items-center gap-1.5 transition"
                  >
                    <Mail className="w-3 h-3" /> Email
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Правая колонка: Описание, Условия практики и Проекты компании */}
        <div className="lg:col-span-7 space-y-6">
          {/* О компании */}
          <div className="border border-paper-border dark:border-paper-darkBorder bg-paper-card dark:bg-paper-darkCard p-6 sm:p-7 space-y-4">
            <h3 className="text-2xl font-normal text-ink dark:text-ink-light border-b border-paper-border dark:border-paper-darkBorder pb-3">
              О компании и проектном сотрудничестве
            </h3>
            <p className="text-sm text-ink-muted dark:text-stone-300 leading-relaxed font-normal">
              {company.description}
            </p>
          </div>

          {/* Условия и гарантии для студентов */}
          <div className="border border-paper-border dark:border-paper-darkBorder bg-paper-card dark:bg-paper-darkCard p-6 sm:p-7 space-y-4">
            <div className="flex items-center justify-between border-b border-paper-border dark:border-paper-darkBorder pb-3">
              <h3 className="text-2xl font-normal text-ink dark:text-ink-light">
                Условия и гарантии для практикантов
              </h3>
              <span className="text-[10px] font-mono uppercase tracking-widest text-hunter dark:text-emerald-400">
                Одобрено КемГУ
              </span>
            </div>
            <div className="space-y-2.5">
              {company.benefits.map((b, idx) => (
                <div key={idx} className="flex items-start gap-2.5 text-xs sm:text-sm">
                  <CheckCircle2 className="w-4 h-4 text-hunter dark:text-emerald-400 shrink-0 mt-0.5" />
                  <span className="text-ink dark:text-stone-200">{b}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Активные проекты компании */}
          <div className="border border-paper-border dark:border-paper-darkBorder bg-paper-card dark:bg-paper-darkCard p-6 sm:p-7 space-y-5">
            <div className="flex items-center justify-between border-b border-paper-border dark:border-paper-darkBorder pb-3">
              <div>
                <h3 className="text-2xl font-normal text-ink dark:text-ink-light">
                  Опубликованные проекты ({companyProjects.length})
                </h3>
                <p className="text-xs font-mono text-ink-muted dark:text-stone-400 mt-0.5">
                  Задачи компании в общем академическом реестре
                </p>
              </div>
              <button
                type="button"
                onClick={onOpenCreateProjectModal}
                className="px-3 py-1.5 bg-oxblood hover:bg-oxblood-hover text-white text-xs font-mono uppercase tracking-wider transition flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" /> Добавить
              </button>
            </div>

            <div className="divide-y divide-paper-border dark:divide-paper-darkBorder">
              {companyProjects.length === 0 ? (
                <div className="py-6 text-center text-xs font-mono text-ink-muted dark:text-stone-400">
                  У компании пока нет опубликованных проектов. Нажмите «Добавить», чтобы создать задачу.
                </div>
              ) : (
                companyProjects.map((p) => (
                  <div key={p.id} className="py-4 space-y-2 first:pt-0 last:pb-0">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-medium text-oxblood dark:text-oxblood-light">
                          {p.index} • {p.type}
                        </span>
                        <SemanticMatchBadge score={p.match} size="sm" />
                      </div>
                      <button
                        type="button"
                        onClick={() => onEditProject(p)}
                        className="px-2.5 py-1 text-[10px] font-mono uppercase tracking-wider border border-paper-border dark:border-paper-darkBorder hover:border-ink dark:hover:border-stone-400 text-ink dark:text-ink-light transition flex items-center gap-1 cursor-pointer"
                      >
                        <Edit className="w-3 h-3" /> Редактировать
                      </button>
                    </div>

                    <h4 className="text-lg font-semibold text-ink dark:text-ink-light leading-snug">
                      {p.title}
                    </h4>

                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {(p.requiredSkills && p.requiredSkills.length > 0
                        ? p.requiredSkills
                        : p.tags.map((t) => ({ name: t, level: 'INTERMEDIATE' as const }))
                      ).map((sk) => (
                        <SkillBadge key={typeof sk === 'string' ? sk : sk.name} skill={sk} size="sm" />
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Нижняя панель: кнопка выхода из профиля компании */}
      <div className="pt-6 border-t border-paper-border dark:border-paper-darkBorder flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="text-xs font-mono text-ink-muted dark:text-stone-400">
          Аккаунт компании: <span className="text-ink dark:text-stone-200 font-semibold">{company.name}</span> ({company.department})
        </div>
        {onLogout && (
          <button
            id="company-logout-btn"
            type="button"
            onClick={onLogout}
            className="w-full sm:w-auto px-5 py-2.5 border border-oxblood/40 hover:border-oxblood bg-paper-card dark:bg-paper-darkCard text-oxblood dark:text-oxblood-light hover:bg-oxblood hover:text-white dark:hover:bg-oxblood dark:hover:text-white text-xs font-mono uppercase tracking-widest transition flex items-center justify-center gap-2 cursor-pointer shadow-xs"
          >
            <LogOut className="w-4 h-4" />
            <span>Выйти из профиля компании</span>
          </button>
        )}
      </div>
    </section>
  );
};
