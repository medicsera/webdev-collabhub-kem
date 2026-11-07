import React from 'react';
import { Minus, Plus, GraduationCap } from 'lucide-react';
import { parseYearToNumber } from '../utils/dbValidation';

interface YearStepperProps {
  value: string;
  onChange: (newValue: string) => void;
  min?: number;
  max?: number;
  id?: string;
  showSubtitle?: boolean;
}

export const YearStepper: React.FC<YearStepperProps> = ({
  value,
  onChange,
  min = 1,
  max = 6,
  id = 'student-year-input',
  showSubtitle = false,
}) => {
  const currentNum = parseYearToNumber(value);

  const handleDecrement = (e: React.MouseEvent) => {
    e.preventDefault();
    if (currentNum > min) {
      onChange(String(currentNum - 1));
    }
  };

  const handleIncrement = (e: React.MouseEvent) => {
    e.preventDefault();
    if (currentNum < max) {
      onChange(String(currentNum + 1));
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, '');
    if (val === '') {
      onChange('1');
      return;
    }
    const parsed = parseInt(val, 10);
    if (!isNaN(parsed)) {
      const clamped = Math.max(min, Math.min(max, parsed));
      onChange(String(clamped));
    }
  };

  return (
    <div className="w-full">
      <div className="flex items-center h-10 border border-paper-border dark:border-paper-darkBorder bg-paper-light dark:bg-paper-dark transition-colors">
        <button
          type="button"
          onClick={handleDecrement}
          disabled={currentNum <= min}
          aria-label="Уменьшить курс на 1"
          className="w-10 h-full bg-paper-muted dark:bg-stone-800 border-r border-paper-border dark:border-paper-darkBorder hover:bg-oxblood hover:text-white dark:hover:bg-oxblood disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center transition-colors cursor-pointer text-ink dark:text-ink-light shrink-0"
        >
          <Minus className="w-3.5 h-3.5" />
        </button>

        <div className="relative flex-1 h-full flex items-center justify-center">
          <input
            id={id}
            type="number"
            min={min}
            max={max}
            step={1}
            value={currentNum}
            onChange={handleInputChange}
            className="w-full h-full text-center bg-transparent focus:outline-none text-ink dark:text-ink-light font-mono text-xs font-bold [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          />
        </div>

        <button
          type="button"
          onClick={handleIncrement}
          disabled={currentNum >= max}
          aria-label="Увеличить курс на 1"
          className="w-10 h-full bg-paper-muted dark:bg-stone-800 border-l border-paper-border dark:border-paper-darkBorder hover:bg-oxblood hover:text-white dark:hover:bg-oxblood disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center transition-colors cursor-pointer text-ink dark:text-ink-light shrink-0"
        >
          <Plus className="w-3.5 h-3.5" />
        </button>
      </div>

      {showSubtitle && (
        <div className="flex items-center justify-between text-[10px] font-mono text-ink-muted dark:text-stone-400 px-0.5 mt-1">
          <span className="flex items-center gap-1">
            <GraduationCap className="w-3 h-3 text-oxblood dark:text-oxblood-light" />
            {currentNum} курс {currentNum >= 5 ? '(Магистратура/Специалитет)' : '(Бакалавриат)'}
          </span>
          <span className="text-[9px] text-stone-400">1–6</span>
        </div>
      )}
    </div>
  );
};

