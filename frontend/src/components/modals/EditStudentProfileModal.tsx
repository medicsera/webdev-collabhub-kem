import React, { useState, useEffect } from 'react';
import { X, UserCheck } from 'lucide-react';
import type { StudentProfile, SkillItem } from '../../types';
import { SkillsWithLevelsEditor } from '../SkillsWithLevelsEditor';

interface EditStudentProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: StudentProfile;
  onSave: (updatedProfile: StudentProfile) => void;
}

export const EditStudentProfileModal: React.FC<EditStudentProfileModalProps> = ({
  isOpen,
  onClose,
  profile,
  onSave,
}) => {
  const [name, setName] = useState(profile.name);
  const [university, setUniversity] = useState(profile.university);
  const [group, setGroup] = useState(profile.group);
  const [year, setYear] = useState(profile.year);
  const [specialization, setSpecialization] = useState(profile.specialization);
  const [telegram, setTelegram] = useState(profile.telegram);
  const [city, setCity] = useState(profile.city);
  const [status, setStatus] = useState(profile.status);
  const [bio, setBio] = useState(profile.bio);
  const [skills, setSkills] = useState<SkillItem[]>(profile.skills);

  useEffect(() => {
    if (isOpen) {
      setName(profile.name);
      setUniversity(profile.university);
      setGroup(profile.group);
      setYear(profile.year);
      setSpecialization(profile.specialization);
      setTelegram(profile.telegram);
      setCity(profile.city);
      setStatus(profile.status);
      setBio(profile.bio);
      setSkills(profile.skills);
    }
  }, [isOpen, profile]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...profile,
      name: name.trim() || profile.name,
      university: university.trim() || profile.university,
      group: group.trim() || profile.group,
      year: year.trim() || profile.year,
      specialization: specialization.trim() || profile.specialization,
      telegram: telegram.trim() || profile.telegram,
      city: city.trim() || profile.city,
      status: status.trim() || profile.status,
      bio: bio.trim() || profile.bio,
      skills,
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
            <div className="text-[10px] font-mono uppercase tracking-widest text-oxblood dark:text-oxblood-light flex items-center gap-1.5">
              <UserCheck className="w-3.5 h-3.5" /> Регистрация и редактирование профиля
            </div>
            <h3 className="text-2xl font-semibold text-ink dark:text-ink-light">
              Анкета студента и уровень компетенций
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label
                htmlFor="student-name-input"
                className="block text-[10px] font-mono uppercase tracking-widest text-ink-muted dark:text-stone-400 mb-1"
              >
                ФИО студента
              </label>
              <input
                id="student-name-input"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 bg-paper-light dark:bg-paper-dark border border-paper-border dark:border-paper-darkBorder focus:outline-none text-ink dark:text-ink-light text-xs font-mono"
              />
            </div>
            <div>
              <label
                htmlFor="student-spec-input"
                className="block text-[10px] font-mono uppercase tracking-widest text-ink-muted dark:text-stone-400 mb-1"
              >
                Специализация / Направление
              </label>
              <input
                id="student-spec-input"
                type="text"
                value={specialization}
                onChange={(e) => setSpecialization(e.target.value)}
                placeholder="Fullstack / Backend / Data Science"
                className="w-full px-3 py-2 bg-paper-light dark:bg-paper-dark border border-paper-border dark:border-paper-darkBorder focus:outline-none text-ink dark:text-ink-light text-xs font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label
                htmlFor="student-univ-input"
                className="block text-[10px] font-mono uppercase tracking-widest text-ink-muted dark:text-stone-400 mb-1"
              >
                ВУЗ
              </label>
              <input
                id="student-univ-input"
                type="text"
                value={university}
                onChange={(e) => setUniversity(e.target.value)}
                className="w-full px-3 py-2 bg-paper-light dark:bg-paper-dark border border-paper-border dark:border-paper-darkBorder focus:outline-none text-ink dark:text-ink-light text-xs font-mono"
              />
            </div>
            <div>
              <label
                htmlFor="student-group-input"
                className="block text-[10px] font-mono uppercase tracking-widest text-ink-muted dark:text-stone-400 mb-1"
              >
                Группа
              </label>
              <input
                id="student-group-input"
                type="text"
                value={group}
                onChange={(e) => setGroup(e.target.value)}
                className="w-full px-3 py-2 bg-paper-light dark:bg-paper-dark border border-paper-border dark:border-paper-darkBorder focus:outline-none text-ink dark:text-ink-light text-xs font-mono"
              />
            </div>
            <div>
              <label
                htmlFor="student-year-input"
                className="block text-[10px] font-mono uppercase tracking-widest text-ink-muted dark:text-stone-400 mb-1"
              >
                Курс
              </label>
              <input
                id="student-year-input"
                type="text"
                value={year}
                onChange={(e) => setYear(e.target.value)}
                className="w-full px-3 py-2 bg-paper-light dark:bg-paper-dark border border-paper-border dark:border-paper-darkBorder focus:outline-none text-ink dark:text-ink-light text-xs font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label
                htmlFor="student-tg-input"
                className="block text-[10px] font-mono uppercase tracking-widest text-ink-muted dark:text-stone-400 mb-1"
              >
                Telegram
              </label>
              <input
                id="student-tg-input"
                type="text"
                value={telegram}
                onChange={(e) => setTelegram(e.target.value)}
                className="w-full px-3 py-2 bg-paper-light dark:bg-paper-dark border border-paper-border dark:border-paper-darkBorder focus:outline-none text-ink dark:text-ink-light text-xs font-mono text-oxblood dark:text-oxblood-light"
              />
            </div>
            <div>
              <label
                htmlFor="student-city-input"
                className="block text-[10px] font-mono uppercase tracking-widest text-ink-muted dark:text-stone-400 mb-1"
              >
                Город
              </label>
              <input
                id="student-city-input"
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full px-3 py-2 bg-paper-light dark:bg-paper-dark border border-paper-border dark:border-paper-darkBorder focus:outline-none text-ink dark:text-ink-light text-xs font-mono"
              />
            </div>
            <div>
              <label
                htmlFor="student-status-input"
                className="block text-[10px] font-mono uppercase tracking-widest text-ink-muted dark:text-stone-400 mb-1"
              >
                Статус
              </label>
              <select
                id="student-status-input"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full px-3 py-2 bg-paper-light dark:bg-paper-dark border border-paper-border dark:border-paper-darkBorder focus:outline-none text-ink dark:text-ink-light text-xs font-mono"
              >
                <option value="Готов к практике">Готов к практике</option>
                <option value="Ищу проект ВКР">Ищу проект ВКР</option>
                <option value="Занят на проекте">Занят на проекте</option>
              </select>
            </div>
          </div>

          <div>
            <label
              htmlFor="student-bio-input"
              className="block text-[10px] font-mono uppercase tracking-widest text-ink-muted dark:text-stone-400 mb-1"
            >
              О себе / практический опыт (для семантического подбора ИИ)
            </label>
            <textarea
              id="student-bio-input"
              rows={3}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className="w-full p-3 bg-paper-light dark:bg-paper-dark border border-paper-border dark:border-paper-darkBorder focus:outline-none focus:border-ink dark:focus:border-ink-light text-ink dark:text-ink-light leading-relaxed min-h-[70px] max-h-[140px] resize-y text-xs sm:text-sm"
            />
          </div>

          {/* Уровни владения навыками согласно БД (Requirement 1) */}
          <SkillsWithLevelsEditor
            skills={skills}
            onChange={setSkills}
            label="Мои навыки и подтвержденный уровень владения (согласно БД):"
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
              Сохранить профиль
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
