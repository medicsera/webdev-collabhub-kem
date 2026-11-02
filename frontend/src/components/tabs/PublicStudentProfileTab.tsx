import React from 'react';
import {
  User,
  ArrowLeft,
  GraduationCap,
  MapPin,
  Send,
  Loader2,
  AlertCircle,
  Sparkles,
} from 'lucide-react';
import type { StudentProfile } from '../../types';
import { SkillBadge } from '../SkillBadge';
import { SemanticMatchBadge } from '../SemanticMatchBadge';

interface PublicStudentProfileTabProps {
  student: StudentProfile | null;
  isLoading: boolean;
  error: string | null;
  onBack: () => void;
}

export const PublicStudentProfileTab: React.FC<PublicStudentProfileTabProps> = ({
  student,
  isLoading,
  error,
  onBack,
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
            Загрузка профиля студента...
          </p>
        </div>
      </section>
    );
  }

  // Состояние ошибки
  if (error || !student) {
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
            {error || 'Профиль студента не найден'}
          </p>
          <p className="text-xs font-mono text-ink-muted dark:text-stone-400">
            Возможно, студент ещё не заполнил свой профиль
          </p>
        </div>
      </section>
    );
  }

  return (
    <section id="tab-public-student" className="fade-in space-y-8">
      {/* Кнопка «Назад» и заголовок */}
      <div className="double-rule-b pb-4 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <button
            type="button"
            onClick={onBack}
            className="mb-3 px-3 py-1.5 text-xs font-mono uppercase tracking-wider border border-paper-border dark:border-paper-darkBorder hover:border-ink dark:hover:border-stone-400 text-ink dark:text-ink-light transition flex items-center gap-1.5 cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Вернуться к заявкам
          </button>
          <div className="text-[11px] font-mono uppercase tracking-widest text-oxblood dark:text-oxblood-light flex items-center gap-1.5">
            <GraduationCap className="w-3.5 h-3.5" /> Резюме кандидата
          </div>
          <h2 className="text-3xl sm:text-4xl font-normal mt-1 text-ink dark:text-ink-light">
            {student.name}
          </h2>
        </div>
        {/* Семантический матч */}
        <SemanticMatchBadge score={student.aiMatch} size="md" label="Общий матч профиля" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Левая колонка: визитка */}
        <div className="lg:col-span-5 space-y-6">
          {/* Карточка студента */}
          <div className="border border-paper-border dark:border-paper-darkBorder bg-paper-card dark:bg-paper-darkCard p-6 sm:p-8 space-y-6 transition-colors duration-300">
            <div className="flex items-start gap-4 border-b border-paper-border dark:border-paper-darkBorder pb-6">
              <div className="w-16 h-16 border-2 border-ink dark:border-ink-light bg-paper-muted dark:bg-paper-dark flex items-center justify-center text-ink dark:text-ink-light shrink-0">
                {student.avatarUrl ? (
                  <img
                    src={student.avatarUrl}
                    alt={student.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User className="w-8 h-8" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-2xl font-semibold leading-tight text-ink dark:text-ink-light truncate">
                  {student.name}
                </h3>
                <p className="text-xs font-mono text-ink-muted dark:text-stone-400 mt-1">
                  {student.university} • {student.group} • {student.year}
                </p>
                <div className="mt-2 inline-block px-2.5 py-0.5 text-[10px] font-mono uppercase tracking-widest bg-hunter text-paper-light">
                  {student.status}
                </div>
              </div>
            </div>

            <div className="space-y-2.5 text-xs font-mono">
              <div className="flex justify-between py-1 border-b border-paper-border/60 dark:border-paper-darkBorder/60">
                <span className="text-ink-muted dark:text-stone-400">СПЕЦИАЛИЗАЦИЯ:</span>
                <span className="font-medium text-ink dark:text-stone-200">
                  {student.specialization}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-paper-border/60 dark:border-paper-darkBorder/60">
                <span className="text-ink-muted dark:text-stone-400">УНИВЕРСИТЕТ:</span>
                <span className="font-medium text-ink dark:text-stone-200">
                  {student.university}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-paper-border/60 dark:border-paper-darkBorder/60">
                <span className="text-ink-muted dark:text-stone-400 flex items-center gap-1">
                  <MapPin className="w-3 h-3" /> ГОРОД:
                </span>
                <span className="font-medium text-ink dark:text-stone-200">{student.city}</span>
              </div>
              {student.telegram && (
                <div className="flex justify-between py-1 border-b border-paper-border/60 dark:border-paper-darkBorder/60">
                  <span className="text-ink-muted dark:text-stone-400">TELEGRAM:</span>
                  <a
                    href={`https://t.me/${student.telegram.replace('@', '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-oxblood dark:text-oxblood-light hover:underline flex items-center gap-1"
                  >
                    <Send className="w-3 h-3" /> {student.telegram}
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* Навыки */}
          <div className="border border-paper-border dark:border-paper-darkBorder bg-paper-card dark:bg-paper-darkCard p-6 sm:p-7 space-y-4">
            <h3 className="text-xl font-normal text-ink dark:text-ink-light border-b border-paper-border dark:border-paper-darkBorder pb-3">
              Подтвержденные навыки и уровень владения
            </h3>
            {student.skills.length === 0 ? (
              <p className="text-sm font-mono text-ink-muted dark:text-stone-400 italic">
                Студент пока не указал навыки
              </p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {student.skills.map((skill) => (
                  <SkillBadge
                    key={typeof skill === 'string' ? skill : skill.name}
                    skill={skill}
                    size="md"
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Правая колонка: О себе и AI-рекомендация */}
        <div className="lg:col-span-7 space-y-6">
          {/* О себе / Биография */}
          <div className="border border-paper-border dark:border-paper-darkBorder bg-paper-card dark:bg-paper-darkCard p-6 sm:p-7 space-y-4">
            <h3 className="text-2xl font-normal text-ink dark:text-ink-light border-b border-paper-border dark:border-paper-darkBorder pb-3">
              О студенте
            </h3>
            {student.bio ? (
              <p className="text-sm text-ink-muted dark:text-stone-300 leading-relaxed font-normal whitespace-pre-line">
                {student.bio}
              </p>
            ) : (
              <p className="text-sm font-mono text-ink-muted dark:text-stone-400 italic">
                Студент пока не добавил описание о себе
              </p>
            )}
          </div>

          {/* AI-рекомендация */}
          <div className="border border-paper-border dark:border-paper-darkBorder bg-paper-card dark:bg-paper-darkCard p-6 sm:p-7 space-y-4">
            <div className="border-b border-paper-border dark:border-paper-darkBorder pb-3 flex items-center justify-between gap-3">
              <div>
                <div className="text-[10px] font-mono uppercase tracking-widest text-brass flex items-center gap-1.5">
                  <Sparkles className="w-3 h-3" /> Аналитический модуль
                </div>
                <h3 className="text-2xl font-normal mt-0.5 text-ink dark:text-ink-light">
                  Оценка AI-системы
                </h3>
              </div>
              <span className="font-mono text-xs px-2.5 py-1 border border-paper-border dark:border-paper-darkBorder text-ink-muted dark:text-stone-300 shrink-0">
                RuBERT + Qwen 2.5
              </span>
            </div>

            <blockquote className="p-5 bg-paper-muted/50 dark:bg-paper-dark border-l-2 border-oxblood space-y-3 transition-colors">
              <div className="text-[11px] font-mono uppercase tracking-widest flex flex-wrap items-center justify-between gap-2">
                <span className="text-oxblood dark:text-oxblood-light">
                  Анализ навыков и рекомендации:
                </span>
                <SemanticMatchBadge score={student.aiMatch} size="sm" />
              </div>
              <p className="editorial-serif italic text-lg leading-relaxed text-ink dark:text-stone-200">
                «{student.aiFeedback}»
              </p>
            </blockquote>
          </div>

          {/* Дополнительная информация — заглушка */}
          <div className="border border-paper-border dark:border-paper-darkBorder bg-paper-card dark:bg-paper-darkCard p-6 sm:p-7 space-y-4">
            <h3 className="text-xl font-normal text-ink dark:text-ink-light border-b border-paper-border dark:border-paper-darkBorder pb-3">
              Портфолио и проекты
            </h3>
            <p className="text-sm font-mono text-ink-muted dark:text-stone-400 italic text-center py-4">
              Раздел портфолио будет дополнен студентом
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

