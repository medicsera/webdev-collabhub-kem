import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Wrench, Sparkles } from 'lucide-react';
import type { SkillItem } from '../../types';
import { SkillsWithLevelsEditor } from '../SkillsWithLevelsEditor';
import { useBodyScrollLock } from '../../hooks/useBodyScrollLock';

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

  useBodyScrollLock(isOpen);

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
      className="fixed inset-0 z-50 bg-ink/75 backdrop-blur-md modal-backdrop-animate flex justify-center items-center overflow-y-auto p-3 sm:p-6"
      onClick={onClose}
    >
      <div
        className="relative bg-paper-card dark:bg-paper-darkCard border-2 border-ink dark:border-paper-darkBorder max-w-3xl sm:max-w-4xl w-full modal-content-animate flex flex-col max-h-[calc(100vh-2rem)] sm:max-h-[calc(100vh-3rem)] my-auto overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Шапка модального окна */}
        <div className="shrink-0 flex items-center justify-between border-b border-paper-border dark:border-paper-darkBorder px-6 sm:px-8 py-4 bg-paper-card dark:bg-paper-darkCard">
          <div>
            <div className="text-[10px] font-mono uppercase tracking-widest text-oxblood dark:text-oxblood-light flex items-center gap-1.5 font-bold">
              <Wrench className="w-3.5 h-3.5" /> Компетенции и стек технологий
            </div>
            <h3 className="text-xl sm:text-2xl font-serif font-bold text-ink dark:text-ink-light leading-snug">
              Редактирование стека и навыков
            </h3>
            <p className="text-[11px] font-mono text-ink-muted dark:text-stone-400 mt-0.5">
              Синхронизация уровня владения технологиями для семантического ИИ-подбора проектов
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-ink-muted hover:text-ink dark:hover:text-white transition-colors cursor-pointer shrink-0 ml-3 border border-transparent hover:border-paper-border dark:hover:border-stone-700"
            aria-label="Закрыть"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Форма с редактором навыков */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0 overflow-hidden">
          <div className="flex-1 overflow-y-auto px-6 sm:px-8 py-6 space-y-6 text-sm overscroll-contain">
            <div className="p-3.5 bg-paper-light/60 dark:bg-paper-dark/60 border border-paper-border dark:border-paper-darkBorder text-xs text-ink-muted dark:text-stone-300 leading-relaxed font-normal flex items-start gap-2.5">
              <Sparkles className="w-4 h-4 text-oxblood dark:text-oxblood-light shrink-0 mt-0.5" />
              <span>
                Укажите подтвержденный уровень владения каждым навыком (<strong>Базовый</strong>, <strong>Уверенный</strong>, <strong>Продвинутый</strong>).
                Нейросетевая модель сопоставляет ваш стек с требованиями компаний в реальном времени.
              </span>
            </div>

            <SkillsWithLevelsEditor
              skills={skills}
              onChange={setSkills}
              label="Подтвержденные технологии в реестре CollabHub:"
            />
          </div>

          {/* Подвал модального окна */}
          <div className="shrink-0 flex items-center justify-between gap-3 px-6 sm:px-8 py-4 border-t border-paper-border dark:border-paper-darkBorder bg-paper-card/95 dark:bg-paper-darkCard/95 backdrop-blur-xs">
            <span className="text-xs font-mono text-ink-muted dark:text-stone-400">
              Выбрано навыков: <strong className="text-ink dark:text-ink-light">{skills.length}</strong>
            </span>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-mono uppercase tracking-widest text-ink-muted hover:text-ink dark:hover:text-white transition-colors cursor-pointer"
              >
                Отмена
              </button>
              <button
                type="submit"
                className="btn-editorial px-6 py-2.5 text-xs font-mono uppercase tracking-widest bg-ink text-paper-light dark:bg-paper-light dark:text-ink transition cursor-pointer border border-ink dark:border-paper-light font-bold"
              >
                Сохранить навыки
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};
