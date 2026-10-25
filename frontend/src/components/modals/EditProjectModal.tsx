import React, { useState, useEffect } from 'react';
import { X, Trash2 } from 'lucide-react';
import type { Project, SkillItem } from '../../types';
import { SkillsWithLevelsEditor } from '../SkillsWithLevelsEditor';

interface EditProjectModalProps {
  project: Project | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (updatedProject: Project) => void;
  onDelete?: (projectId: number) => void;
}

export const EditProjectModal: React.FC<EditProjectModalProps> = ({
  project,
  isOpen,
  onClose,
  onUpdate,
  onDelete,
}) => {
  const [title, setTitle] = useState('');
  const [department, setDepartment] = useState('');
  const [type, setType] = useState<'ВКР / Диплом' | 'Стажировка' | 'Курсовой проект'>('ВКР / Диплом');
  const [teamSize, setTeamSize] = useState('');
  const [desc, setDesc] = useState('');
  const [requiredSkills, setRequiredSkills] = useState<SkillItem[]>([]);

  useEffect(() => {
    if (project) {
      setTitle(project.title);
      setDepartment(project.department);
      setType(project.type);
      setTeamSize(project.teamSize);
      setDesc(project.desc);
      const skills =
        project.requiredSkills && project.requiredSkills.length > 0
          ? project.requiredSkills
          : project.tags.map((t) => ({ name: t, level: 'INTERMEDIATE' as const }));
      setRequiredSkills(skills);
    }
  }, [project]);

  if (!isOpen || !project) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    onUpdate({
      ...project,
      title: title.trim(),
      department: department.trim() || project.department,
      type,
      teamSize: teamSize.trim() || project.teamSize,
      desc: desc.trim() || project.desc,
      tags: requiredSkills.map((s) => s.name),
      requiredSkills,
    });

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
              Редактирование • {project.index} ({project.company})
            </div>
            <h3 className="text-2xl font-semibold text-ink dark:text-ink-light">
              Изменение параметров проекта
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
              htmlFor="edit-proj-title"
              className="block text-[10px] font-mono uppercase tracking-widest text-ink-muted dark:text-stone-400 mb-1"
            >
              Название темы / проекта
            </label>
            <input
              id="edit-proj-title"
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3.5 py-2 bg-paper-light dark:bg-paper-dark border border-paper-border dark:border-paper-darkBorder focus:outline-none focus:border-ink dark:focus:border-ink-light text-ink dark:text-ink-light"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label
                htmlFor="edit-proj-dept"
                className="block text-[10px] font-mono uppercase tracking-widest text-ink-muted dark:text-stone-400 mb-1"
              >
                Отдел / Заказчик
              </label>
              <input
                id="edit-proj-dept"
                type="text"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full px-3 py-2 bg-paper-light dark:bg-paper-dark border border-paper-border dark:border-paper-darkBorder focus:outline-none text-ink dark:text-ink-light text-xs"
              />
            </div>
            <div>
              <label
                htmlFor="edit-proj-type"
                className="block text-[10px] font-mono uppercase tracking-widest text-ink-muted dark:text-stone-400 mb-1"
              >
                Формат
              </label>
              <select
                id="edit-proj-type"
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
            <div>
              <label
                htmlFor="edit-proj-teamsize"
                className="block text-[10px] font-mono uppercase tracking-widest text-ink-muted dark:text-stone-400 mb-1"
              >
                Состав команды
              </label>
              <input
                id="edit-proj-teamsize"
                type="text"
                value={teamSize}
                onChange={(e) => setTeamSize(e.target.value)}
                className="w-full px-3 py-2 bg-paper-light dark:bg-paper-dark border border-paper-border dark:border-paper-darkBorder focus:outline-none text-ink dark:text-ink-light text-xs font-mono"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="edit-proj-desc"
              className="block text-[10px] font-mono uppercase tracking-widest text-ink-muted dark:text-stone-400 mb-1"
            >
              Описание и задачи проекта
            </label>
            <textarea
              id="edit-proj-desc"
              rows={3}
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              className="w-full p-3 bg-paper-light dark:bg-paper-dark border border-paper-border dark:border-paper-darkBorder focus:outline-none focus:border-ink dark:focus:border-ink-light text-ink dark:text-ink-light leading-relaxed min-h-[70px] max-h-[160px] resize-y text-xs sm:text-sm"
            />
          </div>

          {/* Редактор требуемых навыков с уровнями владения */}
          <SkillsWithLevelsEditor
            skills={requiredSkills}
            onChange={setRequiredSkills}
            label="Требуемый технологический стек и уровень компетенций:"
          />

          <div className="flex items-center justify-between pt-3 border-t border-paper-border dark:border-paper-darkBorder">
            {onDelete ? (
              <button
                type="button"
                onClick={() => {
                  if (window.confirm(`Вы уверены, что хотите удалить проект «${project.title}»?`)) {
                    onDelete(project.id);
                    onClose();
                  }
                }}
                className="px-3 py-2 text-xs font-mono uppercase tracking-wider text-oxblood hover:bg-oxblood/10 border border-oxblood/30 transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" /> Удалить проект
              </button>
            ) : (
              <div />
            )}

            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-mono uppercase tracking-widest text-ink-muted hover:text-ink dark:hover:text-white transition-colors cursor-pointer"
              >
                Отмена
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 text-xs font-mono uppercase tracking-widest bg-ink text-paper-light dark:bg-ink-light dark:text-paper-dark hover:bg-oxblood dark:hover:bg-oxblood transition cursor-pointer shadow-xs"
              >
                Сохранить изменения
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
