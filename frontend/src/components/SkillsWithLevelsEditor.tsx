import React, { useState } from 'react';
import { Plus } from 'lucide-react';
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
        <div className="space-y-2 max-h-48 overflow-y-auto p-2 border border-paper-border dark:border-paper-darkBorder bg-paper-light/50 dark:bg-paper-dark/60 rounded-xs">
          {skills.map((skill) => (
            <div
              key={skill.name}
              className="flex flex-wrap items-center justify-between gap-2 p-2 bg-paper-card dark:bg-paper-darkCard border border-paper-border dark:border-paper-darkBorder text-xs font-mono"
            >
              <span className="font-semibold text-ink dark:text-ink-light min-w-[100px]">
                {skill.name}
              </span>

              <div className="flex items-center gap-1.5">
                {(['BASIC', 'INTERMEDIATE', 'ADVANCED'] as SkillLevel[]).map((lvl) => {
                  const isActive = skill.level === lvl;
                  return (
                    <button
                      key={lvl}
                      type="button"
                      onClick={() => handleLevelChange(skill.name, lvl)}
                      className={`px-2 py-0.5 text-[10px] uppercase tracking-wider transition-colors cursor-pointer border ${
                        isActive
                          ? lvl === 'ADVANCED'
                            ? 'bg-oxblood text-white border-oxblood'
                            : lvl === 'INTERMEDIATE'
                            ? 'bg-hunter text-white border-hunter'
                            : 'bg-stone-600 text-white border-stone-600'
                          : 'bg-transparent text-ink-muted dark:text-stone-400 border-paper-border dark:border-paper-darkBorder hover:border-ink dark:hover:border-stone-400'
                      }`}
                    >
                      {SKILL_LEVEL_NAMES[lvl]}
                    </button>
                  );
                })}

                <button
                  type="button"
                  onClick={() => handleRemoveSkill(skill.name)}
                  className="p-1 text-ink-muted hover:text-oxblood dark:hover:text-oxblood-light transition-colors ml-1"
                  title="Удалить"
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

      {/* Поле ввода для добавления нового навыка */}
      <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 pt-1">
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
          placeholder="Название навыка (например, Next.js)"
          className="flex-1 px-3 py-1.5 text-xs font-mono bg-paper-light dark:bg-paper-dark border border-paper-border dark:border-paper-darkBorder focus:outline-none focus:border-ink dark:focus:border-ink-light text-ink dark:text-ink-light"
        />

        <select
          value={newSkillLevel}
          onChange={(e) => setNewSkillLevel(e.target.value as SkillLevel)}
          className="px-2.5 py-1.5 text-xs font-mono bg-paper-light dark:bg-paper-dark border border-paper-border dark:border-paper-darkBorder focus:outline-none text-ink dark:text-ink-light"
        >
          <option value="BASIC">Базовый</option>
          <option value="INTERMEDIATE">Уверенный</option>
          <option value="ADVANCED">Продвинутый</option>
        </select>

        <button
          type="button"
          onClick={() => handleAddSkill()}
          disabled={!newSkillName.trim()}
          className="px-3.5 py-1.5 text-xs font-mono uppercase tracking-wider bg-ink text-paper-light dark:bg-ink-light dark:text-paper-dark hover:bg-oxblood dark:hover:bg-oxblood disabled:opacity-40 transition-colors flex items-center gap-1 cursor-pointer shrink-0"
        >
          <Plus className="w-3.5 h-3.5" /> Добавить
        </button>
      </div>
    </div>
  );
};
