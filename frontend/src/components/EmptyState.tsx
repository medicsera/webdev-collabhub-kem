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
      className={`p-8 sm:p-12 text-center border border-dashed border-paper-border dark:border-paper-darkBorder bg-paper-card/60 dark:bg-paper-darkCard/60 rounded-xs space-y-3 flex flex-col items-center justify-center ${className}`}
    >
      <div className="w-12 h-12 rounded-xs border border-paper-border dark:border-stone-700 bg-paper-muted/50 dark:bg-stone-800 flex items-center justify-center text-oxblood dark:text-oxblood-light">
        <Icon className="w-6 h-6" />
      </div>

      <h3 className="editorial-serif text-xl sm:text-2xl font-semibold text-ink dark:text-ink-light">
        {title}
      </h3>

      <p className="text-xs sm:text-sm text-ink-muted dark:text-stone-400 max-w-md mx-auto leading-relaxed">
        {description}
      </p>

      {actionText && onAction && (
        <div className="pt-2">
          <button
            type="button"
            onClick={onAction}
            className="px-4 py-2 bg-oxblood hover:bg-oxblood-hover text-white text-xs font-mono uppercase tracking-wider transition-colors cursor-pointer rounded-xs shadow-2xs"
          >
            {actionText}
          </button>
        </div>
      )}
    </div>
  );
};

