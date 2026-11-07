import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, UserCheck, GraduationCap, Briefcase, Mail, Sparkles, BookOpen } from 'lucide-react';
import type { StudentProfile, SkillItem } from '../../types';
import { SkillsWithLevelsEditor } from '../SkillsWithLevelsEditor';
import { AvatarUploader } from '../AvatarUploader';
import { YearStepper } from '../YearStepper';
import { parseYearToNumber } from '../../utils/dbValidation';

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
  const [firstName, setFirstName] = useState(profile.firstName || profile.name.split(' ')[1] || '');
  const [lastName, setLastName] = useState(profile.lastName || profile.name.split(' ')[0] || '');
  const [university, setUniversity] = useState(profile.university || 'КемГУ');
  const [group, setGroup] = useState(profile.group);
  const [year, setYear] = useState(String(parseYearToNumber(profile.year)));
  const [specialization, setSpecialization] = useState(profile.specialization);
  const [telegram, setTelegram] = useState(profile.telegram);
  const [city, setCity] = useState(profile.city || 'Кемерово');
  const [phone, setPhone] = useState(profile.phone || '+7 (900) 123-45-67');
  const [status, setStatus] = useState(profile.status);
  const [bio, setBio] = useState(profile.bio);
  const [skills, setSkills] = useState<SkillItem[]>(profile.skills);
  const [avatarUrl, setAvatarUrl] = useState<string | undefined>(profile.avatarUrl);

  useEffect(() => {
    if (isOpen) {
      setName(profile.name);
      const parts = profile.name.split(' ');
      setLastName(profile.lastName || parts[0] || '');
      setFirstName(profile.firstName || parts.slice(1).join(' ') || '');
      setUniversity(profile.university || 'КемГУ');
      setGroup(profile.group);
      setYear(String(parseYearToNumber(profile.year)));
      setSpecialization(profile.specialization);
      setTelegram(profile.telegram);
      setCity(profile.city || 'Кемерово');
      setPhone(profile.phone || '+7 (900) 123-45-67');
      setStatus(profile.status);
      setBio(profile.bio);
      setSkills(profile.skills);
      setAvatarUrl(profile.avatarUrl);
    }
  }, [isOpen, profile]);

  if (!isOpen) return null;
  if (typeof document === 'undefined') return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalYear = String(parseYearToNumber(year));
    const fullName = `${lastName.trim()} ${firstName.trim()}`.trim() || name.trim() || profile.name;

    onSave({
      ...profile,
      name: fullName,
      firstName: firstName.trim() || undefined,
      lastName: lastName.trim() || undefined,
      university: university.trim() || 'КемГУ',
      group: group.trim() || profile.group,
      year: finalYear,
      specialization: specialization.trim() || profile.specialization,
      telegram: telegram.trim() || profile.telegram,
      city: city.trim() || profile.city,
      phone: phone.trim(),
      status: status.trim() || profile.status,
      bio: bio.trim() || profile.bio,
      skills,
      avatarUrl,
    });
    onClose();
  };

  return createPortal(
    <div
      className="fixed inset-0 z-50 bg-ink/75 backdrop-blur-xs flex justify-center items-center overflow-y-auto p-3 sm:p-6"
      onClick={onClose}
    >
      <div
        className="relative bg-paper-card dark:bg-paper-darkCard border-2 border-ink dark:border-stone-600 max-w-3xl w-full shadow-2xl fade-in flex flex-col max-h-[calc(100vh-2rem)] sm:max-h-[calc(100vh-3rem)] my-auto overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Зафиксированная шапка модального окна */}
        <div className="shrink-0 flex items-center justify-between border-b border-paper-border dark:border-paper-darkBorder px-6 sm:px-8 py-4 bg-paper-card dark:bg-paper-darkCard">
          <div>
            <div className="text-[10px] font-mono uppercase tracking-widest text-oxblood dark:text-oxblood-light flex items-center gap-1.5 font-bold">
              <UserCheck className="w-3.5 h-3.5" /> Регистрация и редактирование профиля
            </div>
            <h3 className="text-xl sm:text-2xl font-serif font-bold text-ink dark:text-ink-light leading-snug">
              Анкета студента и уровень компетенций
            </h3>
            <p className="text-[11px] font-mono text-ink-muted dark:text-stone-400 mt-0.5">
              Синхронизация персональных данных и навыков с реестром CollabHub
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-ink-muted hover:text-ink dark:hover:text-white transition-colors cursor-pointer shrink-0 ml-3 border border-transparent hover:border-paper-border dark:hover:border-stone-700"
            title="Закрыть окно"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0 overflow-hidden">
          {/* Прокручиваемое тело модального окна по четкой сетке */}
          <div className="flex-1 overflow-y-auto px-6 sm:px-8 py-5 space-y-6 text-sm overscroll-contain">
            
            {/* БЛОК 01: Фото профиля */}
            <div className="space-y-2">
              <div className="text-[10px] font-mono uppercase tracking-widest text-ink-muted dark:text-stone-400 font-bold flex items-center gap-1.5 pb-1 border-b border-paper-border/60 dark:border-paper-darkBorder/60">
                <BookOpen className="w-3 h-3 text-oxblood dark:text-oxblood-light" />
                <span>Фотография профиля</span>
              </div>
              <AvatarUploader
                currentUrl={avatarUrl}
                label="Портретное фото или аватар студента"
                hint="Перетащите файл изображения сюда или нажмите «Выбрать файл»"
                onUpload={(url) => setAvatarUrl(url)}
                onRemove={() => setAvatarUrl(undefined)}
                shape="square"
              />
            </div>

            {/* БЛОК 02: Персональные данные (ФИО) */}
            <div className="space-y-2">
              <div className="text-[10px] font-mono uppercase tracking-widest text-ink-muted dark:text-stone-400 font-bold flex items-center gap-1.5 pb-1 border-b border-paper-border/60 dark:border-paper-darkBorder/60">
                <UserCheck className="w-3 h-3 text-oxblood dark:text-oxblood-light" />
                <span>01. Фамилия и имя</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="student-lastname-input"
                    className="block text-[10px] font-mono uppercase tracking-wider text-ink-muted dark:text-stone-400 mb-1.5 font-semibold"
                  >
                    Фамилия (last_name) <span className="text-oxblood">*</span>
                  </label>
                  <input
                    id="student-lastname-input"
                    type="text"
                    required
                    value={lastName}
                    onChange={(e) => {
                      setLastName(e.target.value);
                      setName(`${e.target.value} ${firstName}`.trim());
                    }}
                    placeholder="Сергиенко"
                    className="w-full h-10 px-3 bg-paper-light dark:bg-paper-dark border border-paper-border dark:border-paper-darkBorder focus:outline-none focus:border-oxblood text-ink dark:text-ink-light text-xs font-mono transition-colors"
                  />
                </div>
                <div>
                  <label
                    htmlFor="student-firstname-input"
                    className="block text-[10px] font-mono uppercase tracking-wider text-ink-muted dark:text-stone-400 mb-1.5 font-semibold"
                  >
                    Имя (first_name) <span className="text-oxblood">*</span>
                  </label>
                  <input
                    id="student-firstname-input"
                    type="text"
                    required
                    value={firstName}
                    onChange={(e) => {
                      setFirstName(e.target.value);
                      setName(`${lastName} ${e.target.value}`.trim());
                    }}
                    placeholder="Александр"
                    className="w-full h-10 px-3 bg-paper-light dark:bg-paper-dark border border-paper-border dark:border-paper-darkBorder focus:outline-none focus:border-oxblood text-ink dark:text-ink-light text-xs font-mono transition-colors"
                  />
                </div>
              </div>
            </div>

            {/* БЛОК 03: Академические данные (ВУЗ, группа, курс) */}
            <div className="space-y-2">
              <div className="text-[10px] font-mono uppercase tracking-widest text-ink-muted dark:text-stone-400 font-bold flex items-center gap-1.5 pb-1 border-b border-paper-border/60 dark:border-paper-darkBorder/60">
                <GraduationCap className="w-3 h-3 text-oxblood dark:text-oxblood-light" />
                <span>02. Академические данные</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-start">
                <div>
                  <label
                    htmlFor="student-univ-input"
                    className="block text-[10px] font-mono uppercase tracking-wider text-ink-muted dark:text-stone-400 mb-1.5 font-semibold truncate"
                  >
                    ВУЗ (по умолч. КемГУ)
                  </label>
                  <input
                    id="student-univ-input"
                    type="text"
                    value={university}
                    onChange={(e) => setUniversity(e.target.value)}
                    className="w-full h-10 px-3 bg-paper-light dark:bg-paper-dark border border-paper-border dark:border-paper-darkBorder focus:outline-none focus:border-oxblood text-ink dark:text-ink-light text-xs font-mono transition-colors"
                  />
                </div>
                <div>
                  <label
                    htmlFor="student-group-input"
                    className="block text-[10px] font-mono uppercase tracking-wider text-ink-muted dark:text-stone-400 mb-1.5 font-semibold truncate"
                  >
                    Академ. группа
                  </label>
                  <input
                    id="student-group-input"
                    type="text"
                    value={group}
                    onChange={(e) => setGroup(e.target.value)}
                    placeholder="ФИТ-231"
                    className="w-full h-10 px-3 bg-paper-light dark:bg-paper-dark border border-paper-border dark:border-paper-darkBorder focus:outline-none focus:border-oxblood text-ink dark:text-ink-light text-xs font-mono transition-colors"
                  />
                </div>
                <div>
                  <label
                    htmlFor="student-year-input"
                    className="block text-[10px] font-mono uppercase tracking-wider text-ink-muted dark:text-stone-400 mb-1.5 font-semibold truncate"
                  >
                    Курс обучения (1..6)
                  </label>
                  <YearStepper
                    id="student-year-input"
                    value={year}
                    onChange={setYear}
                    min={1}
                    max={6}
                  />
                </div>
              </div>
            </div>

            {/* БЛОК 04: Специализация и статус поиска */}
            <div className="space-y-2">
              <div className="text-[10px] font-mono uppercase tracking-widest text-ink-muted dark:text-stone-400 font-bold flex items-center gap-1.5 pb-1 border-b border-paper-border/60 dark:border-paper-darkBorder/60">
                <Briefcase className="w-3 h-3 text-oxblood dark:text-oxblood-light" />
                <span>03. Направление и статус</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="student-spec-input"
                    className="block text-[10px] font-mono uppercase tracking-wider text-ink-muted dark:text-stone-400 mb-1.5 font-semibold"
                  >
                    Специализация / Направление
                  </label>
                  <input
                    id="student-spec-input"
                    type="text"
                    value={specialization}
                    onChange={(e) => setSpecialization(e.target.value)}
                    placeholder="Fullstack / Team Lead / Data Science"
                    className="w-full h-10 px-3 bg-paper-light dark:bg-paper-dark border border-paper-border dark:border-paper-darkBorder focus:outline-none focus:border-oxblood text-ink dark:text-ink-light text-xs font-mono transition-colors"
                  />
                </div>
                <div>
                  <label
                    htmlFor="student-status-input"
                    className="block text-[10px] font-mono uppercase tracking-wider text-ink-muted dark:text-stone-400 mb-1.5 font-semibold"
                  >
                    Текущий статус соискателя
                  </label>
                  <select
                    id="student-status-input"
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="w-full h-10 px-3 bg-paper-light dark:bg-paper-dark border border-paper-border dark:border-paper-darkBorder focus:outline-none focus:border-oxblood text-ink dark:text-ink-light text-xs font-mono transition-colors"
                  >
                    <option value="Готов к практике">Готов к практике</option>
                    <option value="Ищу проект ВКР">Ищу проект ВКР</option>
                    <option value="Готов к стажировке">Готов к стажировке</option>
                    <option value="Занят на проекте">Занят на проекте</option>
                  </select>
                </div>
              </div>
            </div>

            {/* БЛОК 05: Контактная информация */}
            <div className="space-y-2">
              <div className="text-[10px] font-mono uppercase tracking-widest text-ink-muted dark:text-stone-400 font-bold flex items-center gap-1.5 pb-1 border-b border-paper-border/60 dark:border-paper-darkBorder/60">
                <Mail className="w-3 h-3 text-oxblood dark:text-oxblood-light" />
                <span>04. Контактные данные</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label
                    htmlFor="student-tg-input"
                    className="block text-[10px] font-mono uppercase tracking-wider text-ink-muted dark:text-stone-400 mb-1.5 font-semibold"
                  >
                    Telegram
                  </label>
                  <input
                    id="student-tg-input"
                    type="text"
                    value={telegram}
                    onChange={(e) => setTelegram(e.target.value)}
                    placeholder="@username"
                    className="w-full h-10 px-3 bg-paper-light dark:bg-paper-dark border border-paper-border dark:border-paper-darkBorder focus:outline-none focus:border-oxblood text-ink dark:text-ink-light text-xs font-mono text-oxblood dark:text-oxblood-light font-semibold transition-colors"
                  />
                </div>
                <div>
                  <label
                    htmlFor="student-phone-input"
                    className="block text-[10px] font-mono uppercase tracking-wider text-ink-muted dark:text-stone-400 mb-1.5 font-semibold"
                  >
                    Телефон
                  </label>
                  <input
                    id="student-phone-input"
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+7 (900) 000-00-00"
                    className="w-full h-10 px-3 bg-paper-light dark:bg-paper-dark border border-paper-border dark:border-paper-darkBorder focus:outline-none focus:border-oxblood text-ink dark:text-ink-light text-xs font-mono transition-colors"
                  />
                </div>
                <div>
                  <label
                    htmlFor="student-city-input"
                    className="block text-[10px] font-mono uppercase tracking-wider text-ink-muted dark:text-stone-400 mb-1.5 font-semibold"
                  >
                    Город
                  </label>
                  <input
                    id="student-city-input"
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="Кемерово"
                    className="w-full h-10 px-3 bg-paper-light dark:bg-paper-dark border border-paper-border dark:border-paper-darkBorder focus:outline-none focus:border-oxblood text-ink dark:text-ink-light text-xs font-mono transition-colors"
                  />
                </div>
              </div>
            </div>

            {/* БЛОК 06: О себе / практический опыт */}
            <div className="space-y-2">
              <div className="text-[10px] font-mono uppercase tracking-widest text-ink-muted dark:text-stone-400 font-bold flex items-center gap-1.5 pb-1 border-b border-paper-border/60 dark:border-paper-darkBorder/60">
                <Sparkles className="w-3 h-3 text-oxblood dark:text-oxblood-light" />
                <span>05. О себе и практический опыт</span>
              </div>
              <div>
                <label
                  htmlFor="student-bio-input"
                  className="block text-[10px] font-mono uppercase tracking-wider text-ink-muted dark:text-stone-400 mb-1.5 font-semibold"
                >
                  Описание опыта (используется для семантического векторного подбора RuBERT + Qwen)
                </label>
                <textarea
                  id="student-bio-input"
                  rows={3}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Расскажите о своем стеке, реализованных проектах, интересах в разработке..."
                  className="w-full p-3 bg-paper-light dark:bg-paper-dark border border-paper-border dark:border-paper-darkBorder focus:outline-none focus:border-oxblood text-ink dark:text-ink-light leading-relaxed min-h-[80px] max-h-[160px] resize-y text-xs font-mono transition-colors"
                />
              </div>
            </div>

            {/* БЛОК 07: Подтвержденные компетенции (SkillsWithLevelsEditor) */}
            <div className="space-y-2 pt-1">
              <div className="text-[10px] font-mono uppercase tracking-widest text-oxblood dark:text-oxblood-light font-bold flex items-center gap-1.5 pb-1 border-b border-paper-border/60 dark:border-paper-darkBorder/60">
                <Sparkles className="w-3 h-3" />
                <span>06. Подтвержденные компетенции (согласно БД)</span>
              </div>
              <SkillsWithLevelsEditor
                skills={skills}
                onChange={setSkills}
                label="Стек технологий и требуемый уровень владения:"
              />
            </div>

          </div>

          {/* Зафиксированный подвал с кнопками */}
          <div className="shrink-0 flex items-center justify-end gap-3 px-6 sm:px-8 py-4 border-t border-paper-border dark:border-paper-darkBorder bg-paper-card dark:bg-paper-darkCard shadow-inner">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 text-xs font-mono uppercase tracking-wider border border-paper-border dark:border-paper-darkBorder text-ink-muted hover:text-ink dark:hover:text-white transition-colors cursor-pointer bg-paper-light dark:bg-paper-dark"
            >
              Отмена
            </button>
            <button
              type="submit"
              className="px-7 py-2.5 text-xs font-mono uppercase tracking-wider bg-oxblood hover:bg-oxblood-hover text-white transition cursor-pointer shadow-xs font-bold"
            >
              Сохранить профиль
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};
