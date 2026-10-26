import React, { useRef, useState } from 'react';
import { Upload, X, ImageIcon, AlertCircle } from 'lucide-react';

interface AvatarUploaderProps {
  currentUrl?: string;
  label?: string;
  hint?: string;
  onUpload: (dataUrl: string) => void;
  onRemove: () => void;
  shape?: 'square' | 'circle';
}

const REQUIREMENTS = [
  'Формат: JPG, PNG или WebP',
  'Размер файла: не более 5 МБ',
  'Минимальное разрешение: 200 × 200 пикселей',
  'Рекомендуется квадратное фото (1:1)',
  'Лицо или логотип — по центру кадра',
  'Без текста, рамок и коллажей',
];

export const AvatarUploader: React.FC<AvatarUploaderProps> = ({
  currentUrl,
  label = 'Фото профиля',
  hint = 'Загрузите портретное фото или аватар',
  onUpload,
  onRemove,
  shape = 'square',
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validate = (file: File): string | null => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowed.includes(file.type)) {
      return 'Неверный формат. Допустимы: JPG, PNG, WebP.';
    }
    if (file.size > 5 * 1024 * 1024) {
      return 'Файл слишком большой. Максимум 5 МБ.';
    }
    return null;
  };

  const processFile = (file: File) => {
    const err = validate(file);
    if (err) {
      setError(err);
      return;
    }
    setError(null);

    // Проверяем разрешение через Image
    const reader = new FileReader();
    reader.onload = (ev) => {
      const src = ev.target?.result as string;
      const img = new Image();
      img.onload = () => {
        if (img.width < 200 || img.height < 200) {
          setError('Изображение слишком маленькое (минимум 200 × 200 px).');
          return;
        }
        onUpload(src);
      };
      img.src = src;
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
    // reset input so same file can be re-selected after removal
    e.target.value = '';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  };

  const shapeClass = shape === 'circle' ? 'rounded-full' : '';

  return (
    <div className="space-y-2.5">
      <div className="text-[10px] font-mono uppercase tracking-widest text-ink-muted dark:text-stone-400">
        {label}
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        {/* Превью */}
        <div className="shrink-0">
          <div
            className={`w-20 h-20 border-2 border-paper-border dark:border-paper-darkBorder bg-paper-muted dark:bg-paper-dark flex items-center justify-center overflow-hidden ${shapeClass} relative`}
          >
            {currentUrl ? (
              <>
                <img
                  src={currentUrl}
                  alt="Аватар"
                  className={`w-full h-full object-cover ${shapeClass}`}
                />
                <button
                  type="button"
                  onClick={onRemove}
                  title="Удалить фото"
                  className="absolute top-0 right-0 w-5 h-5 bg-oxblood text-white flex items-center justify-center hover:bg-oxblood-hover transition cursor-pointer"
                >
                  <X className="w-3 h-3" />
                </button>
              </>
            ) : (
              <ImageIcon className="w-7 h-7 text-ink-muted dark:text-stone-600" />
            )}
          </div>
        </div>

        {/* Зона загрузки */}
        <div className="flex-1 flex flex-col gap-1.5">
          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => inputRef.current?.click()}
            className={`border-2 border-dashed p-2.5 cursor-pointer transition-colors flex flex-col items-center justify-center gap-1 ${
              dragOver
                ? 'border-oxblood bg-oxblood/5 dark:bg-oxblood/10'
                : 'border-paper-border dark:border-paper-darkBorder hover:border-ink dark:hover:border-stone-400 bg-paper-light dark:bg-paper-dark'
            }`}
          >
            <Upload className="w-4 h-4 text-ink-muted dark:text-stone-500" />
            <p className="text-xs font-mono text-ink-muted dark:text-stone-400 text-center leading-tight">
              {dragOver ? 'Отпустите файл...' : hint}
            </p>
            <span className="text-[10px] font-mono uppercase tracking-wider text-oxblood dark:text-oxblood-light font-medium">
              Выбрать файл
            </span>
          </div>

          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={handleFileChange}
          />

          {error && (
            <div className="flex items-start gap-1.5 text-[11px] font-mono text-oxblood dark:text-oxblood-light">
              <AlertCircle className="w-3.5 h-3.5 mt-px shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </div>
      </div>

      {/* Требования (компактная сетка 2 колонки) */}
      <div className="bg-paper-muted/50 dark:bg-paper-dark border border-paper-border/60 dark:border-paper-darkBorder/60 p-2.5 space-y-1">
        <div className="text-[9px] font-mono uppercase tracking-widest text-ink-muted dark:text-stone-500">
          Требования к изображению
        </div>
        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-3 gap-y-0.5">
          {REQUIREMENTS.map((req) => (
            <li key={req} className="text-[10.5px] font-mono text-ink-muted dark:text-stone-400 flex items-start gap-1.5 leading-snug">
              <span className="text-oxblood dark:text-oxblood-light shrink-0">·</span>
              <span>{req}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};
