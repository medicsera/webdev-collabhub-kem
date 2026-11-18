import React from 'react';
import type { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionText?: string;
  onAction?: () => void;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon,
  title,
  description,
  actionText,
  onAction,
  className = '',
}) => {
  return (
    <div
      className={`p-8 sm:p-12 text-center border border-paper-border dark:border-paper-darkBorder bg-paper-card dark:bg-paper-darkCard space-y-4 flex flex-col items-center justify-center transition-colors ${className}`}
    >
      <div className="w-12 h-12 border border-ink dark:border-paper-light bg-paper-muted dark:bg-paper-dark flex items-center justify-center text-oxblood dark:text-oxblood-light">
        <Icon className="w-5 h-5" />
      </div>

      <div className="space-y-1.5 max-w-md mx-auto">
        <h3 className="editorial-serif text-2xl font-normal text-ink dark:text-ink-light">
          {title}
        </h3>
        <p className="text-xs sm:text-sm text-ink-muted dark:text-stone-400 leading-relaxed font-normal">
          {description}
        </p>
      </div>

      {actionText && onAction && (
        <div className="pt-2">
          <button
            type="button"
            onClick={onAction}
            className="btn-editorial px-5 py-2.5 bg-oxblood text-paper-light border border-oxblood hover:bg-oxblood-hover text-xs font-mono uppercase tracking-widest transition-colors cursor-pointer"
          >
            {actionText} →
          </button>
        </div>
      )}
    </div>
  );
};
