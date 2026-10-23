import React, { useState } from 'react';
import { X } from 'lucide-react';
import type { Project } from '../../types';

interface CreateProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (newProject: Omit<Project, 'id' | 'index' | 'match' | 'applied'>) => void;
}

export const CreateProjectModal: React.FC<CreateProjectModalProps> = ({
  isOpen,
  onClose,
  onCreate,
}) => {
  const [title, setTitle] = useState('');
  const [company, setCompany] = useState('Софт Инжиниринг');
  const [type, setType] = useState<'ВКР / Диплом' | 'Стажировка' | 'Курсовой проект'>('ВКР / Диплом');
  const [desc, setDesc] = useState('');
  const [tagsInput, setTagsInput] = useState('React, TypeScript, FastAPI, PostgreSQL');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const tags = tagsInput
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    onCreate({
      title: title.trim(),
      company: company.trim() || 'Софт Инжиниринг',
      department: 'Департамент веб-разработки',
      type,
      teamSize: '2–3 студента',
      desc: desc.trim() || 'Новое проектное задание от регионального партнера.',
      tags: tags.length > 0 ? tags : ['React', 'TypeScript'],
    });

    // Reset form
    setTitle('');
    setDesc('');
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-ink/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-paper-card dark:bg-paper-darkCard border-2 border-ink dark:border-stone-600 max-w-lg w-full p-6 sm:p-8 space-y-5 shadow-2xl fade-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-paper-border dark:border-paper-darkBorder pb-3">
          <div>
            <div className="text-[10px] font-mono uppercase tracking-widest text-oxblood dark:text-oxblood-light">
              Кабинет компании
            </div>
            <h3 className="text-2xl font-semibold text-ink dark:text-ink-light">
              Публикация проектной задачи
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

        <form onSubmit={handleSubmit} className="space-y-4 text-sm">
          <div>
            <label
              htmlFor="new-proj-title"
              className="block text-[10px] font-mono uppercase tracking-widest text-ink-muted dark:text-stone-400 mb-1"
            >
              Название темы / проекта
            </label>
            <input
              id="new-proj-title"
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Например: Разработка модуля аналитики"
              className="w-full px-3.5 py-2 bg-paper-light dark:bg-paper-dark border border-paper-border dark:border-paper-darkBorder focus:outline-none focus:border-ink dark:focus:border-ink-light text-ink dark:text-ink-light"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label
                htmlFor="new-proj-company"
                className="block text-[10px] font-mono uppercase tracking-widest text-ink-muted dark:text-stone-400 mb-1"
              >
                Компания
              </label>
              <input
                id="new-proj-company"
                type="text"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                className="w-full px-3.5 py-2 bg-paper-light dark:bg-paper-dark border border-paper-border dark:border-paper-darkBorder focus:outline-none focus:border-ink dark:focus:border-ink-light text-ink dark:text-ink-light"
              />
            </div>
            <div>
              <label
                htmlFor="new-proj-type"
                className="block text-[10px] font-mono uppercase tracking-widest text-ink-muted dark:text-stone-400 mb-1"
              >
                Формат
              </label>
              <select
                id="new-proj-type"
                value={type}
                onChange={(e) =>
                  setType(e.target.value as 'ВКР / Диплом' | 'Стажировка' | 'Курсовой проект')
                }
                className="w-full px-3.5 py-2 bg-paper-light dark:bg-paper-dark border border-paper-border dark:border-paper-darkBorder focus:outline-none focus:border-ink dark:focus:border-ink-light text-ink dark:text-ink-light font-mono text-xs"
              >
                <option value="ВКР / Диплом">ВКР / Диплом</option>
                <option value="Стажировка">Стажировка</option>
                <option value="Курсовой проект">Курсовой проект</option>
              </select>
            </div>
          </div>

          <div>
            <label
              htmlFor="new-proj-desc"
              className="block text-[10px] font-mono uppercase tracking-widest text-ink-muted dark:text-stone-400 mb-1"
            >
              Описание и требования
            </label>
            <textarea
              id="new-proj-desc"
              rows={3}
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              placeholder="Опишите задачи и требования к команде..."
              className="w-full px-3.5 py-2 bg-paper-light dark:bg-paper-dark border border-paper-border dark:border-paper-darkBorder focus:outline-none focus:border-ink dark:focus:border-ink-light text-ink dark:text-ink-light leading-relaxed"
            />
          </div>

          <div>
            <label
              htmlFor="new-proj-tags"
              className="block text-[10px] font-mono uppercase tracking-widest text-ink-muted dark:text-stone-400 mb-1"
            >
              Стек (через запятую)
            </label>
            <input
              id="new-proj-tags"
              type="text"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              placeholder="React, TypeScript, FastAPI, PostgreSQL"
              className="w-full px-3.5 py-2 bg-paper-light dark:bg-paper-dark border border-paper-border dark:border-paper-darkBorder focus:outline-none focus:border-ink dark:focus:border-ink-light text-ink dark:text-ink-light font-mono text-xs"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-paper-border dark:border-paper-darkBorder">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-mono uppercase tracking-widest text-ink-muted hover:text-ink dark:hover:text-white transition-colors"
            >
              Отмена
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 text-xs font-mono uppercase tracking-widest bg-ink text-paper-light dark:bg-ink-light dark:text-paper-dark hover:bg-oxblood transition"
            >
              Опубликовать
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
