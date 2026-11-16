import React, { useState } from 'react';
import { Plus, ChevronDown } from 'lucide-react';
import type { SkillItem, SkillLevel } from '../types';
import { SKILL_LEVEL_NAMES } from '../types';

interface SkillsWithLevelsEditorProps {
  skills: SkillItem[];
  onChange: (skills: SkillItem[]) => void;
  label?: string;
  suggestedSkills?: string[];
}

const DEFAULT_SUGGESTIONS = [
  'React',
  'TypeScript',
  'FastAPI',
  'Python',
  'PostgreSQL',
  'Docker',
  'Node.js',
  'Redis',
  'Vue 3',
  'Go',
  'Git',
  'REST API',
];

export const SkillsWithLevelsEditor: React.FC<SkillsWithLevelsEditorProps> = ({
  skills,
  onChange,
  label = 'Навыки и требуемый уровень владения:',
  suggestedSkills = DEFAULT_SUGGESTIONS,
}) => {
  const [newSkillName, setNewSkillName] = useState('');
  const [newSkillLevel, setNewSkillLevel] = useState<SkillLevel>('INTERMEDIATE');

  const handleAddSkill = (nameToAdd?: string, levelToAdd?: SkillLevel) => {
    const name = (nameToAdd || newSkillName).trim();
    if (!name) return;

    const level = levelToAdd || newSkillLevel;
    const existingIndex = skills.findIndex((s) => s.name.toLowerCase() === name.toLowerCase());

    if (existingIndex >= 0) {
      // Update level if skill already exists
      const updated = [...skills];
      updated[existingIndex] = { ...updated[existingIndex], level };
      onChange(updated);
    } else {
      onChange([...skills, { name, level }]);
    }

    setNewSkillName('');
  };

  const handleRemoveSkill = (skillName: string) => {
    onChange(skills.filter((s) => s.name.toLowerCase() !== skillName.toLowerCase()));
  };

  const handleLevelChange = (skillName: string, newLevel: SkillLevel) => {
    onChange(
      skills.map((s) =>
        s.name.toLowerCase() === skillName.toLowerCase() ? { ...s, level: newLevel } : s
      )
    );
  };

  const availableSuggestions = suggestedSkills.filter(
    (sug) => !skills.some((s) => s.name.toLowerCase() === sug.toLowerCase())
  );

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="block text-[10px] font-mono uppercase tracking-widest text-ink-muted dark:text-stone-400">
          {label}
        </label>
        <span className="text-[10px] font-mono text-ink-muted dark:text-stone-400">
          Всего: {skills.length}
        </span>
      </div>

      {/* Список добавленных навыков с селектором уровня */}
      {skills.length > 0 ? (
        <div className="space-y-1.5 max-h-52 overflow-y-auto p-2 border border-paper-border dark:border-paper-darkBorder bg-paper-light/50 dark:bg-paper-dark/60">
          {skills.map((skill) => (
            <div
              key={skill.name}
              className="flex items-center justify-between gap-3 px-3 py-2 bg-paper-card dark:bg-paper-darkCard border border-paper-border dark:border-paper-darkBorder text-xs font-mono"
            >
              <span className="font-semibold text-ink dark:text-ink-light truncate max-w-[200px]">
                {skill.name}
              </span>

              <div className="flex items-center gap-1.5 shrink-0">
                {(['BASIC', 'INTERMEDIATE', 'ADVANCED'] as SkillLevel[]).map((lvl) => {
                  const isActive = skill.level === lvl;
                  const getActiveColor = () => {
                    switch (lvl) {
                      case 'ADVANCED':
                        return 'bg-emerald-100 text-emerald-950 border-emerald-600 dark:bg-emerald-950/90 dark:text-emerald-300 dark:border-emerald-500 font-bold';
                      case 'INTERMEDIATE':
                        return 'bg-sky-100 text-sky-950 border-sky-600 dark:bg-sky-950/90 dark:text-sky-300 dark:border-sky-500 font-bold';
                      case 'BASIC':
                      default:
                        return 'bg-amber-100 text-amber-950 border-amber-600 dark:bg-amber-950/90 dark:text-amber-300 dark:border-amber-500 font-bold';
                    }
                  };

                  return (
                    <button
                      key={lvl}
                      type="button"
                      onClick={() => handleLevelChange(skill.name, lvl)}
                      className={`px-2.5 py-1 text-[10px] font-mono font-medium uppercase tracking-wider transition-colors cursor-pointer border ${
                        isActive
                          ? getActiveColor()
                          : 'bg-paper-light dark:bg-paper-dark text-ink-muted dark:text-stone-300 border-paper-border dark:border-paper-darkBorder hover:border-ink dark:hover:border-stone-400'
                      }`}
                    >
                      {SKILL_LEVEL_NAMES[lvl]}
                    </button>
                  );
                })}

                <button
                  type="button"
                  onClick={() => handleRemoveSkill(skill.name)}
                  className="w-6 h-6 flex items-center justify-center text-ink-muted hover:text-oxblood dark:hover:text-oxblood-light transition-colors ml-1 cursor-pointer font-bold text-sm"
                  title="Удалить навык"
                >
                  ×
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="p-3 text-center border border-dashed border-paper-border dark:border-paper-darkBorder text-xs font-mono text-ink-muted dark:text-stone-400">
          Навыки пока не добавлены. Введите название ниже или выберите из быстрых подсказок.
        </div>
      )}

      {/* Быстрые подсказки */}
      {availableSuggestions.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5 pt-1">
          <span className="text-[10px] font-mono text-ink-muted dark:text-stone-400 mr-1">
            Быстрое добавление:
          </span>
          {availableSuggestions.slice(0, 6).map((sug) => (
            <button
              key={sug}
              type="button"
              onClick={() => handleAddSkill(sug, 'INTERMEDIATE')}
              className="px-2 py-0.5 text-[10px] font-mono border border-paper-border dark:border-paper-darkBorder bg-paper-card dark:bg-paper-darkCard text-ink-muted hover:text-ink hover:border-ink dark:text-stone-400 dark:hover:text-white transition-colors cursor-pointer"
            >
              + {sug}
            </button>
          ))}
        </div>
      )}

      {/* Поле ввода для добавления нового навыка по четкой сетке */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 pt-1">
        <div className="sm:col-span-6">
          <input
            type="text"
            value={newSkillName}
            onChange={(e) => setNewSkillName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleAddSkill();
              }
            }}
            placeholder="Название компетенции (например, Next.js)"
            className="w-full h-10 px-3 text-xs font-mono bg-paper-light dark:bg-paper-dark border border-paper-border dark:border-paper-darkBorder focus:outline-none focus:border-oxblood text-ink dark:text-ink-light"
          />
        </div>

        <div className="sm:col-span-3 relative">
          <select
            value={newSkillLevel}
            onChange={(e) => setNewSkillLevel(e.target.value as SkillLevel)}
            className="appearance-none w-full h-10 pl-3 pr-9 text-xs font-mono bg-paper-light dark:bg-paper-dark border border-paper-border dark:border-paper-darkBorder focus:outline-none focus:border-oxblood text-ink dark:text-ink-light cursor-pointer"
          >
            <option value="BASIC">Базовый</option>
            <option value="INTERMEDIATE">Уверенный</option>
            <option value="ADVANCED">Продвинутый</option>
          </select>
          <ChevronDown className="w-3.5 h-3.5 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-ink-muted dark:text-stone-400" />
        </div>

        <div className="sm:col-span-3">
          <button
            type="button"
            onClick={() => handleAddSkill()}
            disabled={!newSkillName.trim()}
            className="w-full h-10 text-xs font-mono uppercase tracking-wider bg-ink text-paper-light dark:bg-stone-200 dark:text-stone-900 hover:bg-oxblood dark:hover:bg-oxblood dark:hover:text-white disabled:opacity-40 transition-colors flex items-center justify-center gap-1.5 cursor-pointer font-semibold"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Добавить</span>
          </button>
        </div>
      </div>
    </div>
  );
};
