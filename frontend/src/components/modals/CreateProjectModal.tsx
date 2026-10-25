import React, { useState } from 'react';
import { X } from 'lucide-react';
import type { Project, SkillItem } from '../../types';
import { SkillsWithLevelsEditor } from '../SkillsWithLevelsEditor';

interface CreateProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (newProject: Omit<Project, 'id' | 'index' | 'match' | 'applied'>) => void;
  initialCompany?: string;
  initialDepartment?: string;
}

export const CreateProjectModal: React.FC<CreateProjectModalProps> = ({
  isOpen,
  onClose,
  onCreate,
  initialCompany = 'Софт Инжиниринг',
  initialDepartment = 'Департамент веб-разработки',
}) => {
  const [title, setTitle] = useState('');
  const [company, setCompany] = useState(initialCompany);
  const [department, setDepartment] = useState(initialDepartment);
  const [type, setType] = useState<'ВКР / Диплом' | 'Стажировка' | 'Курсовой проект'>('ВКР / Диплом');
  const [teamSize, setTeamSize] = useState('2–3 студента');
  const [desc, setDesc] = useState('');
  const [requiredSkills, setRequiredSkills] = useState<SkillItem[]>([
    { name: 'React', level: 'INTERMEDIATE' },
    { name: 'TypeScript', level: 'INTERMEDIATE' },
    { name: 'FastAPI', level: 'BASIC' },
  ]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    onCreate({
      title: title.trim(),
      company: company.trim() || 'Софт Инжиниринг',
      department: department.trim() || 'Департамент веб-разработки',
      type,
      teamSize,
      desc: desc.trim() || 'Новое проектное задание от регионального партнера.',
      tags: requiredSkills.map((s) => s.name),
      requiredSkills,
    });

    setTitle('');
    setDesc('');
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-ink/75 backdrop-blur-xs flex justify-center items-start sm:items-center p-3 sm:p-6 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="relative bg-paper-card dark:bg-paper-darkCard border-2 border-ink dark:border-stone-600 max-w-xl w-full p-6 sm:p-8 space-y-5 shadow-2xl fade-in my-auto max-h-[calc(100vh-2rem)] sm:max-h-[calc(100vh-4rem)] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-paper-border dark:border-paper-darkBorder pb-3">
          <div>
            <div className="text-[10px] font-mono uppercase tracking-widest text-oxblood dark:text-oxblood-light">
              Кабинет компании • {company}
            </div>
            <h3 className="text-2xl font-semibold text-ink dark:text-ink-light">
              Публикация проектной задачи
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-ink-muted hover:text-ink dark:hover:text-white transition-colors cursor-pointer"
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
              Название темы / проекта *
            </label>
            <input
              id="new-proj-title"
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Например: Разработка модуля аналитики и рекомендаций"
              className="w-full px-3.5 py-2 bg-paper-light dark:bg-paper-dark border border-paper-border dark:border-paper-darkBorder focus:outline-none focus:border-ink dark:focus:border-ink-light text-ink dark:text-ink-light"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
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
                className="w-full px-3 py-2 bg-paper-light dark:bg-paper-dark border border-paper-border dark:border-paper-darkBorder focus:outline-none text-ink dark:text-ink-light text-xs"
              />
            </div>
            <div>
              <label
                htmlFor="new-proj-dept"
                className="block text-[10px] font-mono uppercase tracking-widest text-ink-muted dark:text-stone-400 mb-1"
              >
                Отдел / Заказчик
              </label>
              <input
                id="new-proj-dept"
                type="text"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full px-3 py-2 bg-paper-light dark:bg-paper-dark border border-paper-border dark:border-paper-darkBorder focus:outline-none text-ink dark:text-ink-light text-xs"
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
                className="w-full px-3 py-2 bg-paper-light dark:bg-paper-dark border border-paper-border dark:border-paper-darkBorder focus:outline-none text-ink dark:text-ink-light font-mono text-xs"
              >
                <option value="ВКР / Диплом">ВКР / Диплом</option>
                <option value="Стажировка">Стажировка</option>
                <option value="Курсовой проект">Курсовой проект</option>
              </select>
            </div>
          </div>

          <div>
            <label
              htmlFor="new-proj-teamsize"
              className="block text-[10px] font-mono uppercase tracking-widest text-ink-muted dark:text-stone-400 mb-1"
            >
              Состав команды
            </label>
            <input
              id="new-proj-teamsize"
              type="text"
              value={teamSize}
              onChange={(e) => setTeamSize(e.target.value)}
              placeholder="1–2 студента"
              className="w-full px-3.5 py-1.5 bg-paper-light dark:bg-paper-dark border border-paper-border dark:border-paper-darkBorder focus:outline-none text-ink dark:text-ink-light text-xs font-mono"
            />
          </div>

          <div>
            <label
              htmlFor="new-proj-desc"
              className="block text-[10px] font-mono uppercase tracking-widest text-ink-muted dark:text-stone-400 mb-1"
            >
              Описание и задачи проекта
            </label>
            <textarea
              id="new-proj-desc"
              rows={3}
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              placeholder="Опишите задачи и требования к проекту..."
              className="w-full p-3 bg-paper-light dark:bg-paper-dark border border-paper-border dark:border-paper-darkBorder focus:outline-none focus:border-ink dark:focus:border-ink-light text-ink dark:text-ink-light leading-relaxed min-h-[70px] max-h-[160px] resize-y text-xs sm:text-sm"
            />
          </div>

          {/* Редактор требуемых навыков с уровнями владения (Requirement 2) */}
          <SkillsWithLevelsEditor
            skills={requiredSkills}
            onChange={setRequiredSkills}
            label="Требуемые навыки и минимальный уровень владения (согласно БД):"
          />

          <div className="flex justify-end gap-3 pt-3 border-t border-paper-border dark:border-paper-darkBorder">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-mono uppercase tracking-widest text-ink-muted hover:text-ink dark:hover:text-white transition-colors cursor-pointer"
            >
              Отмена
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 text-xs font-mono uppercase tracking-widest bg-oxblood hover:bg-oxblood-hover text-white transition cursor-pointer shadow-xs"
            >
              Опубликовать проект
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
