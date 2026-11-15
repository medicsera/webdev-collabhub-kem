import React from 'react';
import { Sparkles } from 'lucide-react';

interface SemanticMatchBadgeProps {
  score: number;
  size?: 'sm' | 'md' | 'lg';
  label?: string;
  className?: string;
  /** Счёт получен из эмбеддингов ai-service, а не из локальной эвристики */
  aiPowered?: boolean;
  /** ИИ-расчёт ещё идёт (сабл-пульсация до прихода скоров) */
  pending?: boolean;
}

export const SemanticMatchBadge: React.FC<SemanticMatchBadgeProps> = ({
  score,
  size = 'md',
  label = 'Семантический матч',
  className = '',
  aiPowered = false,
  pending = false,
}) => {
  const sizeClasses = {
    sm: 'px-2.5 py-0.5 text-[10px] gap-1',
    md: 'px-3 py-1 text-xs gap-1.5',
    lg: 'px-4 py-1.5 text-sm gap-2',
  }[size];

  const iconSizes = {
    sm: 'w-2.5 h-2.5',
    md: 'w-3.5 h-3.5',
    lg: 'w-4 h-4',
  }[size];

  return (
    <div
      className={`inline-flex items-center font-mono font-bold tracking-wider uppercase text-white bg-emerald-700 dark:bg-emerald-600 border-2 border-emerald-950 dark:border-emerald-300 shadow-md ring-1 ring-emerald-500/40 rounded-xs select-none transition-opacity ${pending ? 'opacity-60 animate-pulse' : ''} ${sizeClasses} ${className}`}
      title={
        aiPowered
          ? 'Показатель векторного семантического соответствия, рассчитанный ai-service (MiniLM-L12-v2, косинусное сходство навыков)'
          : 'Локальная эвристика (ai-service недоступен или ещё рассчитывает)'
      }
    >
      <Sparkles className={`${iconSizes} text-emerald-200 shrink-0`} />
      <span>
        {label}:{' '}
        <strong className="text-white font-extrabold">
          {pending ? '…' : `${score}%`}
        </strong>
        {!aiPowered && !pending && (
          <span className="ml-1 font-normal normal-case opacity-70">(лок.)</span>
        )}
      </span>
    </div>
  );
};
