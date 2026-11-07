import React, { useState, useMemo } from 'react';
import {
  Search,
  GraduationCap,
  MapPin,
  Building2,
  Sparkles,
  ArrowRight,
  Send,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  FileText,
} from 'lucide-react';
import type { StudentProfile, Project } from '../../types';
import { SkillBadge } from '../SkillBadge';
import { SemanticMatchBadge } from '../SemanticMatchBadge';
import {
  formatYearDisplay,
  calculateStudentProjectMatch,
  getBestProjectMatchForStudent,
} from '../../utils/dbValidation';

interface StudentsCatalogTabProps {
  students: StudentProfile[];
  projects: Project[];
  companyName?: string;
  onViewStudent?: (studentId: number) => void;
  onContactStudent?: (student: StudentProfile) => void;
}

export const StudentsCatalogTab: React.FC<StudentsCatalogTabProps> = ({
  students,
  projects,
  companyName = 'Софт Инжиниринг',
  onViewStudent,
  onContactStudent,
}) => {
  const [search, setSearch] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedYear, setSelectedYear] = useState<string>('all');
  const [selectedProjectId, setSelectedProjectId] = useState<string>('all');
  const [minMatch, setMinMatch] = useState<number>(0);
  const [sortBy, setSortBy] = useState<'match' | 'year' | 'name'>('match');

  // Проекты данной компании (или все доступные проекты)
  const companyProjects = useMemo(() => {
    const list = projects.filter(
      (p) => !companyName || p.company.toLowerCase() === companyName.toLowerCase()
    );
    return list.length > 0 ? list : projects;
  }, [projects, companyName]);

  // Выбранный проект для расчета соответствия (если выбран конкретный)
  const targetProject = useMemo(() => {
    if (selectedProjectId === 'all') return null;
    return companyProjects.find((p) => String(p.id) === selectedProjectId) || null;
  }, [selectedProjectId, companyProjects]);

  // Вычисляем семантический матч для каждого студента
  const studentsWithMatch = useMemo(() => {
    return students.map((student) => {
      let matchResult;
      if (targetProject) {
        matchResult = calculateStudentProjectMatch(student, targetProject);
      } else {
        matchResult = getBestProjectMatchForStudent(student, companyProjects);
      }

      const matchScore = matchResult ? matchResult.matchScore : (student.aiMatch || 80);
      const matchedSkills = matchResult ? matchResult.matchedSkills : [];
      const missingSkills = matchResult ? matchResult.missingSkills : [];
      const matchedProjectTitle = matchResult
        ? matchResult.projectTitle
        : companyProjects[0]?.title || 'Проекты компании';

      return {
        student,
        matchScore,
        matchedSkills,
        missingSkills,
        matchedProjectTitle,
      };
    });
  }, [students, targetProject, companyProjects]);

  // Фильтрация и сортировка студентов
  const filteredStudents = useMemo(() => {
    const q = search.trim().toLowerCase();

    const filtered = studentsWithMatch.filter(({ student, matchScore }) => {
      // Текстовый поиск
      const matchesSearch =
        !q ||
        student.name.toLowerCase().includes(q) ||
        student.specialization.toLowerCase().includes(q) ||
        (student.city && student.city.toLowerCase().includes(q)) ||
        (student.group && student.group.toLowerCase().includes(q)) ||
        (student.university && student.university.toLowerCase().includes(q)) ||
        student.skills.some((s) => s.name.toLowerCase().includes(q));

      // Фильтр по статусу
      const matchesStatus =
        selectedStatus === 'all' || student.status === selectedStatus;

      // Фильтр по курсу
      const matchesYear =
        selectedYear === 'all' || String(student.year) === selectedYear;

      // Фильтр по минимальному проценту матча
      const matchesMinMatch = matchScore >= minMatch;

      return matchesSearch && matchesStatus && matchesYear && matchesMinMatch;
    });

    // Сортировка
    return filtered.sort((a, b) => {
      if (sortBy === 'match') {
        return b.matchScore - a.matchScore;
      }
      if (sortBy === 'year') {
        return parseInt(String(b.student.year), 10) - parseInt(String(a.student.year), 10);
      }
      if (sortBy === 'name') {
        return a.student.name.localeCompare(b.student.name, 'ru');
      }
      return 0;
    });
  }, [studentsWithMatch, search, selectedStatus, selectedYear, minMatch, sortBy]);

  const resetFilters = () => {
    setSearch('');
    setSelectedStatus('all');
    setSelectedYear('all');
    setSelectedProjectId('all');
    setMinMatch(0);
    setSortBy('match');
  };

  const hasActiveFilters =
    Boolean(search) ||
    selectedStatus !== 'all' ||
    selectedYear !== 'all' ||
    selectedProjectId !== 'all' ||
    minMatch > 0 ||
    sortBy !== 'match';

  // Статусы студентов для фильтра
  const availableStatuses = useMemo(() => {
    const set = new Set<string>();
    students.forEach((s) => {
      if (s.status) set.add(s.status);
    });
    return Array.from(set);
  }, [students]);

  // Средний процент совместимости
  const averageMatch = useMemo(() => {
    if (studentsWithMatch.length === 0) return 0;
    const sum = studentsWithMatch.reduce((acc, curr) => acc + curr.matchScore, 0);
    return Math.round(sum / studentsWithMatch.length);
  }, [studentsWithMatch]);

  return (
    <section id="tab-students-catalog" className="fade-in space-y-8">
      {/* Передовица: Реестр студентов и академических талантов */}
      <div className="border border-paper-border dark:border-paper-darkBorder bg-paper-card dark:bg-paper-darkCard p-6 sm:p-10 relative transition-colors duration-300">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-8 space-y-4 lg:border-r lg:border-paper-border dark:lg:border-paper-darkBorder lg:pr-8">
            <div className="flex items-center gap-3 text-[11px] font-mono uppercase tracking-widest text-oxblood dark:text-oxblood-light">
              <span className="flex items-center gap-1.5">
                <GraduationCap className="w-3.5 h-3.5" /> Реестр молодых специалистов
              </span>
              <span>—</span>
              <span>ВУЗЫ КУЗБАССА</span>
            </div>

            <h1 className="text-3xl sm:text-4xl font-serif font-bold text-ink dark:text-ink-light tracking-tight leading-tight">
              Каталог студентов и соискателей
            </h1>

            <p className="text-sm font-sans text-ink-muted dark:text-stone-300 leading-relaxed max-w-2xl">
              Студенты профильных ИТ-направлений (КемГУ и вузы региона), готовые к
              стажировкам, производственной практике и работе над проектами ВКР. Семантическая
              модель RuBERT + Qwen рассчитывает персональный процент совместимости стека студента
              с требованиями вашей компании ({companyName}).
            </p>

            <div className="flex flex-wrap gap-4 pt-2 text-xs font-mono text-ink-muted dark:text-stone-400">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-600 inline-block" />
                <span>Всего в реестре: <strong className="text-ink dark:text-ink-light">{students.length}</strong></span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-oxblood inline-block" />
                <span>Средний ИИ-матч со стеком: <strong className="text-oxblood dark:text-oxblood-light">{averageMatch}%</strong></span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-sky-600 inline-block" />
                <span>Активных проектов компании: <strong className="text-ink dark:text-ink-light">{companyProjects.length}</strong></span>
              </div>
            </div>
          </div>

          <div className="lg:col-span-4 space-y-4">
            <div className="border border-paper-border dark:border-paper-darkBorder p-5 bg-paper-light dark:bg-paper-dark text-xs space-y-3 font-mono">
              <div className="text-[10px] uppercase tracking-wider text-ink-muted dark:text-stone-400 font-bold flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-oxblood dark:text-oxblood-light" />
                Алгоритм подбора талантов
              </div>
              <p className="text-ink-muted dark:text-stone-400 leading-snug">
                Матч рассчитывается на основе соответствия подтвержденных уровней владения навыками
                (BASIC, INTERMEDIATE, ADVANCED) стеку проектов вашей компании.
              </p>
              <div className="pt-1 text-[11px] text-oxblood dark:text-oxblood-light font-semibold">
                Векторная модель: RuBERT + pgvector
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Панель фильтров и поиска */}
      <div className="p-4 sm:p-5 border border-paper-border dark:border-paper-darkBorder bg-paper-card dark:bg-paper-darkCard space-y-4 transition-colors">
        {/* Поисковая строка и выбор проекта для сравнения */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          <div className="md:col-span-7 relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted dark:text-stone-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Поиск студента по ФИО, специальности, навыкам, группе или городу..."
              className="w-full h-10 pl-9 pr-4 text-xs font-mono bg-paper-light dark:bg-paper-dark border border-paper-border dark:border-paper-darkBorder focus:outline-none focus:border-oxblood text-ink dark:text-ink-light placeholder:text-ink-muted/60"
            />
          </div>

          <div className="md:col-span-5 flex items-center gap-2">
            <label
              htmlFor="students-project-filter"
              className="text-[10px] font-mono uppercase tracking-wider text-ink-muted dark:text-stone-400 shrink-0 hidden sm:inline"
            >
              Матч с проектом:
            </label>
            <select
              id="students-project-filter"
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              className="w-full h-10 px-3 text-xs font-mono bg-paper-light dark:bg-paper-dark border border-paper-border dark:border-paper-darkBorder focus:outline-none focus:border-oxblood text-ink dark:text-ink-light"
            >
              <option value="all">★ Все проекты (лучший матч)</option>
              {companyProjects.map((proj) => (
                <option key={proj.id} value={String(proj.id)}>
                  {proj.title}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Вторая линия фильтров: статус, курс, мин. матч, сортировка */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-3 pt-1 border-t border-paper-border/60 dark:border-paper-darkBorder/60">
          {/* Статус */}
          <div>
            <label
              htmlFor="students-status-filter"
              className="block text-[10px] font-mono uppercase tracking-wider text-ink-muted dark:text-stone-400 mb-1"
            >
              Статус соискателя
            </label>
            <select
              id="students-status-filter"
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full h-9 px-2 text-xs font-mono bg-paper-light dark:bg-paper-dark border border-paper-border dark:border-paper-darkBorder focus:outline-none focus:border-oxblood text-ink dark:text-ink-light"
            >
              <option value="all">Все статусы</option>
              {availableStatuses.map((st) => (
                <option key={st} value={st}>
                  {st}
                </option>
              ))}
            </select>
          </div>

          {/* Курс */}
          <div>
            <label
              htmlFor="students-year-filter"
              className="block text-[10px] font-mono uppercase tracking-wider text-ink-muted dark:text-stone-400 mb-1"
            >
              Курс обучения
            </label>
            <select
              id="students-year-filter"
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="w-full h-9 px-2 text-xs font-mono bg-paper-light dark:bg-paper-dark border border-paper-border dark:border-paper-darkBorder focus:outline-none focus:border-oxblood text-ink dark:text-ink-light"
            >
              <option value="all">Все курсы (1–6)</option>
              <option value="1">1 курс</option>
              <option value="2">2 курс</option>
              <option value="3">3 курс</option>
              <option value="4">4 курс</option>
              <option value="5">5 курс</option>
              <option value="6">6 курс</option>
            </select>
          </div>

          {/* Минимальный процент совпадения */}
          <div>
            <label
              htmlFor="students-match-filter"
              className="block text-[10px] font-mono uppercase tracking-wider text-ink-muted dark:text-stone-400 mb-1"
            >
              Мин. совпадение
            </label>
            <select
              id="students-match-filter"
              value={minMatch}
              onChange={(e) => setMinMatch(Number(e.target.value))}
              className="w-full h-9 px-2 text-xs font-mono bg-paper-light dark:bg-paper-dark border border-paper-border dark:border-paper-darkBorder focus:outline-none focus:border-oxblood text-ink dark:text-ink-light"
            >
              <option value="0">Любое (от 50%)</option>
              <option value="75">От 75%</option>
              <option value="85">От 85%</option>
              <option value="90">От 90% (Высокое)</option>
            </select>
          </div>

          {/* Сортировка */}
          <div>
            <label
              htmlFor="students-sort-filter"
              className="block text-[10px] font-mono uppercase tracking-wider text-ink-muted dark:text-stone-400 mb-1"
            >
              Сортировка
            </label>
            <select
              id="students-sort-filter"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'match' | 'year' | 'name')}
              className="w-full h-9 px-2 text-xs font-mono bg-paper-light dark:bg-paper-dark border border-paper-border dark:border-paper-darkBorder focus:outline-none focus:border-oxblood text-ink dark:text-ink-light"
            >
              <option value="match">По совпадению (ИИ)</option>
              <option value="year">По курсу (старшие)</option>
              <option value="name">По алфавиту (ФИО)</option>
            </select>
          </div>

          {/* Сброс фильтров */}
          <div className="flex items-end col-span-2 sm:col-span-4 lg:col-span-1">
            <button
              type="button"
              onClick={resetFilters}
              disabled={!hasActiveFilters}
              className="w-full h-9 px-3 text-xs font-mono uppercase tracking-wider border border-paper-border dark:border-paper-darkBorder bg-paper-light dark:bg-paper-dark text-ink-muted hover:text-ink dark:hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Сбросить</span>
            </button>
          </div>
        </div>

        {/* Строка со счетчиком результатов */}
        <div className="flex items-center justify-between text-xs font-mono text-ink-muted dark:text-stone-400 pt-1">
          <span>
            Найдено студентов: <strong className="text-ink dark:text-ink-light font-bold">{filteredStudents.length}</strong> из {students.length}
          </span>
          {targetProject && (
            <span className="text-[11px] text-oxblood dark:text-oxblood-light truncate max-w-md hidden sm:inline">
              Сравнение с проектом: «{targetProject.title}»
            </span>
          )}
        </div>
      </div>

      {/* Список карточек студентов */}
      {filteredStudents.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredStudents.map(({ student, matchScore, matchedSkills, missingSkills, matchedProjectTitle }) => {
            const initials = student.name
              .split(' ')
              .map((part) => part[0])
              .join('')
              .slice(0, 2)
              .toUpperCase();

            const isAvailable = student.status === 'Готов к практике' || student.status === 'Готов к стажировке';

            return (
              <div
                key={student.id}
                className="border border-paper-border dark:border-paper-darkBorder bg-paper-card dark:bg-paper-darkCard p-5 sm:p-6 flex flex-col justify-between hover:border-oxblood/60 transition-colors shadow-2xs space-y-4"
              >
                {/* Верхняя часть карточки */}
                <div className="space-y-3.5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 min-w-0">
                      {/* Аватар или Инициалы */}
                      <div className="w-12 h-12 shrink-0 border border-paper-border dark:border-paper-darkBorder bg-paper-muted dark:bg-stone-800 flex items-center justify-center text-oxblood dark:text-oxblood-light font-bold text-sm overflow-hidden">
                        {student.avatarUrl ? (
                          <img
                            src={student.avatarUrl}
                            alt={student.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span>{initials}</span>
                        )}
                      </div>

                      <div className="min-w-0">
                        <button
                          type="button"
                          onClick={() => onViewStudent && student.id && onViewStudent(student.id)}
                          className="text-left font-serif font-bold text-lg text-ink dark:text-ink-light hover:text-oxblood dark:hover:text-oxblood-light transition cursor-pointer leading-snug line-clamp-1"
                        >
                          {student.name}
                        </button>

                        <div className="text-xs font-mono text-oxblood dark:text-oxblood-light font-medium truncate mt-0.5">
                          {student.specialization || 'Студент направления ИТ'}
                        </div>

                        <div className="text-[11px] font-mono text-ink-muted dark:text-stone-400 flex items-center gap-2 flex-wrap mt-1">
                          <span className="flex items-center gap-1">
                            <Building2 className="w-3 h-3 text-ink-muted" />
                            {student.university || 'КемГУ'}
                          </span>
                          <span>•</span>
                          <span>{student.group}</span>
                          <span>•</span>
                          <span className="flex items-center gap-1 font-semibold text-ink dark:text-stone-300">
                            <GraduationCap className="w-3 h-3 text-oxblood dark:text-oxblood-light" />
                            {formatYearDisplay(student.year)}
                          </span>
                          {student.city && (
                            <>
                              <span>•</span>
                              <span className="flex items-center gap-1">
                                <MapPin className="w-3 h-3 text-ink-muted" />
                                {student.city}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* ИИ-Бейдж совместимости */}
                    <div className="shrink-0">
                      <SemanticMatchBadge score={matchScore} size="sm" />
                    </div>
                  </div>

                  {/* Статус поиска студента */}
                  <div className="flex items-center gap-2 flex-wrap text-[11px] font-mono">
                    <span
                      className={`px-2.5 py-0.5 border text-[10px] uppercase tracking-wider font-semibold ${
                        isAvailable
                          ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800'
                          : 'bg-paper-light dark:bg-stone-800 text-ink-muted dark:text-stone-300 border-paper-border dark:border-stone-700'
                      }`}
                    >
                      {student.status || 'В поиске проекта'}
                    </span>

                    {student.telegram && (
                      <span className="text-ink-muted dark:text-stone-400">
                        TG: <strong className="text-oxblood dark:text-oxblood-light">{student.telegram}</strong>
                      </span>
                    )}
                  </div>

                  {/* Краткое био студента */}
                  {student.bio && (
                    <p className="text-xs text-ink-muted dark:text-stone-300 leading-relaxed line-clamp-2">
                      {student.bio}
                    </p>
                  )}

                  {/* Подтвержденный стек навыков студента */}
                  <div className="space-y-1.5 pt-1">
                    <div className="text-[10px] font-mono uppercase tracking-widest text-ink-muted dark:text-stone-400">
                      Подтвержденные компетенции:
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {student.skills.slice(0, 8).map((skill) => (
                        <SkillBadge key={skill.name} skill={skill} size="sm" showLevel />
                      ))}
                      {student.skills.length > 8 && (
                        <span className="text-[10px] font-mono px-2 py-0.5 text-ink-muted border border-paper-border dark:border-paper-darkBorder bg-paper-light dark:bg-paper-dark">
                          +{student.skills.length - 8}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Блок семантического соответствия с проектом */}
                  <div className="p-3 bg-paper-light/70 dark:bg-paper-dark/70 border border-paper-border/80 dark:border-paper-darkBorder/80 space-y-1.5 text-xs font-mono">
                    <div className="flex items-center justify-between text-[10px] uppercase tracking-wider text-ink-muted dark:text-stone-400">
                      <span className="flex items-center gap-1 font-semibold text-oxblood dark:text-oxblood-light">
                        <Sparkles className="w-3 h-3" /> Совместимость с проектом
                      </span>
                      <span className="font-bold text-ink dark:text-ink-light">
                        {matchScore}%
                      </span>
                    </div>

                    <div className="text-[11px] font-semibold text-ink dark:text-ink-light truncate">
                      «{matchedProjectTitle}»
                    </div>

                    {matchedSkills.length > 0 && (
                      <div className="text-[10px] text-ink-muted dark:text-stone-400 flex items-center gap-1 flex-wrap pt-0.5">
                        <span className="text-emerald-700 dark:text-emerald-400 font-semibold flex items-center gap-0.5">
                          <CheckCircle2 className="w-3 h-3" /> Совпало ({matchedSkills.length}):
                        </span>
                        <span>{matchedSkills.map((s) => s.name).join(', ')}</span>
                      </div>
                    )}

                    {missingSkills.length > 0 && (
                      <div className="text-[10px] text-ink-muted dark:text-stone-400 flex items-center gap-1 flex-wrap">
                        <span className="text-amber-700 dark:text-amber-400 font-semibold flex items-center gap-0.5">
                          <AlertCircle className="w-3 h-3" /> Требуется освоить:
                        </span>
                        <span>{missingSkills.slice(0, 3).join(', ')}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Подвал карточки с действиями */}
                <div className="pt-3 border-t border-paper-border dark:border-paper-darkBorder flex items-center justify-between gap-3 flex-wrap">
                  <button
                    type="button"
                    onClick={() => onViewStudent && student.id && onViewStudent(student.id)}
                    className="inline-flex items-center gap-1.5 text-xs font-mono uppercase tracking-wider text-ink hover:text-oxblood dark:text-ink-light dark:hover:text-oxblood-light transition cursor-pointer font-semibold"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>Профиль и резюме</span>
                    <ArrowRight className="w-3 h-3 ml-0.5" />
                  </button>

                  <button
                    type="button"
                    onClick={() => onContactStudent && onContactStudent(student)}
                    className="h-9 px-4 text-xs font-mono uppercase tracking-wider bg-oxblood hover:bg-oxblood-hover text-white transition flex items-center gap-1.5 cursor-pointer shadow-2xs font-semibold"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Пригласить на практику</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="border border-dashed border-paper-border dark:border-paper-darkBorder p-12 text-center space-y-3 bg-paper-card dark:bg-paper-darkCard">
          <GraduationCap className="w-10 h-10 mx-auto text-ink-muted opacity-50" />
          <h3 className="text-base font-serif font-bold text-ink dark:text-ink-light">
            Студенты по выбранным критериям не найдены
          </h3>
          <p className="text-xs font-mono text-ink-muted dark:text-stone-400 max-w-md mx-auto">
            Попробуйте смягчить фильтры поиска, выбрать другой проект для сравнения или сбросить параметры.
          </p>
          <div className="pt-2">
            <button
              type="button"
              onClick={resetFilters}
              className="px-4 py-2 text-xs font-mono uppercase tracking-wider bg-ink text-paper-light dark:bg-stone-200 dark:text-stone-900 hover:bg-oxblood dark:hover:bg-oxblood dark:hover:text-white transition cursor-pointer"
            >
              Сбросить все фильтры
            </button>
          </div>
        </div>
      )}
    </section>
  );
};
