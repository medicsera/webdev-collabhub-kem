import React from 'react';
import { Sparkles } from 'lucide-react';

interface SemanticMatchBadgeProps {
  score: number;
  size?: 'sm' | 'md' | 'lg';
  label?: string;
  className?: string;
}

export const SemanticMatchBadge: React.FC<SemanticMatchBadgeProps> = ({
  score,
  size = 'md',
  label = 'Матч',
  className = '',
}) => {
  const sizeClasses = {
    sm: 'px-2.5 py-0.5 text-[10px] gap-1.5',
    md: 'px-3 py-1 text-xs gap-1.5',
    lg: 'px-3.5 py-1.5 text-sm gap-2',
  }[size];

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-3.5 h-3.5',
    lg: 'w-4 h-4',
  }[size];

  return (
    <div
      className={`inline-flex items-center font-mono font-medium tracking-wide uppercase text-white bg-gradient-to-r from-emerald-800 via-emerald-700 to-teal-800 dark:from-emerald-900/95 dark:via-emerald-800/90 dark:to-teal-900/95 border border-emerald-600/70 dark:border-emerald-500/60 shadow-xs select-none ${sizeClasses} ${className}`}
      title="Показатель векторного семантического соответствия (MiniLM-L12-v2 + pgvector)"
    >
      <Sparkles className={`${iconSizes} text-emerald-200 shrink-0`} />
      <span>
        {label}: <strong className="font-bold text-white tracking-wider">{score}%</strong>
      </span>
    </div>
  );
};
