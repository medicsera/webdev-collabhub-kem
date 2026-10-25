import React, { useState } from 'react';
import { User, RotateCw, Sparkles, CheckCircle2, Edit, LogOut } from 'lucide-react';
import type { StudentProfile } from '../../types';
import { SkillBadge } from '../SkillBadge';
import { SemanticMatchBadge } from '../SemanticMatchBadge';

interface ProfileTabProps {
  profile: StudentProfile;
  onUpdateBio: (newBio: string) => void;
  onRecalculate: () => void;
  isRecalculating: boolean;
  onOpenEditProfileModal: () => void;
  onLogout?: () => void;
}

export const ProfileTab: React.FC<ProfileTabProps> = ({
  profile,
  onUpdateBio,
  onRecalculate,
  isRecalculating,
  onOpenEditProfileModal,
  onLogout,
}) => {
  const [bioInput, setBioInput] = useState(profile.bio);

  const handleBioChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setBioInput(e.target.value);
    onUpdateBio(e.target.value);
  };

  return (
    <section id="tab-profile" className="fade-in space-y-8">
      {/* Шапка раздела */}
      <div className="double-rule-b pb-4 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <div className="text-[11px] font-mono uppercase tracking-widest text-oxblood dark:text-oxblood-light">
            Личный профиль студента
          </div>
          <h2 className="text-3xl sm:text-4xl font-normal mt-1 text-ink dark:text-ink-light">
            Академический профиль и подбор проектов (AI)
          </h2>
        </div>
        <button
          type="button"
          onClick={onOpenEditProfileModal}
          className="px-4 py-2 bg-ink text-paper-light dark:bg-ink-light dark:text-paper-dark hover:bg-oxblood dark:hover:bg-oxblood text-xs font-mono uppercase tracking-widest transition flex items-center gap-2 self-start sm:self-auto cursor-pointer shadow-xs"
        >
          <Edit className="w-3.5 h-3.5" /> Редактировать профиль и навыки
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Карточка студента */}
        <div className="lg:col-span-5 border border-paper-border dark:border-paper-darkBorder bg-paper-card dark:bg-paper-darkCard p-6 sm:p-8 space-y-6 transition-colors duration-300">
          <div className="flex items-start gap-4 border-b border-paper-border dark:border-paper-darkBorder pb-6">
            <div className="w-16 h-16 border-2 border-ink dark:border-ink-light bg-paper-muted dark:bg-paper-dark flex items-center justify-center text-ink dark:text-ink-light shrink-0">
              <User className="w-8 h-8" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-2xl font-semibold leading-tight text-ink dark:text-ink-light truncate">
                {profile.name}
              </h3>
              <p className="text-xs font-mono text-ink-muted dark:text-stone-400 mt-1">
                {profile.university} • {profile.group} • {profile.year}
              </p>
              <div className="mt-2 inline-block px-2.5 py-0.5 text-[10px] font-mono uppercase tracking-widest bg-hunter text-paper-light">
                {profile.status}
              </div>
            </div>
          </div>

          <div className="space-y-2.5 text-xs font-mono">
            <div className="flex justify-between py-1 border-b border-paper-border/60 dark:border-paper-darkBorder/60">
              <span className="text-ink-muted dark:text-stone-400">СПЕЦИАЛИЗАЦИЯ:</span>
              <span className="font-medium text-ink dark:text-stone-200">
                {profile.specialization}
              </span>
            </div>
            <div className="flex justify-between py-1 border-b border-paper-border/60 dark:border-paper-darkBorder/60">
              <span className="text-ink-muted dark:text-stone-400">TELEGRAM:</span>
              <span className="font-medium text-oxblood dark:text-oxblood-light">
                {profile.telegram}
              </span>
            </div>
            <div className="flex justify-between py-1 border-b border-paper-border/60 dark:border-paper-darkBorder/60">
              <span className="text-ink-muted dark:text-stone-400">ГОРОД:</span>
              <span className="font-medium text-ink dark:text-stone-200">{profile.city}</span>
            </div>
          </div>

          {/* Подтвержденные навыки с уровнями владения (Requirement 1) */}
          <div className="pt-2">
            <div className="flex items-center justify-between mb-3">
              <div className="text-[10px] font-mono uppercase tracking-widest text-ink-muted dark:text-stone-400">
                Подтвержденные навыки и уровень (БД)
              </div>
              <button
                type="button"
                onClick={onOpenEditProfileModal}
                className="text-[10px] font-mono uppercase tracking-wider text-oxblood dark:text-oxblood-light hover:underline cursor-pointer"
              >
                + Изменить
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {profile.skills.map((skill) => (
                <SkillBadge
                  key={typeof skill === 'string' ? skill : skill.name}
                  skill={skill}
                  size="md"
                />
              ))}
            </div>
          </div>
        </div>

        {/* Рекомендации ИИ */}
        <div className="lg:col-span-7 border border-paper-border dark:border-paper-darkBorder bg-paper-card dark:bg-paper-darkCard p-6 sm:p-8 space-y-6 transition-colors duration-300">
          <div className="border-b border-paper-border dark:border-paper-darkBorder pb-4 flex items-center justify-between gap-3">
            <div>
              <div className="text-[10px] font-mono uppercase tracking-widest text-brass flex items-center gap-1.5">
                <Sparkles className="w-3 h-3" /> Аналитический модуль
              </div>
              <h3 className="text-2xl font-normal mt-0.5 text-ink dark:text-ink-light">
                Рекомендации искусственного интеллекта
              </h3>
            </div>
            <span className="font-mono text-xs px-2.5 py-1 border border-paper-border dark:border-paper-darkBorder text-ink-muted dark:text-stone-300 shrink-0">
              RuBERT + Qwen 2.5
            </span>
          </div>

          <blockquote className="p-6 bg-paper-muted/50 dark:bg-paper-dark border-l-2 border-oxblood space-y-3 transition-colors">
            <div className="text-[11px] font-mono uppercase tracking-widest flex flex-wrap items-center justify-between gap-2">
              <span className="text-oxblood dark:text-oxblood-light">
                Анализ навыков и подходящих задач:
              </span>
              {/* Выделенный семантический матч (Requirement 3) */}
              <SemanticMatchBadge score={profile.aiMatch} size="sm" />
            </div>
            <p className="editorial-serif italic text-xl leading-relaxed text-ink dark:text-stone-200">
              «{profile.aiFeedback}»
            </p>
          </blockquote>

          <div className="space-y-3 pt-2">
            <label
              htmlFor="ai-bio-input"
              className="block text-[11px] font-mono uppercase tracking-widest text-ink-muted dark:text-stone-400"
            >
              Обновить описание опыта (для пересчета рекомендаций):
            </label>
            <textarea
              id="ai-bio-input"
              rows={3}
              value={bioInput}
              onChange={handleBioChange}
              className="w-full p-3.5 text-sm bg-paper-light dark:bg-paper-dark border border-paper-border dark:border-paper-darkBorder focus:outline-none focus:border-ink dark:focus:border-ink-light leading-relaxed text-ink dark:text-ink-light min-h-[70px] max-h-[140px] resize-y"
            />
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pt-1">
              <span className="text-[11px] font-mono text-ink-muted dark:text-stone-400 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-hunter dark:text-emerald-400 shrink-0" />
                Векторные эмбеддинги сопоставляются с задачами компаний
              </span>
              <button
                type="button"
                disabled={isRecalculating}
                onClick={onRecalculate}
                className="px-5 py-2.5 bg-ink text-paper-light dark:bg-ink-light dark:text-paper-dark hover:bg-oxblood dark:hover:bg-oxblood text-xs font-mono uppercase tracking-widest transition flex items-center gap-2 cursor-pointer disabled:opacity-50 shrink-0"
              >
                <RotateCw
                  className={`w-3.5 h-3.5 ${isRecalculating ? 'animate-spin' : ''}`}
                />
                {isRecalculating ? 'Вычисление...' : 'Пересчитать вектор навыков'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Нижняя панель: кнопка выхода из профиля */}
      <div className="pt-6 border-t border-paper-border dark:border-paper-darkBorder flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="text-xs font-mono text-ink-muted dark:text-stone-400">
          Текущая сессия: <span className="text-ink dark:text-stone-200 font-semibold">{profile.name}</span> ({profile.group})
        </div>
        {onLogout && (
          <button
            id="profile-logout-btn"
            type="button"
            onClick={onLogout}
            className="w-full sm:w-auto px-5 py-2.5 border border-oxblood/40 hover:border-oxblood bg-paper-card dark:bg-paper-darkCard text-oxblood dark:text-oxblood-light hover:bg-oxblood hover:text-white dark:hover:bg-oxblood dark:hover:text-white text-xs font-mono uppercase tracking-widest transition flex items-center justify-center gap-2 cursor-pointer shadow-xs"
          >
            <LogOut className="w-4 h-4" />
            <span>Выйти из профиля студента</span>
          </button>
        )}
      </div>
    </section>
  );
};
