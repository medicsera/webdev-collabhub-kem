import React, { useState } from 'react';
import { X } from 'lucide-react';
import type { Project } from '../../types';
import { SkillBadge } from '../SkillBadge';
import { SemanticMatchBadge } from '../SemanticMatchBadge';

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

  const skillsToDisplay =
    project.requiredSkills && project.requiredSkills.length > 0
      ? project.requiredSkills
      : project.tags.map((t) => ({ name: t, level: 'INTERMEDIATE' as const }));

  return (
    <div
      className="fixed inset-0 z-50 bg-ink/75 backdrop-blur-xs flex justify-center items-start sm:items-center p-3 sm:p-6 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="relative bg-paper-card dark:bg-paper-darkCard border-2 border-ink dark:border-stone-600 max-w-xl w-full p-6 sm:p-8 space-y-6 shadow-2xl fade-in my-auto max-h-[calc(100vh-2rem)] sm:max-h-[calc(100vh-4rem)] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4 border-b border-paper-border dark:border-paper-darkBorder pb-4">
          <div className="space-y-1.5 pr-2">
            <div className="flex flex-wrap items-center gap-2">
              <span
                id="modal-company"
                className="text-[11px] font-mono uppercase tracking-widest text-oxblood dark:text-oxblood-light font-medium"
              >
                {project.index} • {project.company} • {project.type}
              </span>
              <SemanticMatchBadge score={project.match} size="sm" />
            </div>
            <h3
              id="modal-title"
              className="text-2xl sm:text-3xl font-semibold leading-snug text-ink dark:text-ink-light"
            >
              {project.title}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-ink-muted hover:text-ink dark:hover:text-white transition-colors cursor-pointer shrink-0"
            title="Закрыть"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Description */}
        <p
          id="modal-desc"
          className="text-sm text-ink-muted dark:text-stone-300 leading-relaxed font-normal"
        >
          {project.desc}
        </p>

        {/* Required skills with levels */}
        <div>
          <div className="text-[10px] font-mono uppercase tracking-widest text-ink-muted dark:text-stone-400 mb-2">
            Требуемый технологический стек и уровень компетенций:
          </div>
          <div id="modal-tags" className="flex flex-wrap gap-2">
            {skillsToDisplay.map((skill) => (
              <SkillBadge key={typeof skill === 'string' ? skill : skill.name} skill={skill} />
            ))}
          </div>
        </div>

        {/* Form with clamped textarea */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="border-t border-paper-border dark:border-paper-darkBorder pt-5 space-y-2">
            <div className="flex items-center justify-between">
              <label
                htmlFor="modal-cover-letter"
                className="block text-[10px] font-mono uppercase tracking-widest text-ink-muted dark:text-stone-400"
              >
                Сопроводительное письмо или ссылка на репозиторий:
              </label>
              <span className="text-[10px] font-mono text-ink-muted/70 dark:text-stone-400">
                (макс. размер ограничен экраном)
              </span>
            </div>
            <textarea
              id="modal-cover-letter"
              rows={4}
              value={coverLetter}
              onChange={(e) => setCoverLetter(e.target.value)}
              placeholder="Здравствуйте! Наша команда хотела бы взять этот проект в разработку..."
              className="w-full p-3.5 text-sm bg-paper-light dark:bg-paper-dark border border-paper-border dark:border-paper-darkBorder focus:outline-none focus:border-ink dark:focus:border-ink-light placeholder:text-ink-muted/60 text-ink dark:text-ink-light leading-relaxed min-h-[90px] max-h-[200px] resize-y"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-mono uppercase tracking-widest text-ink-muted hover:text-ink dark:hover:text-white transition-colors cursor-pointer"
            >
              Отмена
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 text-xs font-mono uppercase tracking-widest bg-oxblood hover:bg-oxblood-hover text-paper-light transition cursor-pointer shadow-xs"
            >
              Отправить заявку
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

