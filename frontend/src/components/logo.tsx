import React from 'react';

interface LogoProps {
    className?: string;
    showSubtitle?: boolean;
}

export const Logo: React.FC<LogoProps> = ({ className = '', showSubtitle = true }) => {
    return (
        <div className={`inline-flex items-center gap-3.5 select-none group cursor-pointer ${className}`}>
            {/* Векторная монограмма CH (Чистый SVG) */}
            <svg
                viewBox="0 0 100 100"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="w-11 h-11 shrink-0 transition-transform duration-300 group-hover:scale-105"
            >
                {/* Классическая антиквенная С */}
                <path
                    d="M 62 27 C 56 22, 47 20, 38 20 C 19 20, 9 33, 9 50 C 9 67, 19 80, 38 80 C 48 80, 56 77, 63 70"
                    stroke="#6E1E26"
                    strokeWidth="6.5"
                    strokeLinecap="square"
                />
                {/* Верхняя засечка C */}
                <path d="M 62 20 L 63 32" stroke="#6E1E26" strokeWidth="4.5" />

                {/* Левая колонна H (проходит сквозь С) */}
                <line x1="41" y1="14" x2="41" y2="86" stroke="#6E1E26" strokeWidth="6.5" />
                {/* Засечки левой колонны H */}
                <line x1="33" y1="14" x2="49" y2="14" stroke="#6E1E26" strokeWidth="4" />
                <line x1="33" y1="86" x2="49" y2="86" stroke="#6E1E26" strokeWidth="4" />

                {/* Правая колонна H */}
                <line x1="77" y1="26" x2="77" y2="78" stroke="#6E1E26" strokeWidth="6.5" />
                {/* Засечки правой колонны H */}
                <line x1="69" y1="26" x2="85" y2="26" stroke="#6E1E26" strokeWidth="4" />
                <line x1="69" y1="78" x2="85" y2="78" stroke="#6E1E26" strokeWidth="4" />

                {/* Перекладина H */}
                <line x1="41" y1="52" x2="77" y2="52" stroke="#6E1E26" strokeWidth="5.5" />
            </svg>

            {/* Текстовая часть и подпись */}
            <div className="flex flex-col justify-center">
                <div
                    className="text-2xl sm:text-3xl font-bold tracking-tight leading-none"
                    style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
                >
                    <span className="text-[#6E1E26] dark:text-[#9e303b]">Collab</span>
                    <span className="text-[#181615] dark:text-[#F6F3EC]">Hub</span>
                </div>

                {showSubtitle && (
                    <span className="text-[9px] sm:text-[10px] uppercase tracking-[0.14em] text-stone-600 dark:text-stone-400 font-medium mt-1">
                        Платформа проектной деятельности • КемГУ × IT
                    </span>
                )}
            </div>
        </div>
    );
};