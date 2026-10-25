import React, { useState } from 'react';
import { X } from 'lucide-react';
import type { Project } from '../../types';

interface ApplyModalProps {
  project: Project | null;
  onClose: () => void;
  onSubmit: (projectId: number, coverLetter: string) => void;
}

export const ApplyModal: React.FC<ApplyModalProps> = ({ project, onClose, onSubmit }) => {
  const [coverLetter, setCoverLetter] = useState('');

  if (!project) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(project.id, coverLetter);
    setCoverLetter('');
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-ink/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-paper-card dark:bg-paper-darkCard border-2 border-ink dark:border-stone-600 max-w-xl w-full p-6 sm:p-8 space-y-6 shadow-2xl fade-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-paper-border dark:border-paper-darkBorder pb-4">
          <div>
            <span
              id="modal-company"
              className="text-[11px] font-mono uppercase tracking-widest text-oxblood dark:text-oxblood-light"
            >
              {project.index} • {project.company} • {project.type}
            </span>
            <h3
              id="modal-title"
              className="text-2xl sm:text-3xl font-semibold mt-1 leading-snug text-ink dark:text-ink-light"
            >
              {project.title}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-ink-muted hover:text-ink dark:hover:text-white transition-colors"
            title="Закрыть"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p
          id="modal-desc"
          className="text-sm text-ink-muted dark:text-stone-300 leading-relaxed font-normal"
        >
          {project.desc}
        </p>

        <div>
          <div className="text-[10px] font-mono uppercase tracking-widest text-ink-muted dark:text-stone-400 mb-2">
            Технологический стек:
          </div>
          <div id="modal-tags" className="flex flex-wrap gap-2">
            {project.tags.map((tag) => (
              <span
                key={tag}
                className="px-3.5 py-1.5 text-xs sm:text-sm font-mono font-medium border border-paper-border dark:border-paper-darkBorder bg-paper-light dark:bg-paper-dark text-ink dark:text-ink-light shadow-2xs"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="border-t border-paper-border dark:border-paper-darkBorder pt-5 space-y-2">
            <label
              htmlFor="modal-cover-letter"
              className="block text-[10px] font-mono uppercase tracking-widest text-ink-muted dark:text-stone-400"
            >
              Сопроводительное письмо или ссылка на репозиторий:
            </label>
            <textarea
              id="modal-cover-letter"
              rows={3}
              value={coverLetter}
              onChange={(e) => setCoverLetter(e.target.value)}
              placeholder="Здравствуйте! Наша команда хотела бы взять этот проект в разработку..."
              className="w-full p-3 text-sm bg-paper-light dark:bg-paper-dark border border-paper-border dark:border-paper-darkBorder focus:outline-none focus:border-ink dark:focus:border-ink-light placeholder:text-ink-muted/60 text-ink dark:text-ink-light leading-relaxed"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-mono uppercase tracking-widest text-ink-muted hover:text-ink dark:hover:text-white transition-colors"
            >
              Отмена
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 text-xs font-mono uppercase tracking-widest bg-oxblood hover:bg-oxblood-hover text-paper-light transition"
            >
              Отправить заявку
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
