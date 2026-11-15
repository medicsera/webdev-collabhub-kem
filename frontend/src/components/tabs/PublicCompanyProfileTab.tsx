import React from 'react';
import {
  Building2,
  ExternalLink,
  Mail,
  Send,
  CheckCircle2,
  Award,
  ArrowLeft,
  Briefcase,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import type { CompanyProfile, Project } from '../../types';
import { SkillBadge } from '../SkillBadge';
import { SemanticMatchBadge } from '../SemanticMatchBadge';

interface PublicCompanyProfileTabProps {
  company: CompanyProfile | null;
  projects: Project[];
  isLoading: boolean;
  error: string | null;
  onBack: () => void;
  onSelectProject?: (project: Project) => void;
}

export const PublicCompanyProfileTab: React.FC<PublicCompanyProfileTabProps> = ({
  company,
  projects,
  isLoading,
  error,
  onBack,
  onSelectProject,
}) => {
  // Состояние загрузки
  if (isLoading) {
    return (
      <section className="fade-in space-y-8">
        <div className="flex items-center gap-3 py-4">
          <button
            type="button"
            onClick={onBack}
            className="px-3 py-1.5 text-xs font-mono uppercase tracking-wider border border-paper-border dark:border-paper-darkBorder hover:border-ink dark:hover:border-stone-400 text-ink dark:text-ink-light transition flex items-center gap-1.5 cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Назад
          </button>
        </div>
        <div className="p-16 text-center border border-paper-border dark:border-paper-darkBorder bg-paper-card dark:bg-paper-darkCard space-y-4">
          <Loader2 className="w-8 h-8 text-oxblood dark:text-oxblood-light animate-spin mx-auto" />
          <p className="text-sm font-mono text-ink-muted dark:text-stone-400">
            Загрузка профиля компании...
          </p>
        </div>
      </section>
    );
  }

  // Состояние ошибки
  if (error || !company) {
    return (
      <section className="fade-in space-y-8">
        <div className="flex items-center gap-3 py-4">
          <button
            type="button"
            onClick={onBack}
            className="px-3 py-1.5 text-xs font-mono uppercase tracking-wider border border-paper-border dark:border-paper-darkBorder hover:border-ink dark:hover:border-stone-400 text-ink dark:text-ink-light transition flex items-center gap-1.5 cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Назад
          </button>
        </div>
        <div className="p-16 text-center border border-paper-border dark:border-paper-darkBorder bg-paper-card dark:bg-paper-darkCard space-y-4">
          <AlertCircle className="w-8 h-8 text-oxblood dark:text-oxblood-light mx-auto" />
          <p className="editorial-serif italic text-2xl text-ink-muted dark:text-stone-400">
            {error || 'Компания не найдена'}
          </p>
          <p className="text-xs font-mono text-ink-muted dark:text-stone-400">
            Проверьте правильность ссылки или вернитесь к каталогу проектов
          </p>
        </div>
      </section>
    );
  }

  // Проекты этой компании
  const companyProjects = projects.filter(
    (p) => p.company.toLowerCase() === company.name.toLowerCase()
  );

  return (
    <section id="tab-public-company" className="fade-in space-y-8">
      {/* Кнопка «Назад» и заголовок */}
      <div className="double-rule-b pb-4 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <button
            type="button"
            onClick={onBack}
            className="mb-3 px-3 py-1.5 text-xs font-mono uppercase tracking-wider border border-paper-border dark:border-paper-darkBorder hover:border-ink dark:hover:border-stone-400 text-ink dark:text-ink-light transition flex items-center gap-1.5 cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Вернуться к каталогу
          </button>
          <div className="text-[11px] font-mono uppercase tracking-widest text-oxblood dark:text-oxblood-light flex items-center gap-1.5">
            <Building2 className="w-3.5 h-3.5" /> Публичный профиль работодателя
          </div>
          <h2 className="text-3xl sm:text-4xl font-normal mt-1 text-ink dark:text-ink-light">
            {company.name}
          </h2>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Левая колонка: Визитка компании */}
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

        {/* Правая колонка: Описание, условия, проекты */}
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

          {/* Условия */}
          {company.benefits && company.benefits.length > 0 && (
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
          )}

          {/* Активные проекты (вакансии) */}
          <div className="border border-paper-border dark:border-paper-darkBorder bg-paper-card dark:bg-paper-darkCard p-6 sm:p-7 space-y-5">
            <div className="border-b border-paper-border dark:border-paper-darkBorder pb-3">
              <div className="flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-oxblood dark:text-oxblood-light" />
                <h3 className="text-2xl font-normal text-ink dark:text-ink-light">
                  Активные проекты ({companyProjects.length})
                </h3>
              </div>
              <p className="text-xs font-mono text-ink-muted dark:text-stone-400 mt-0.5">
                Открытые задачи для студентов в академическом реестре
              </p>
            </div>

            <div className="divide-y divide-paper-border dark:divide-paper-darkBorder">
              {companyProjects.length === 0 ? (
                <div className="py-8 text-center space-y-2">
                  <p className="editorial-serif italic text-xl text-ink-muted dark:text-stone-400">
                    У компании пока нет активных проектов
                  </p>
                  <p className="text-xs font-mono text-ink-muted dark:text-stone-400">
                    Следите за обновлениями каталога
                  </p>
                </div>
              ) : (
                companyProjects.map((p) => {
                  const skillsToDisplay =
                    p.requiredSkills && p.requiredSkills.length > 0
                      ? p.requiredSkills
                      : p.tags.map((t) => ({ name: t, level: 'INTERMEDIATE' as const }));

                  return (
                    <div
                      key={p.id}
                      className="py-5 space-y-3 first:pt-0 last:pb-0 hover:bg-paper-muted/20 dark:hover:bg-paper-dark/40 transition-colors -mx-2 px-2"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono font-medium text-oxblood dark:text-oxblood-light">
                            {p.index} • {p.type} • Группа: {p.teamSize}
                          </span>
                          <SemanticMatchBadge score={p.match} size="sm" />
                        </div>
                        {onSelectProject && (
                          <button
                            type="button"
                            onClick={() => onSelectProject(p)}
                            className={`px-3 py-1.5 text-[10px] font-mono uppercase tracking-widest border transition cursor-pointer ${
                              p.applied
                                ? 'bg-hunter text-paper-light border-hunter'
                                : 'border-ink dark:border-ink-light text-ink dark:text-ink-light hover:bg-ink hover:text-paper-light dark:hover:bg-ink-light dark:hover:text-paper-dark'
                            }`}
                          >
                            {p.applied ? 'Заявка отправлена' : 'Подробнее →'}
                          </button>
                        )}
                      </div>

                      <h4 className="text-lg font-semibold text-ink dark:text-ink-light leading-snug">
                        {p.title}
                      </h4>

                      <p className="text-xs text-ink-muted dark:text-stone-300 leading-relaxed line-clamp-2">
                        {p.desc}
                      </p>

                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {skillsToDisplay.map((sk) => (
                          <SkillBadge key={typeof sk === 'string' ? sk : sk.name} skill={sk} size="sm" />
                        ))}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

