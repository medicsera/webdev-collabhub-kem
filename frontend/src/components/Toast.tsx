import React from 'react';

interface ToastProps {
  message: string | null;
}

export const Toast: React.FC<ToastProps> = ({ message }) => {
  if (!message) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-6 right-6 z-50 bg-ink text-paper-light dark:bg-paper-card dark:text-ink-light px-5 py-3.5 border-2 border-brass shadow-xl text-xs font-mono uppercase tracking-wider flex items-center gap-3 fade-in"
    >
      <span className="w-2 h-2 bg-brass inline-block shrink-0 animate-pulse" />
      <span>{message}</span>
    </div>
  );
};
