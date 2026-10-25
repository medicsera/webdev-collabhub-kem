import React, { useState } from 'react';
import { User, RotateCw, Sparkles, CheckCircle2 } from 'lucide-react';
import type { StudentProfile } from '../../types';

interface ProfileTabProps {
  profile: StudentProfile;
  onUpdateBio: (newBio: string) => void;
  onRecalculate: () => void;
  isRecalculating: boolean;
}

export const ProfileTab: React.FC<ProfileTabProps> = ({
  profile,
  onUpdateBio,
  onRecalculate,
  isRecalculating,
}) => {
  const [bioInput, setBioInput] = useState(profile.bio);

  const handleBioChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setBioInput(e.target.value);
    onUpdateBio(e.target.value);
  };

  return (
    <section id="tab-profile" className="fade-in space-y-8">
      {/* Шапка раздела */}
      <div className="double-rule-b pb-4">
        <div className="text-[11px] font-mono uppercase tracking-widest text-oxblood dark:text-oxblood-light">
          Личный профиль
        </div>
        <h2 className="text-3xl sm:text-4xl font-normal mt-1 text-ink dark:text-ink-light">
          Академический профиль и подбор проектов (AI)
        </h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Карточка студента */}
        <div className="lg:col-span-4 border border-paper-border dark:border-paper-darkBorder bg-paper-card dark:bg-paper-darkCard p-6 sm:p-8 space-y-6 transition-colors duration-300">
          <div className="flex items-start gap-4 border-b border-paper-border dark:border-paper-darkBorder pb-6">
            <div className="w-16 h-16 border-2 border-ink dark:border-ink-light bg-paper-muted dark:bg-paper-dark flex items-center justify-center text-ink dark:text-ink-light shrink-0">
              <User className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-2xl font-semibold leading-tight text-ink dark:text-ink-light">
                {profile.name}
              </h3>
              <p className="text-xs font-mono text-ink-muted dark:text-stone-400 mt-1">
                {profile.university} • {profile.group} • {profile.year}
              </p>
              <div className="mt-2 inline-block px-2 py-0.5 text-[10px] font-mono uppercase tracking-widest bg-hunter text-paper-light">
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

          <div className="pt-2">
            <div className="text-[10px] font-mono uppercase tracking-widest text-ink-muted dark:text-stone-400 mb-3">
              Подтвержденные навыки (Стек)
            </div>
            <div className="flex flex-wrap gap-2">
              {profile.skills.map((s) => (
                <span
                  key={s}
                  className="px-3.5 py-1.5 text-xs sm:text-sm font-mono font-medium border border-paper-border dark:border-paper-darkBorder bg-paper-light dark:bg-paper-dark text-ink dark:text-ink-light shadow-2xs hover:border-oxblood/50 dark:hover:border-oxblood-light/50 transition-colors"
                >
                  {s}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Рекомендации ИИ */}
        <div className="lg:col-span-8 border border-paper-border dark:border-paper-darkBorder bg-paper-card dark:bg-paper-darkCard p-6 sm:p-8 space-y-6 transition-colors duration-300">
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
              RuBERT + Qwen
            </span>
          </div>

          <blockquote className="p-6 bg-paper-muted/50 dark:bg-paper-dark border-l-2 border-oxblood space-y-3 transition-colors">
            <div className="text-[11px] font-mono uppercase tracking-widest text-oxblood dark:text-oxblood-light flex items-center justify-between">
              <span>Анализ навыков и подходящих задач:</span>
              <span className="text-hunter dark:text-emerald-400 font-medium">
                МАТЧ {profile.aiMatch}%
              </span>
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
              className="w-full p-3.5 text-sm bg-paper-light dark:bg-paper-dark border border-paper-border dark:border-paper-darkBorder focus:outline-none focus:border-ink dark:focus:border-ink-light leading-relaxed text-ink dark:text-ink-light"
            />
            <div className="flex justify-between items-center pt-1">
              <span className="text-[11px] font-mono text-ink-muted dark:text-stone-400 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-hunter dark:text-emerald-400" />
                Векторное представление обновляется автоматически
              </span>
              <button
                type="button"
                disabled={isRecalculating}
                onClick={onRecalculate}
                className="px-5 py-2.5 bg-ink text-paper-light dark:bg-ink-light dark:text-paper-dark hover:bg-oxblood dark:hover:bg-oxblood text-xs font-mono uppercase tracking-widest transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <RotateCw
                  className={`w-3.5 h-3.5 ${isRecalculating ? 'animate-spin' : ''}`}
                />
                {isRecalculating ? 'Вычисление эмбеддингов...' : 'Пересчитать вектор навыков'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
