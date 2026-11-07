import React, { useState, useMemo } from 'react';
import {
  Users,
  GraduationCap,
  Building2,
  Search,
  Filter,
  X,
  Send,
  MapPin,
  ArrowRight,
  MessageSquare,
  Crown,
  Sparkles,
  Plus,
} from 'lucide-react';
import type { Candidate, Project, SkillItem, StudentProfile } from '../../types';
import { MOCK_STUDENTS } from '../../data/mockData';
import { SkillBadge } from '../SkillBadge';
import { SemanticMatchBadge } from '../SemanticMatchBadge';
import {
  formatYearDisplay,
  calculateStudentProjectMatch,
  getBestProjectMatchForStudent,
} from '../../utils/dbValidation';

interface HRDashboardTabProps {
  candidates: Candidate[];
  allStudents?: StudentProfile[];
  projects: Project[];
  companyName?: string;
  initialSubTab?: 'recommended' | 'applications';
  onApproveCandidate: (candidateId: string) => void;
  onContactCandidate: (candidateName: string) => void;
  onNavigateToCompanyProfile: () => void;
  onViewStudent?: (studentId: number) => void;
  onOpenChat?: (chatId: string) => void;
  onOpenCreateModal?: () => void;
}

export const HRDashboardTab: React.FC<HRDashboardTabProps> = ({
  candidates,
  allStudents = MOCK_STUDENTS,
  projects,
  companyName = 'Софт Инжиниринг',
  initialSubTab = 'recommended',
  onApproveCandidate,
  onContactCandidate,
  onNavigateToCompanyProfile,
  onViewStudent,
  onOpenChat,
  onOpenCreateModal,
}) => {
  // Вкладка по умолчанию — «Рекомендованные студенты / Каталог студентов»
  const [activeSubTab, setActiveSubTab] = useState<'recommended' | 'applications'>(initialSubTab);

  // Фильтр выбора проекта для семантического матчинга (Задача 8)
  const [selectedProjectId, setSelectedProjectId] = useState<number | 'all'>('all');

  // Фильтры и поиск по каталогу студентов
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCourse, setSelectedCourse] = useState<string>('all');
  const [selectedSkill, setSelectedSkill] = useState<string>('all');

  // Проекты компании для сводки
  const myCompanyProjects = projects.filter(
    (p) => p.company.toLowerCase() === companyName.toLowerCase()
  );

  // Список доступных технологий для быстрого фильтра
  const popularSkills = ['React', 'TypeScript', 'Node.js', 'Python', 'PostgreSQL', 'Docker', 'FastAPI'];

  // Фильтрация студентов
  const filteredStudents = useMemo(() => {
    return allStudents.filter((student) => {
      // Поиск по тексту (ФИО, специализация, вуз, группа, город)
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesName = student.name.toLowerCase().includes(query);
        const matchesSpec = student.specialization.toLowerCase().includes(query);
        const matchesGroup = student.group.toLowerCase().includes(query);
        const matchesCity = student.city.toLowerCase().includes(query);
        const matchesSkill = student.skills.some((sk) =>
          sk.name.toLowerCase().includes(query)
        );

        if (!matchesName && !matchesSpec && !matchesGroup && !matchesCity && !matchesSkill) {
          return false;
        }
      }

      // Фильтр по курсу
      if (selectedCourse !== 'all') {
        if (!student.year.toLowerCase().includes(selectedCourse.toLowerCase())) {
          return false;
        }
      }

      // Фильтр по навыку
      if (selectedSkill !== 'all') {
        const hasSkill = student.skills.some(
          (sk) => sk.name.toLowerCase() === selectedSkill.toLowerCase()
        );
        if (!hasSkill) return false;
      }

      return true;
    });
  }, [allStudents, searchQuery, selectedCourse, selectedSkill]);

  const hasActiveFilters = searchQuery !== '' || selectedCourse !== 'all' || selectedSkill !== 'all';

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedCourse('all');
    setSelectedSkill('all');
  };

  return (
    <section id="tab-hr-dashboard" className="fade-in space-y-8">
      {/* Шапка панели */}
      <div className="double-rule-b pb-5 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <div className="text-[11px] font-mono uppercase tracking-widest text-oxblood dark:text-oxblood-light mb-1">
            Кабинет работодателя • Компания: {companyName}
          </div>
          <h2 className="text-3xl sm:text-4xl font-normal text-ink dark:text-ink-light">
            Поиск студентов и управление откликами
          </h2>
        </div>
        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
          <button
            type="button"
            onClick={onNavigateToCompanyProfile}
            className="px-4 py-2 border border-paper-border dark:border-paper-darkBorder hover:border-ink dark:hover:border-stone-400 text-xs font-mono uppercase tracking-widest text-ink dark:text-ink-light transition flex items-center gap-1.5 cursor-pointer bg-paper-card dark:bg-paper-darkCard"
          >
            <Building2 className="w-3.5 h-3.5 text-oxblood dark:text-oxblood-light" />
            <span>Профиль компании и задачи ({myCompanyProjects.length})</span>
          </button>
        </div>
      </div>

      {/* Сводка (Статистика) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-px bg-paper-border dark:bg-paper-darkBorder border border-paper-border dark:border-paper-darkBorder">
        <div className="bg-paper-card dark:bg-paper-darkCard p-6">
          <div className="text-[11px] font-mono uppercase tracking-widest text-ink-muted dark:text-stone-400">
            Студентов в каталоге
          </div>
          <div className="editorial-serif text-4xl font-bold mt-2 text-ink dark:text-ink-light">
            {String(allStudents.length).padStart(2, '0')}
          </div>
          <div className="text-xs font-mono text-hunter dark:text-emerald-400 mt-2">
            ● Доступны для стажировок и ВКР
          </div>
        </div>

        <div className="bg-paper-card dark:bg-paper-darkCard p-6">
          <div className="text-[11px] font-mono uppercase tracking-widest text-ink-muted dark:text-stone-400">
            Заявок от студентов
          </div>
          <div className="editorial-serif text-4xl font-bold mt-2 text-oxblood dark:text-oxblood-light">
            {String(candidates.length).padStart(2, '0')}
          </div>
          <div className="text-xs font-mono text-ink-muted dark:text-stone-400 mt-2">
            Ранжировано по семантическому матчу
          </div>
        </div>

        <div className="bg-paper-card dark:bg-paper-darkCard p-6">
          <div className="text-[11px] font-mono uppercase tracking-widest text-ink-muted dark:text-stone-400">
            Задачи нашей компании
          </div>
          <div className="editorial-serif text-4xl font-bold mt-2 text-ink dark:text-ink-light">
            {String(myCompanyProjects.length).padStart(2, '0')}
          </div>
          <div className="text-xs font-mono text-ink-muted dark:text-stone-400 mt-2">
            ВКР и стажировки КемГУ
          </div>
        </div>
      </div>

      {/* Переключение вкладок: Каталог студентов / Заявки и отклики */}
      <div className="flex border-b border-paper-border dark:border-paper-darkBorder gap-2 sm:gap-6 text-xs uppercase font-mono tracking-wider">
        <button
          type="button"
          onClick={() => setActiveSubTab('recommended')}
          className={`min-h-[44px] py-2.5 px-3 border-b-2 font-semibold transition-colors flex items-center gap-2 cursor-pointer ${
            activeSubTab === 'recommended'
              ? 'border-oxblood text-oxblood dark:text-oxblood-light'
              : 'border-transparent text-ink-muted hover:text-ink dark:hover:text-white'
          }`}
        >
          <GraduationCap className="w-4 h-4" />
          <span>Рекомендованные студенты / Каталог ({allStudents.length})</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveSubTab('applications')}
          className={`min-h-[44px] py-2.5 px-3 border-b-2 font-semibold transition-colors flex items-center gap-2 cursor-pointer ${
            activeSubTab === 'applications'
              ? 'border-oxblood text-oxblood dark:text-oxblood-light'
              : 'border-transparent text-ink-muted hover:text-ink dark:hover:text-white'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Заявки и отклики ({candidates.length})</span>
        </button>
      </div>

      {/* ========================================================
          ВКЛАДКА 1: Каталог студентов (открыта по умолчанию)
          ======================================================== */}
      {activeSubTab === 'recommended' && (
        <div className="space-y-6">
          {/* Селектор проекта или баннер отсутствия активных проектов (Задача 8) */}
          {myCompanyProjects.length === 0 ? (
            <div className="p-5 border-2 border-dashed border-brass/80 bg-brass/10 dark:bg-amber-950/20 flex flex-col sm:flex-row items-center justify-between gap-4 rounded-xs">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xs bg-brass/20 text-brass flex items-center justify-center shrink-0">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-semibold text-sm text-ink dark:text-ink-light">
                    Нет активных проектов для расчета семантического соответствия
                  </h4>
                  <p className="text-xs text-ink-muted dark:text-stone-400 mt-0.5">
                    Создайте и опубликуйте проект, чтобы рассчитать совместимость кандидатов.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onOpenCreateModal || onNavigateToCompanyProfile}
                className="px-4 py-2 bg-oxblood hover:bg-oxblood-hover text-white text-xs font-mono uppercase tracking-wider transition flex items-center gap-1.5 shrink-0 rounded-xs cursor-pointer shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Создать проект</span>
              </button>
            </div>
          ) : (
            <div className="p-4 bg-paper-card dark:bg-paper-darkCard border border-paper-border dark:border-paper-darkBorder flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xs shadow-2xs">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-brass shrink-0" />
                <span className="text-xs font-mono uppercase tracking-wider text-ink dark:text-ink-light font-semibold">
                  Подобрать под проект:
                </span>
              </div>
              <select
                value={selectedProjectId}
                onChange={(e) =>
                  setSelectedProjectId(e.target.value === 'all' ? 'all' : Number(e.target.value))
                }
                className="px-3 py-2 text-xs font-mono bg-paper-light dark:bg-paper-dark border border-paper-border dark:border-paper-darkBorder text-ink dark:text-ink-light focus:outline-none focus:border-oxblood rounded-xs cursor-pointer w-full sm:w-auto sm:min-w-[320px]"
              >
                <option value="all">★ Все активные проекты ({myCompanyProjects.length}) — лучший матч</option>
                {myCompanyProjects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.index} • {p.title}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Панель поиска и фильтрации */}
          <div className="p-5 border border-paper-border dark:border-paper-darkBorder bg-paper-card dark:bg-paper-darkCard space-y-4">
            <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
              {/* Поисковая строка */}
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-muted dark:text-stone-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Поиск по ФИО, стеку, специальности или группе..."
                  className="w-full pl-10 pr-4 py-2.5 text-xs font-mono bg-paper-light dark:bg-paper-dark border border-paper-border dark:border-paper-darkBorder focus:outline-none focus:border-oxblood dark:focus:border-oxblood-light text-ink dark:text-ink-light placeholder:text-ink-muted/60"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-muted hover:text-ink dark:hover:text-white"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Фильтр по курсу */}
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-[10px] font-mono uppercase tracking-wider text-ink-muted dark:text-stone-400">
                  Курс:
                </span>
                <select
                  value={selectedCourse}
                  onChange={(e) => setSelectedCourse(e.target.value)}
                  className="px-3 py-2 text-xs font-mono bg-paper-light dark:bg-paper-dark border border-paper-border dark:border-paper-darkBorder focus:outline-none focus:border-oxblood text-ink dark:text-ink-light cursor-pointer"
                >
                  <option value="all">Все курсы</option>
                  <option value="IV Курс">IV Курс (ВКР)</option>
                  <option value="III Курс">III Курс (Практика)</option>
                </select>
              </div>
            </div>

            {/* Быстрые фильтры по ключевым технологиям */}
            <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-paper-border/60 dark:border-paper-darkBorder/60">
              <span className="text-[10px] font-mono uppercase tracking-wider text-ink-muted dark:text-stone-400 flex items-center gap-1">
                <Filter className="w-3 h-3" /> Стек:
              </span>
              <button
                type="button"
                onClick={() => setSelectedSkill('all')}
                className={`px-2.5 py-1 text-[10px] font-mono uppercase tracking-wider border transition cursor-pointer ${
                  selectedSkill === 'all'
                    ? 'border-ink bg-ink text-paper-light dark:border-ink-light dark:bg-ink-light dark:text-paper-dark'
                    : 'border-paper-border dark:border-paper-darkBorder text-ink-muted hover:border-ink hover:text-ink dark:hover:text-stone-200'
                }`}
              >
                Все
              </button>
              {popularSkills.map((sk) => (
                <button
                  key={sk}
                  type="button"
                  onClick={() => setSelectedSkill(selectedSkill === sk ? 'all' : sk)}
                  className={`px-2.5 py-1 text-[10px] font-mono uppercase tracking-wider border transition cursor-pointer ${
                    selectedSkill === sk
                      ? 'border-oxblood bg-oxblood text-white'
                      : 'border-paper-border dark:border-paper-darkBorder text-ink-muted hover:border-ink hover:text-ink dark:hover:text-stone-200'
                  }`}
                >
                  {sk}
                </button>
              ))}

              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="ml-auto text-[10px] font-mono uppercase text-oxblood dark:text-oxblood-light hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <X className="w-3 h-3" /> Сбросить фильтры
                </button>
              )}
            </div>
          </div>

          {/* Список студентов */}
          {filteredStudents.length === 0 ? (
            <div className="p-12 text-center border border-paper-border dark:border-paper-darkBorder bg-paper-card dark:bg-paper-darkCard space-y-3">
              <p className="editorial-serif italic text-2xl text-ink-muted dark:text-stone-400">
                Студенты по заданным параметрам не найдены
              </p>
              <p className="text-xs font-mono text-ink-muted dark:text-stone-400">
                Попробуйте изменить поисковый запрос или сбросить фильтры
              </p>
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="px-4 py-2 border border-paper-border dark:border-paper-darkBorder hover:border-ink text-xs font-mono uppercase tracking-wider transition cursor-pointer"
                >
                  Сбросить фильтры
                </button>
              )}
            </div>
          ) : (
            <div className="divide-y divide-paper-border dark:divide-paper-darkBorder border border-paper-border dark:border-paper-darkBorder bg-paper-card dark:bg-paper-darkCard">
              {filteredStudents.map((student, idx) => {
                const studentId = student.id || idx + 1;

                // Семантический матч кандидата с привязкой к конкретному проекту или лучшему из всех (Задача 8)
                const matchResult =
                  selectedProjectId !== 'all'
                    ? (() => {
                        const proj = myCompanyProjects.find((p) => p.id === selectedProjectId);
                        return proj ? calculateStudentProjectMatch(student, proj) : null;
                      })()
                    : getBestProjectMatchForStudent(student, myCompanyProjects);

                return (
                  <article
                    key={studentId}
                    className="p-6 sm:p-7 space-y-4 hover:bg-paper-muted/30 dark:hover:bg-paper-dark/50 transition-colors"
                  >
                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                      {/* Левый блок: Аватар и Инфо о студенте */}
                      <div className="flex items-start gap-4">
                        {/* Кликабельный аватар */}
                        {onViewStudent ? (
                          <button
                            type="button"
                            onClick={() => onViewStudent(studentId)}
                            className="w-14 h-14 border-2 border-ink dark:border-stone-400 bg-paper-muted dark:bg-paper-dark flex items-center justify-center text-ink dark:text-ink-light shrink-0 font-serif font-bold text-lg hover:border-oxblood dark:hover:border-oxblood-light transition cursor-pointer shadow-xs group"
                            title={`Открыть резюме: ${student.name}`}
                          >
                            {student.avatarUrl ? (
                              <img
                                src={student.avatarUrl}
                                alt={student.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <span className="group-hover:text-oxblood dark:group-hover:text-oxblood-light">
                                {student.name
                                  .split(' ')
                                  .map((n) => n[0])
                                  .slice(0, 2)
                                  .join('')}
                              </span>
                            )}
                          </button>
                        ) : (
                          <div className="w-14 h-14 border-2 border-ink dark:border-stone-400 bg-paper-muted dark:bg-paper-dark flex items-center justify-center text-ink dark:text-ink-light shrink-0 font-serif font-bold text-lg">
                            {student.name
                              .split(' ')
                              .map((n) => n[0])
                              .slice(0, 2)
                              .join('')}
                          </div>
                        )}

                        <div className="space-y-1.5">
                          <div className="flex flex-wrap items-center gap-3">
                            <span className="editorial-serif text-2xl font-semibold text-ink dark:text-ink-light">
                              {onViewStudent ? (
                                <button
                                  type="button"
                                  onClick={() => onViewStudent(studentId)}
                                  className="hover:text-oxblood dark:hover:text-oxblood-light hover:underline cursor-pointer transition-colors text-left"
                                >
                                  {student.name}
                                </button>
                              ) : (
                                student.name
                              )}
                            </span>

                            {/* Семантический матч с привязкой к проекту (Задача 8) */}
                            {matchResult ? (
                              <SemanticMatchBadge score={matchResult.matchScore} size="sm" />
                            ) : (
                              <span className="px-2 py-0.5 text-[10px] font-mono text-ink-muted border border-paper-border">
                                Проект не привязан
                              </span>
                            )}

                            <span className="px-2.5 py-0.5 text-[10px] font-mono uppercase tracking-widest bg-hunter text-paper-light">
                              {student.status}
                            </span>
                          </div>

                          {/* Подпись соответствия по проекту */}
                          {matchResult && (
                            <div className="text-[11px] font-mono text-hunter dark:text-emerald-400 flex items-center gap-1.5 pt-0.5">
                              <Sparkles className="w-3.5 h-3.5 text-brass shrink-0" />
                              {selectedProjectId === 'all' ? (
                                <span>
                                  <strong>{matchResult.matchScore}% матч</strong> • Лучший проект: «{matchResult.projectTitle}»
                                </span>
                              ) : (
                                <span>
                                  Совпадение по проекту: «{matchResult.projectTitle}»
                                </span>
                              )}
                            </div>
                          )}

                          {/* Недостающие навыки для выбранного проекта */}
                          {matchResult && matchResult.missingSkills.length > 0 && (
                            <div className="text-[10px] font-mono text-ink-muted dark:text-stone-400 flex items-center gap-1.5 flex-wrap pt-0.5">
                              <span className="text-oxblood dark:text-oxblood-light font-medium">Для проекта требуется:</span>
                              {matchResult.missingSkills.map((sk) => (
                                <span
                                  key={sk}
                                  className="px-1.5 py-0.2 bg-paper-muted dark:bg-stone-800 border border-paper-border dark:border-stone-700 text-ink dark:text-stone-300 rounded-2xs"
                                >
                                  +{sk}
                                </span>
                              ))}
                            </div>
                          )}

                          <div className="text-xs font-mono text-ink-muted dark:text-stone-400 flex flex-wrap items-center gap-x-3 gap-y-1">
                            <span className="font-medium text-oxblood dark:text-oxblood-light">
                              {student.specialization}
                            </span>
                            <span>•</span>
                            <span>
                              {student.university} • {student.group} • {formatYearDisplay(student.year)}
                            </span>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3 h-3" /> {student.city}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Правый блок действий */}
                      <div className="flex items-center gap-2.5 shrink-0 self-start md:self-auto pt-2 md:pt-0">
                        {onViewStudent && (
                          <button
                            type="button"
                            onClick={() => onViewStudent(studentId)}
                            className="px-4 py-2 text-xs font-mono uppercase tracking-wider border border-paper-border dark:border-paper-darkBorder hover:border-ink dark:hover:border-stone-400 text-ink dark:text-ink-light transition flex items-center gap-1.5 cursor-pointer bg-paper-card dark:bg-paper-darkCard shadow-xs"
                          >
                            <span>Резюме</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => onContactCandidate(student.name)}
                          className="px-4 py-2 text-xs font-mono uppercase tracking-wider bg-oxblood hover:bg-oxblood-hover text-white transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                        >
                          <Send className="w-3.5 h-3.5" />
                          <span>Пригласить</span>
                        </button>
                      </div>
                    </div>

                    {/* Описание студента */}
                    {student.bio && (
                      <p className="text-xs sm:text-sm text-ink-muted dark:text-stone-300 leading-relaxed font-normal line-clamp-2">
                        {student.bio}
                      </p>
                    )}

                    {/* Навыки с уровнями */}
                    <div className="pt-1">
                      <div className="text-[10px] font-mono uppercase tracking-widest text-ink-muted dark:text-stone-400 mb-2">
                        Подтвержденные навыки и уровень компетенций:
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {student.skills.map((skill) => (
                          <SkillBadge
                            key={typeof skill === 'string' ? skill : skill.name}
                            skill={skill}
                            size="sm"
                          />
                        ))}
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ========================================================
          ВКЛАДКА 2: Заявки и отклики студентов
          ======================================================== */}
      {activeSubTab === 'applications' && (
        <div className="border border-paper-border dark:border-paper-darkBorder bg-paper-card dark:bg-paper-darkCard transition-colors duration-300">
          <div className="p-6 border-b border-paper-border dark:border-paper-darkBorder flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="text-2xl font-normal text-ink dark:text-ink-light">
                Список откликов на проекты компании
              </h3>
              <p className="text-xs text-ink-muted dark:text-stone-400 font-mono mt-0.5">
                Студенты, подавшие заявку на решение задач компании {companyName}
              </p>
            </div>
            <span className="text-[11px] font-mono uppercase px-2.5 py-1 border border-paper-border dark:border-paper-darkBorder text-ink-muted dark:text-stone-400 self-start sm:self-auto">
              Осенний семестр 2026/2027
            </span>
          </div>

          <div
            id="hr-candidates-list"
            className="divide-y divide-paper-border dark:divide-paper-darkBorder"
          >
            {candidates.length === 0 ? (
              <div className="p-12 text-center space-y-2">
                <p className="editorial-serif italic text-2xl text-ink-muted dark:text-stone-400">
                  Пока нет новых откликов
                </p>
                <p className="text-xs font-mono text-ink-muted dark:text-stone-400">
                  Перейдите во вкладку «Рекомендованные студенты» для поиска и приглашения кандидатов
                </p>
              </div>
            ) : (
              candidates.map((c) => {
                const isAccepted = c.status === 'Принят' || c.status === 'Приглашен';

                return (
                  <div
                    key={c.id}
                    className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:bg-paper-muted/30 dark:hover:bg-paper-dark/60 transition"
                  >
                    <div className="flex items-start gap-4">
                      {/* Кликабельный аватар кандидата */}
                      {onViewStudent && c.studentId ? (
                        <button
                          type="button"
                          onClick={() => onViewStudent(c.studentId!)}
                          className="w-12 h-12 border-2 border-ink dark:border-stone-400 bg-paper-muted dark:bg-paper-dark flex items-center justify-center text-ink dark:text-ink-light shrink-0 font-serif font-bold text-base hover:border-oxblood dark:hover:border-oxblood-light transition cursor-pointer shadow-xs group"
                          title={`Открыть резюме: ${c.name}`}
                        >
                          {c.avatarUrl ? (
                            <img
                              src={c.avatarUrl}
                              alt={c.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span className="group-hover:text-oxblood dark:group-hover:text-oxblood-light">
                              {c.name
                                .split(' ')
                                .map((n) => n[0])
                                .slice(0, 2)
                                .join('')}
                            </span>
                          )}
                        </button>
                      ) : (
                        <div className="w-12 h-12 border-2 border-ink dark:border-stone-400 bg-paper-muted dark:bg-paper-dark flex items-center justify-center text-ink dark:text-ink-light shrink-0 font-serif font-bold text-base">
                          {c.name
                            .split(' ')
                            .map((n) => n[0])
                            .slice(0, 2)
                            .join('')}
                        </div>
                      )}

                      <div className="space-y-2.5">
                        <div className="flex flex-wrap items-center gap-3">
                          <span className="editorial-serif text-2xl font-semibold text-ink dark:text-ink-light">
                            {onViewStudent && c.studentId ? (
                              <button
                                type="button"
                                onClick={() => onViewStudent(c.studentId!)}
                                className="hover:text-oxblood dark:hover:text-oxblood-light hover:underline cursor-pointer transition-colors text-left"
                              >
                                {c.name}
                              </button>
                            ) : (
                              c.name
                            )}
                          </span>
                          {/* Выделенный семантический матч */}
                          <SemanticMatchBadge score={c.match} size="sm" />
                          {c.isTeam && (
                            <span className="px-2 py-0.5 text-[10px] font-mono uppercase tracking-wider bg-oxblood/10 text-oxblood dark:text-oxblood-light border border-oxblood/30 flex items-center gap-1">
                              <Users className="w-3 h-3" /> Командный отклик
                            </span>
                          )}
                          {isAccepted && (
                            <span className="px-2.5 py-0.5 text-[10px] font-mono uppercase tracking-widest border border-brass text-brass">
                              {c.status}
                            </span>
                          )}
                        </div>
                        <div className="text-xs font-mono text-ink-muted dark:text-stone-400">
                          {c.group} — Выбранный проект:{' '}
                          <strong className="text-ink dark:text-stone-200 font-normal underline">
                            {c.project}
                          </strong>
                        </div>

                        {/* Состав команды (application_members) */}
                        {c.teamMembers && c.teamMembers.length > 0 && (
                          <div className="p-2 bg-paper-light dark:bg-stone-900 border border-paper-border dark:border-stone-800 space-y-1">
                            <span className="text-[10px] font-mono text-ink-muted uppercase tracking-wider block">
                              Участники команды (application_members):
                            </span>
                            <div className="flex flex-wrap gap-1.5">
                              {c.teamMembers.map((m) => (
                                <span
                                  key={String(m.studentId)}
                                  className="text-[11px] font-mono px-2 py-0.5 bg-paper-card dark:bg-stone-800 border border-paper-border dark:border-stone-700 flex items-center gap-1"
                                >
                                  {m.role === 'LEAD' && <Crown className="w-3 h-3 text-brass" />}
                                  <span>{m.studentName}</span>
                                  <span className="text-[9px] text-oxblood font-bold">[{m.role}]</span>
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {c.coverLetter && (
                          <p className="text-xs italic text-ink-muted dark:text-stone-300 bg-paper-muted/20 p-2 border-l-2 border-oxblood">
                            «{c.coverLetter}»
                          </p>
                        )}

                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {c.stack.map((s) => (
                            <SkillBadge
                              key={typeof s === 'string' ? s : s.name}
                              skill={s as string | SkillItem}
                              size="sm"
                            />
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <button
                        type="button"
                        disabled={isAccepted}
                        onClick={() => onApproveCandidate(c.id)}
                        className={`px-4 py-2 text-[10px] font-mono uppercase tracking-widest transition cursor-pointer ${
                          isAccepted
                            ? 'bg-paper-muted text-ink-muted dark:bg-paper-dark dark:text-stone-500 cursor-not-allowed'
                            : 'bg-oxblood hover:bg-oxblood-hover text-paper-light shadow-xs'
                        }`}
                      >
                        {isAccepted ? 'Приглашение отправлено' : 'Пригласить в проект'}
                      </button>
                      {onOpenChat && (
                        <button
                          type="button"
                          onClick={() => onOpenChat(c.applicationId ? `chat-${c.applicationId}` : 'chat-app-1')}
                          className="px-4 py-2 border border-paper-border dark:border-paper-darkBorder text-[10px] font-mono uppercase tracking-widest hover:border-ink dark:hover:border-stone-400 text-ink dark:text-ink-light transition cursor-pointer flex items-center gap-1.5"
                        >
                          <MessageSquare className="w-3.5 h-3.5 text-oxblood dark:text-oxblood-light" />
                          <span>Чат по отклику</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </section>
  );
};
