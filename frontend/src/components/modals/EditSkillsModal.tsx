import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Wrench } from 'lucide-react';
import type { SkillItem } from '../../types';
import { SkillsWithLevelsEditor } from '../SkillsWithLevelsEditor';

interface EditSkillsModalProps {
  isOpen: boolean;
  onClose: () => void;
  skills: SkillItem[];
  onSave: (skills: SkillItem[]) => void;
}

export const EditSkillsModal: React.FC<EditSkillsModalProps> = ({
  isOpen,
  onClose,
  skills: initialSkills,
  onSave,
}) => {
  const [skills, setSkills] = useState<SkillItem[]>(initialSkills);

  useEffect(() => {
    if (isOpen) {
      setSkills(initialSkills);
    }
  }, [isOpen, initialSkills]);

  if (!isOpen) return null;
  if (typeof document === 'undefined') return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(skills);
    onClose();
  };

  return createPortal(
    <div
      className="fixed inset-0 z-50 bg-ink/75 backdrop-blur-xs flex justify-center items-center overflow-y-auto p-3 sm:p-5"
      onClick={onClose}
    >
      <div
        className="relative bg-paper-card dark:bg-paper-darkCard border-2 border-ink dark:border-stone-600 max-w-xl w-full shadow-2xl fade-in flex flex-col max-h-[calc(100vh-2rem)] sm:max-h-[calc(100vh-3.5rem)] my-auto overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Шапка модального окна */}
        <div className="shrink-0 flex items-center justify-between border-b border-paper-border dark:border-paper-darkBorder px-5 sm:px-7 py-3.5 bg-paper-card dark:bg-paper-darkCard">
          <div>
            <div className="text-[10px] font-mono uppercase tracking-widest text-oxblood dark:text-oxblood-light flex items-center gap-1.5">
              <Wrench className="w-3.5 h-3.5" /> Компетенции студента
            </div>
            <h3 className="text-xl sm:text-2xl font-semibold text-ink dark:text-ink-light leading-snug">
              Редактирование стека и навыков
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-ink-muted hover:text-ink dark:hover:text-white transition cursor-pointer"
            aria-label="Закрыть"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Форма с редактором навыков */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0 overflow-hidden">
          <div className="flex-1 overflow-y-auto px-5 sm:px-7 py-5 space-y-6 text-sm overscroll-contain">
            <p className="text-xs text-ink-muted dark:text-stone-300 leading-relaxed font-normal">
              Добавляйте новые технологии, удаляйте неактуальные или изменяйте уровень владения (Базовый, Уверенный, Продвинутый) для точного расчета семантического соответствия с проектами.
            </p>

            <SkillsWithLevelsEditor
              skills={skills}
              onChange={setSkills}
              label="Мои навыки и подтвержденный уровень владения (согласно БД):"
            />
          </div>

          {/* Подвал модального окна */}
          <div className="shrink-0 flex items-center justify-end gap-3 px-5 sm:px-7 py-3.5 border-t border-paper-border dark:border-paper-darkBorder bg-paper-card/95 dark:bg-paper-darkCard/95 backdrop-blur-xs">
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
              Сохранить навыки
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};

