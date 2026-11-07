import React from 'react';
import type { SkillLevel, SkillItem } from '../types';
import { SKILL_LEVEL_NAMES } from '../types';

interface SkillBadgeProps {
  skill: string | SkillItem;
  level?: SkillLevel;
  size?: 'sm' | 'md' | 'lg';
  onRemove?: () => void;
  className?: string;
  showLevel?: boolean;
}

export const SkillBadge: React.FC<SkillBadgeProps> = ({
  skill,
  level: propLevel,
  size = 'md',
  onRemove,
  className = '',
  showLevel = true,
}) => {
  const name = typeof skill === 'string' ? skill : skill.name;
  const level: SkillLevel | undefined =
    propLevel || (typeof skill === 'object' ? skill.level : undefined);

  const getLevelStyle = (lvl?: SkillLevel) => {
    switch (lvl) {
      case 'ADVANCED':
        return {
          badge:
            'bg-emerald-100 text-emerald-950 border-emerald-500/80 dark:bg-emerald-950/80 dark:text-emerald-300 dark:border-emerald-500 shadow-2xs',
          dot: 'bg-emerald-600 dark:bg-emerald-400',
          text: 'Продвинутый',
        };
      case 'INTERMEDIATE':
        return {
          badge:
            'bg-sky-100 text-sky-950 border-sky-500/80 dark:bg-sky-950/80 dark:text-sky-300 dark:border-sky-500 shadow-2xs',
          dot: 'bg-sky-600 dark:bg-sky-400',
          text: 'Уверенный',
        };
      case 'BASIC':
      default:
        return {
          badge:
            'bg-amber-100 text-amber-950 border-amber-500/80 dark:bg-amber-950/80 dark:text-amber-300 dark:border-amber-500 shadow-2xs',
          dot: 'bg-amber-600 dark:bg-amber-400',
          text: 'Базовый',
        };
    }
  };

  const levelInfo = getLevelStyle(level);

  const sizeClasses = {
    sm: 'px-2.5 py-0.5 text-xs font-mono',
    md: 'px-3.5 py-1 text-xs sm:text-sm font-mono',
    lg: 'px-4 py-1.5 text-sm sm:text-base font-mono',
  }[size];

  return (
    <span
      className={`inline-flex items-center gap-2 border font-medium bg-paper-light dark:bg-paper-dark text-ink dark:text-ink-light shadow-2xs hover:border-ink/40 dark:hover:border-stone-500 transition-colors ${sizeClasses} ${className}`}
    >
      <span className="font-semibold">{name}</span>

      {showLevel && level && (
        <span
          className={`inline-flex items-center gap-1 px-1.5 py-0.2 text-[10px] uppercase tracking-wider font-semibold border rounded-xs ${levelInfo.badge}`}
          title={`Уровень владения: ${SKILL_LEVEL_NAMES[level]}`}
        >
          <span className={`w-1.5 h-1.5 rounded-full ${levelInfo.dot}`} />
          <span>{levelInfo.text}</span>
        </span>
      )}

      {onRemove && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="ml-1 text-ink-muted hover:text-oxblood dark:hover:text-oxblood-light transition-colors text-xs font-bold leading-none"
          title="Удалить навык"
        >
          ×
        </button>
      )}
    </span>
  );
};
