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
            'bg-oxblood/10 text-oxblood dark:bg-oxblood/25 dark:text-oxblood-light border-oxblood/30 dark:border-oxblood/50',
          dot: 'bg-oxblood dark:bg-oxblood-light',
          text: 'Продвинутый',
        };
      case 'INTERMEDIATE':
        return {
          badge:
            'bg-hunter/10 text-hunter dark:bg-hunter/25 dark:text-emerald-300 border-hunter/30 dark:border-emerald-500/40',
          dot: 'bg-hunter dark:bg-emerald-400',
          text: 'Уверенный',
        };
      case 'BASIC':
      default:
        return {
          badge:
            'bg-paper-muted dark:bg-paper-dark text-ink-muted dark:text-stone-300 border-paper-border dark:border-paper-darkBorder',
          dot: 'bg-stone-400 dark:bg-stone-500',
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
