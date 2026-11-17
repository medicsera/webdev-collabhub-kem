import React, { useState, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  Users,
  Search,
  Filter,
  X,
  Send,
  MapPin,
  ArrowRight,
  MessageSquare,
  Sparkles,
  Plus,
  Briefcase,
  Edit,
  Trash2,
  CheckCircle2,
  FileEdit,
  Lock,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import type {
  Candidate,
  Project,
  ProjectStatus,
  StudentProfile,
} from '../../types';
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
  initialSubTab?: 'projects' | 'matching' | 'applications';
  onApproveCandidate: (candidateId: string) => void;
  onContactCandidate: (candidateName: string) => void;
  onNavigateToCompanyProfile?: () => void;
  onViewStudent?: (studentId: number) => void;
  onOpenChat?: (chatId: string) => void;
  onOpenCreateModal?: () => void;
  onEditProject?: (project: Project) => void;
  onDeleteProject?: (projectId: number) => void;
  onUpdateProjectStatus?: (projectId: number, newStatus: ProjectStatus) => void;
}

export const HRDashboardTab: React.FC<HRDashboardTabProps> = ({
  candidates,
  allStudents = MOCK_STUDENTS,
  projects,
  companyName = 'Софт Инжиниринг',
  initialSubTab = 'projects',
  onApproveCandidate,
  onContactCandidate,
  onNavigateToCompanyProfile,
  onViewStudent,
  onOpenChat,
  onOpenCreateModal,
  onEditProject,
  onDeleteProject,
  onUpdateProjectStatus,
}) => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // Главная система вкладок панели компании, синхронизированная с URL (?tab=projects|matching|applications)
  const subTabFromUrl = searchParams.get('tab') as 'projects' | 'matching' | 'applications' | null;
  const activeSubTab = subTabFromUrl || initialSubTab || 'projects';

  const setActiveSubTab = (newSubTab: 'projects' | 'matching' | 'applications') => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set('tab', newSubTab);
      return next;
    }, { replace: true });
  };

  const handleCreateProjectNav = () => {
    if (onOpenCreateModal) {
      onOpenCreateModal();
    } else {
      navigate('/hr/projects/create');
    }
  };

  const handleEditProjectNav = (project: Project) => {
    if (onEditProject) {
      onEditProject(project);
    } else {
      navigate(`/hr/projects/${project.id}/edit`);
    }
  };

  const handleViewStudentNav = (studentId: number) => {
    if (onViewStudent) {
      onViewStudent(studentId);
    } else {
      navigate(`/students/${studentId}`);
    }
  };

  const handleOpenChatNav = (chatId: string) => {
    if (onOpenChat) {
      onOpenChat(chatId);
    } else {
      navigate(`/chats?chatId=${encodeURIComponent(chatId)}`);
    }
  };

  const handleEditCompanyNav = () => {
    if (onNavigateToCompanyProfile) {
      onNavigateToCompanyProfile();
    } else {
      navigate('/company/profile/edit');
    }
  };

  // Фильтры списка проектов
  const [projectStatusFilter, setProjectStatusFilter] = useState<string>('all');
  const [projectSearchQuery, setProjectSearchQuery] = useState('');
  const [projectTypeFilter, setProjectTypeFilter] = useState<string>('all');

  // Аккордеон раскрытых кандидатов внутри карточки проекта
  const [expandedProjectCandidatesId, setExpandedProjectCandidatesId] = useState<number | null>(
    null
  );

  // Выбранный проект для ИИ-подбора кандидатов (GET /api/organizations/projects/:id/matches)
  const [selectedMatchingProjectId, setSelectedMatchingProjectId] = useState<number | 'all'>('all');

  // Фильтры и поиск во вкладке «Подбор кандидатов»
  const [studentSearchQuery, setStudentSearchQuery] = useState('');
  const [selectedCourse, setSelectedCourse] = useState<string>('all');
  const [selectedSkill, setSelectedSkill] = useState<string>('all');

  // Проекты текущей компании
  const myCompanyProjects = useMemo(() => {
    return projects.filter(
      (p) => p.company.toLowerCase() === companyName.toLowerCase()
    );
  }, [projects, companyName]);

  // Статистика проектов компании
  const activeProjectsCount = myCompanyProjects.filter(
    (p) => (p.projectStatus || 'ACTIVE') === 'ACTIVE'
  ).length;

  const draftProjectsCount = myCompanyProjects.filter(
    (p) => p.projectStatus === 'DRAFT'
  ).length;

  const closedProjectsCount = myCompanyProjects.filter(
    (p) => p.projectStatus === 'CLOSED'
  ).length;

  // Фильтрация проектов компании
  const filteredCompanyProjects = useMemo(() => {
    return myCompanyProjects.filter((project) => {
      const currentStatus = project.projectStatus || 'ACTIVE';

      // Фильтр по статусу
      if (projectStatusFilter !== 'all' && currentStatus !== projectStatusFilter) {
        return false;
      }

      // Фильтр по типу / формату
      if (projectTypeFilter !== 'all' && project.type !== projectTypeFilter) {
        return false;
      }

      // Текстовый поиск по проектам
      if (projectSearchQuery.trim()) {
        const query = projectSearchQuery.toLowerCase();
        const matchesTitle = project.title.toLowerCase().includes(query);
        const matchesDesc = project.desc.toLowerCase().includes(query);
        const matchesDept = project.department.toLowerCase().includes(query);
        const matchesTag = project.tags.some((t) => t.toLowerCase().includes(query));
        const matchesReqSkill = project.requiredSkills?.some((s) =>
          s.name.toLowerCase().includes(query)
        );

        if (!matchesTitle && !matchesDesc && !matchesDept && !matchesTag && !matchesReqSkill) {
          return false;
        }
      }

      return true;
    });
  }, [myCompanyProjects, projectStatusFilter, projectTypeFilter, projectSearchQuery]);

  // Популярные навыки для быстрого фильтра кандидатов
  const popularSkills = [
    'React',
    'TypeScript',
    'Node.js',
    'Python',
    'PostgreSQL',
    'Docker',
    'FastAPI',
  ];

  // Фильтрация студентов для вкладки подбора
  const filteredStudents = useMemo(() => {
    return allStudents.filter((student) => {
      if (studentSearchQuery.trim()) {
        const query = studentSearchQuery.toLowerCase();
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

      if (selectedCourse !== 'all') {
        if (!student.year.toLowerCase().includes(selectedCourse.toLowerCase())) {
          return false;
        }
      }

      if (selectedSkill !== 'all') {
        const hasSkill = student.skills.some(
          (sk) => sk.name.toLowerCase() === selectedSkill.toLowerCase()
        );
        if (!hasSkill) return false;
      }

      return true;
    });
  }, [allStudents, studentSearchQuery, selectedCourse, selectedSkill]);

  const hasActiveStudentFilters =
    studentSearchQuery !== '' || selectedCourse !== 'all' || selectedSkill !== 'all';

  const handleResetStudentFilters = () => {
    setStudentSearchQuery('');
    setSelectedCourse('all');
    setSelectedSkill('all');
  };

  // Переход во вкладку подбора с автовыбором проекта
  const handleOpenMatchingForProject = (projectId: number) => {
    setSelectedMatchingProjectId(projectId);
    setActiveSubTab('matching');
    window.scrollTo({ top: 200, behavior: 'smooth' });
  };

  // Переключение статуса проекта
  const handleStatusChange = (projectId: number, newStatus: ProjectStatus) => {
    if (onUpdateProjectStatus) {
      onUpdateProjectStatus(projectId, newStatus);
    }
  };

  // Отрисовка бейджа статуса
  const renderStatusBadge = (status?: ProjectStatus) => {
    const s = status || 'ACTIVE';
    switch (s) {
      case 'ACTIVE':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-[10px] font-mono uppercase tracking-wider bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30">
            <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
            <span>Опубликован (ACTIVE)</span>
          </span>
        );
      case 'DRAFT':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-[10px] font-mono uppercase tracking-wider bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/30">
            <FileEdit className="w-3 h-3 text-amber-600 dark:text-amber-400" />
            <span>Черновик (DRAFT)</span>
          </span>
        );
      case 'CLOSED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-[10px] font-mono uppercase tracking-wider bg-stone-500/10 text-stone-700 dark:text-stone-300 border border-stone-500/30">
            <Lock className="w-3 h-3 text-stone-600 dark:text-stone-400" />
            <span>Набор закрыт (CLOSED)</span>
          </span>
        );
      case 'ARCHIVED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-[10px] font-mono uppercase tracking-wider bg-stone-400/10 text-stone-500 border border-stone-400/20">
            <span>В архиве</span>
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <section id="tab-hr-dashboard" className="fade-in space-y-8">
      {/* ========================================================
          Шапка панели компании
          ======================================================== */}
      <div className="double-rule-b pb-5 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <div className="text-[11px] font-mono uppercase tracking-widest text-oxblood dark:text-oxblood-light mb-1">
            Кабинет работодателя • Компания: {companyName}
          </div>
          <h2 className="text-3xl sm:text-4xl font-normal text-ink dark:text-ink-light">
            Управление проектными задачами и кандидатами
          </h2>
        </div>
        <div className="flex flex-wrap items-center gap-2.5 self-start sm:self-auto">
          <button
            type="button"
            onClick={handleEditCompanyNav}
            className="px-4 py-2 border border-paper-border dark:border-paper-darkBorder hover:border-ink dark:hover:border-stone-400 text-xs font-mono uppercase tracking-widest text-ink dark:text-ink-light transition flex items-center gap-1.5 cursor-pointer bg-paper-card dark:bg-paper-darkCard"
          >
            <Edit className="w-3.5 h-3.5 text-oxblood dark:text-oxblood-light" />
            <span>Редактировать компанию</span>
          </button>
          <button
            type="button"
            onClick={handleCreateProjectNav}
            className="btn-editorial px-4 py-2 bg-ink text-paper-light dark:bg-paper-light dark:text-ink text-xs font-mono uppercase tracking-widest transition flex items-center gap-1.5 cursor-pointer border border-ink dark:border-paper-light"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Добавить проект</span>
          </button>
        </div>
      </div>

      {/* ========================================================
          Сводка статистики
          ======================================================== */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="border border-paper-border dark:border-paper-darkBorder bg-paper-card dark:bg-paper-darkCard p-5">
          <div className="text-[10px] font-mono uppercase tracking-widest text-ink-muted dark:text-stone-400">
            Всего проектов
          </div>
          <div className="editorial-serif text-3xl sm:text-4xl font-bold mt-1.5 text-ink dark:text-ink-light">
            {String(myCompanyProjects.length).padStart(2, '0')}
          </div>
          <div className="text-xs font-mono text-hunter dark:text-emerald-400 mt-1.5">
            ● В реестре компании
          </div>
        </div>

        <div className="border border-paper-border dark:border-paper-darkBorder bg-paper-card dark:bg-paper-darkCard p-5">
          <div className="text-[10px] font-mono uppercase tracking-widest text-ink-muted dark:text-stone-400">
            Активных (ACTIVE)
          </div>
          <div className="editorial-serif text-3xl sm:text-4xl font-bold mt-1.5 text-hunter dark:text-emerald-400">
            {String(activeProjectsCount).padStart(2, '0')}
          </div>
          <div className="text-xs font-mono text-ink-muted dark:text-stone-400 mt-1.5">
            Открыты для заявок
          </div>
        </div>

        <div className="border border-paper-border dark:border-paper-darkBorder bg-paper-card dark:bg-paper-darkCard p-5">
          <div className="text-[10px] font-mono uppercase tracking-widest text-ink-muted dark:text-stone-400">
            В черновиках (DRAFT)
          </div>
          <div className="editorial-serif text-3xl sm:text-4xl font-bold mt-1.5 text-oxblood dark:text-oxblood-light">
            {String(draftProjectsCount).padStart(2, '0')}
          </div>
          <div className="text-xs font-mono text-ink-muted dark:text-stone-400 mt-1.5">
            {closedProjectsCount > 0 ? `+ ${closedProjectsCount} закрытых` : 'Скрыты из каталога'}
          </div>
        </div>

        <div className="border border-paper-border dark:border-paper-darkBorder bg-paper-card dark:bg-paper-darkCard p-5">
          <div className="text-[10px] font-mono uppercase tracking-widest text-ink-muted dark:text-stone-400">
            Откликов студентов
          </div>
          <div className="editorial-serif text-3xl sm:text-4xl font-bold mt-1.5 text-oxblood dark:text-oxblood-light">
            {String(candidates.length).padStart(2, '0')}
          </div>
          <div className="text-xs font-mono text-ink-muted dark:text-stone-400 mt-1.5">
            Заявки на рассмотрении
          </div>
        </div>
      </div>

      {/* ========================================================
          Навигационные вкладки панели компании
          (Вкладка по умолчанию — «Мои проекты»)
          ======================================================== */}
      <div className="flex border-b border-paper-border dark:border-paper-darkBorder gap-2 sm:gap-6 text-xs uppercase font-mono tracking-wider overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveSubTab('projects')}
          className={`min-h-[46px] px-5 py-3 border-b-2 font-semibold transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
            activeSubTab === 'projects'
              ? 'border-oxblood text-oxblood dark:text-oxblood-light bg-oxblood/5 dark:bg-oxblood/10'
              : 'border-transparent text-ink-muted hover:text-ink dark:hover:text-white'
          }`}
        >
          <Briefcase className="w-4 h-4" />
          <span>Мои проекты ({myCompanyProjects.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('matching')}
          className={`min-h-[46px] px-5 py-3 border-b-2 font-semibold transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
            activeSubTab === 'matching'
              ? 'border-oxblood text-oxblood dark:text-oxblood-light bg-oxblood/5 dark:bg-oxblood/10'
              : 'border-transparent text-ink-muted hover:text-ink dark:hover:text-white'
          }`}
        >
          <Sparkles className="w-4 h-4 text-brass" />
          <span>Подбор кандидатов (ИИ)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('applications')}
          className={`min-h-[46px] px-5 py-3 border-b-2 font-semibold transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
            activeSubTab === 'applications'
              ? 'border-oxblood text-oxblood dark:text-oxblood-light bg-oxblood/5 dark:bg-oxblood/10'
              : 'border-transparent text-ink-muted hover:text-ink dark:hover:text-white'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Отклики студентов ({candidates.length})</span>
        </button>
      </div>

      {/* ========================================================
          ВКЛАДКА 1: Мои проекты компании (Отображается сразу при входе)
          ======================================================== */}
      {activeSubTab === 'projects' && (
        <div className="space-y-6">
          {/* Панель фильтров и поиска проектов */}
          <div className="p-4 sm:p-5 border border-paper-border dark:border-paper-darkBorder bg-paper-card dark:bg-paper-darkCard space-y-4">
            <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
              {/* Поиск по проектам */}
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-muted dark:text-stone-400" />
                <input
                  type="text"
                  value={projectSearchQuery}
                  onChange={(e) => setProjectSearchQuery(e.target.value)}
                  placeholder="Поиск по названию задачи, технологиям, отделу..."
                  className="w-full pl-10 pr-4 py-2 text-xs font-mono bg-paper-light dark:bg-paper-dark border border-paper-border dark:border-paper-darkBorder focus:outline-none focus:border-oxblood dark:focus:border-oxblood-light text-ink dark:text-ink-light placeholder:text-ink-muted/60"
                />
                {projectSearchQuery && (
                  <button
                    type="button"
                    onClick={() => setProjectSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-muted hover:text-ink dark:hover:text-white"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Фильтр по формату */}
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-[10px] font-mono uppercase tracking-wider text-ink-muted dark:text-stone-400">
                  Формат:
                </span>
                <div className="relative inline-flex items-center">
                  <select
                    value={projectTypeFilter}
                    onChange={(e) => setProjectTypeFilter(e.target.value)}
                    className="appearance-none pl-3.5 pr-9 py-2 text-xs font-mono bg-paper-light dark:bg-paper-dark border border-paper-border dark:border-paper-darkBorder focus:outline-none focus:border-oxblood text-ink dark:text-ink-light cursor-pointer"
                  >
                    <option value="all">Все форматы</option>
                    <option value="ВКР / Диплом">ВКР / Диплом</option>
                    <option value="Стажировка">Стажировка</option>
                    <option value="Курсовой проект">Курсовой проект</option>
                  </select>
                  <ChevronDown className="w-3.5 h-3.5 absolute right-3 pointer-events-none text-ink-muted dark:text-stone-400" />
                </div>
              </div>
            </div>

            {/* Фильтры по статусу публикации (DRAFT / ACTIVE / CLOSED) */}
            <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-paper-border/60 dark:border-paper-darkBorder/60">
              <span className="text-[10px] font-mono uppercase tracking-wider text-ink-muted dark:text-stone-400 flex items-center gap-1">
                <Filter className="w-3 h-3" /> Статус:
              </span>
              <button
                type="button"
                onClick={() => setProjectStatusFilter('all')}
                className={`px-2.5 py-1 text-[10px] font-mono uppercase tracking-wider border transition cursor-pointer ${
                  projectStatusFilter === 'all'
                    ? 'border-ink bg-ink text-paper-light dark:border-ink-light dark:bg-ink-light dark:text-paper-dark'
                    : 'border-paper-border dark:border-paper-darkBorder text-ink-muted hover:border-ink hover:text-ink dark:hover:text-stone-200'
                }`}
              >
                Все ({myCompanyProjects.length})
              </button>
              <button
                type="button"
                onClick={() => setProjectStatusFilter('ACTIVE')}
                className={`px-2.5 py-1 text-[10px] font-mono uppercase tracking-wider border transition cursor-pointer ${
                  projectStatusFilter === 'ACTIVE'
                    ? 'border-emerald-600 bg-emerald-600 text-white'
                    : 'border-paper-border dark:border-paper-darkBorder text-ink-muted hover:border-ink hover:text-ink dark:hover:text-stone-200'
                }`}
              >
                ● Активные ({activeProjectsCount})
              </button>
              <button
                type="button"
                onClick={() => setProjectStatusFilter('DRAFT')}
                className={`px-2.5 py-1 text-[10px] font-mono uppercase tracking-wider border transition cursor-pointer ${
                  projectStatusFilter === 'DRAFT'
                    ? 'border-amber-600 bg-amber-600 text-white'
                    : 'border-paper-border dark:border-paper-darkBorder text-ink-muted hover:border-ink hover:text-ink dark:hover:text-stone-200'
                }`}
              >
                ✎ Черновики ({draftProjectsCount})
              </button>
              <button
                type="button"
                onClick={() => setProjectStatusFilter('CLOSED')}
                className={`px-2.5 py-1 text-[10px] font-mono uppercase tracking-wider border transition cursor-pointer ${
                  projectStatusFilter === 'CLOSED'
                    ? 'border-stone-600 bg-stone-600 text-white'
                    : 'border-paper-border dark:border-paper-darkBorder text-ink-muted hover:border-ink hover:text-ink dark:hover:text-stone-200'
                }`}
              >
                ✖ Закрытые ({closedProjectsCount})
              </button>

              {(projectSearchQuery || projectStatusFilter !== 'all' || projectTypeFilter !== 'all') && (
                <button
                  type="button"
                  onClick={() => {
                    setProjectSearchQuery('');
                    setProjectStatusFilter('all');
                    setProjectTypeFilter('all');
                  }}
                  className="ml-auto text-[10px] font-mono uppercase text-oxblood dark:text-oxblood-light hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <X className="w-3 h-3" /> Сбросить фильтры
                </button>
              )}
            </div>
          </div>

          {/* Список проектов компании */}
          {filteredCompanyProjects.length === 0 ? (
            <div className="p-12 text-center border border-paper-border dark:border-paper-darkBorder bg-paper-card dark:bg-paper-darkCard space-y-3">
              <p className="editorial-serif italic text-2xl text-ink-muted dark:text-stone-400">
                {myCompanyProjects.length === 0
                  ? 'У вашей компании пока нет созданных проектов'
                  : 'Проекты по заданным фильтрам не найдены'}
              </p>
              <p className="text-xs font-mono text-ink-muted dark:text-stone-400">
                {myCompanyProjects.length === 0
                  ? 'Опубликуйте первый проект или сохраните его в черновик для начала отбора кандидатов'
                  : 'Попробуйте изменить параметры поиска или фильтрации по статусу'}
              </p>
              <button
                type="button"
                onClick={handleCreateProjectNav}
                className="btn-editorial mt-2 px-5 py-2.5 bg-ink text-paper-light dark:bg-paper-light dark:text-ink text-xs font-mono uppercase tracking-wider transition inline-flex items-center gap-1.5 cursor-pointer border border-ink dark:border-paper-light"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Создать новый проект</span>
              </button>
            </div>
          ) : (
            <div className="space-y-5">
              {filteredCompanyProjects.map((p) => {
                const isExpanded = expandedProjectCandidatesId === p.id;
                const status = p.projectStatus || 'ACTIVE';

                // Считаем топ кандидатов для этого конкретного проекта
                const topCandidatesForThisProject = allStudents
                  .map((student) => ({
                    student,
                    match: calculateStudentProjectMatch(student, p),
                  }))
                  .sort((a, b) => b.match.matchScore - a.match.matchScore)
                  .slice(0, 3);

                // Отклики конкретно на этот проект
                const projectApplications = candidates.filter(
                  (c) => c.project.toLowerCase().trim() === p.title.toLowerCase().trim()
                );

                return (
                  <article
                    key={p.id}
                    className="border border-paper-border dark:border-paper-darkBorder bg-paper-card dark:bg-paper-darkCard p-6 sm:p-7 space-y-4 hover:border-ink/60 dark:hover:border-paper-darkBorder transition-colors"
                  >
                    {/* Верхняя строка: Индекс, формат, статус и переключатель статуса */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-paper-border/60 dark:border-paper-darkBorder/60 pb-3">
                      <div className="flex flex-wrap items-center gap-2.5">
                        <span className="text-xs font-mono font-bold text-oxblood dark:text-oxblood-light">
                          {p.index}
                        </span>
                        <span className="text-xs font-mono px-2 py-0.5 border border-paper-border dark:border-paper-darkBorder bg-paper-light dark:bg-paper-dark text-ink dark:text-ink-light">
                          {p.type}
                        </span>
                        <span className="text-xs font-mono text-ink-muted dark:text-stone-400">
                          {p.department}
                        </span>
                      </div>

                      {/* Статус проекта и элементы управления статусом (DRAFT / ACTIVE / CLOSED) */}
                      <div className="flex items-center gap-2 self-start sm:self-auto">
                        {renderStatusBadge(p.projectStatus)}

                        {onUpdateProjectStatus && (
                          <div className="flex items-center gap-1 border border-paper-border dark:border-paper-darkBorder bg-paper-light dark:bg-paper-dark px-1.5 py-0.5">
                            <span className="text-[10px] font-mono text-ink-muted dark:text-stone-400">
                              Сменить:
                            </span>
                            <select
                              value={status}
                              onChange={(e) =>
                                handleStatusChange(p.id, e.target.value as ProjectStatus)
                              }
                              className="text-[10px] font-mono bg-transparent text-ink dark:text-ink-light focus:outline-none cursor-pointer"
                              title="Изменить статус проекта"
                            >
                              <option value="ACTIVE">ACTIVE (Опубликован)</option>
                              <option value="DRAFT">DRAFT (Черновик)</option>
                              <option value="CLOSED">CLOSED (Набор закрыт)</option>
                              <option value="ARCHIVED">ARCHIVED (В архиве)</option>
                            </select>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Название и описание */}
                    <div className="space-y-2">
                      <h3 className="text-xl sm:text-2xl font-semibold text-ink dark:text-ink-light leading-snug">
                        {p.title}
                      </h3>
                      <p className="text-xs sm:text-sm text-ink-muted dark:text-stone-300 leading-relaxed font-normal">
                        {p.desc}
                      </p>
                    </div>

                    {/* Мета-информация: Команда, локация, навыки */}
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs font-mono text-ink-muted dark:text-stone-400 pt-1">
                      <span className="flex items-center gap-1">
                        <Users className="w-3.5 h-3.5 text-oxblood dark:text-oxblood-light" />
                        <span>{p.teamSize}</span>
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-hunter dark:text-emerald-400" />
                        <span>{p.city || 'Кемерово'} {p.isRemote ? '(Удаленно)' : '(В офисе)'}</span>
                      </span>
                      {projectApplications.length > 0 && (
                        <>
                          <span>•</span>
                          <span className="text-oxblood dark:text-oxblood-light font-medium">
                            {projectApplications.length} откликов
                          </span>
                        </>
                      )}
                    </div>

                    {/* Требуемые навыки */}
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {(p.requiredSkills && p.requiredSkills.length > 0
                        ? p.requiredSkills
                        : p.tags.map((t) => ({ name: t, level: 'INTERMEDIATE' as const }))
                      ).map((sk) => (
                        <SkillBadge
                          key={typeof sk === 'string' ? sk : sk.name}
                          skill={sk}
                          size="sm"
                        />
                      ))}
                    </div>

                    {/* Панель действий карточки проекта */}
                    <div className="pt-3 border-t border-paper-border/60 dark:border-paper-darkBorder/60 flex flex-col md:flex-row md:items-center justify-between gap-3">
                      {/* Левая группа: ИИ-подбор и раскрытие кандидатов */}
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleOpenMatchingForProject(p.id)}
                          className="btn-editorial px-3.5 py-1.5 bg-ink text-paper-light dark:bg-paper-light dark:text-ink text-xs font-mono uppercase tracking-wider transition flex items-center gap-1.5 cursor-pointer border border-ink dark:border-paper-light"
                          title="Открыть детальный подбор кандидатов с ИИ-ранжированием под этот проект"
                        >
                          <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                          <span>Подбор кандидатов (ИИ)</span>
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            setExpandedProjectCandidatesId((prev) => (prev === p.id ? null : p.id))
                          }
                          className="px-3 py-1.5 border border-paper-border dark:border-paper-darkBorder hover:border-ink dark:hover:border-stone-400 text-xs font-mono uppercase tracking-wider text-ink dark:text-ink-light transition flex items-center gap-1.5 cursor-pointer bg-paper-light dark:bg-paper-dark"
                        >
                          <span>Топ кандидатов</span>
                          {isExpanded ? (
                            <ChevronUp className="w-3.5 h-3.5" />
                          ) : (
                            <ChevronDown className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>

                      {/* Правая группа: Редактирование, статус и удаление */}
                      <div className="flex items-center gap-2 self-start md:self-auto">
                        <button
                          type="button"
                          onClick={() => handleEditProjectNav(p)}
                          className="px-3 py-1.5 border border-paper-border dark:border-paper-darkBorder hover:border-ink dark:hover:border-stone-400 text-xs font-mono uppercase tracking-wider text-ink dark:text-ink-light transition flex items-center gap-1.5 cursor-pointer bg-paper-card dark:bg-paper-darkCard"
                        >
                          <Edit className="w-3.5 h-3.5" />
                          <span>Редактировать</span>
                        </button>

                        {onDeleteProject && (
                          <button
                            type="button"
                            onClick={() => {
                              if (window.confirm(`Удалить проект «${p.title}»?`)) {
                                onDeleteProject(p.id);
                              }
                            }}
                            className="px-2.5 py-1.5 border border-oxblood/30 hover:bg-oxblood/10 text-oxblood dark:text-oxblood-light text-xs font-mono uppercase tracking-wider transition flex items-center gap-1 cursor-pointer"
                            title="Удалить проект"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* ========================================================
                        Встроенный блок: Кандидаты для конкретного проекта (Шаг 3)
                        ======================================================== */}
                    {isExpanded && (
                      <div className="mt-4 pt-4 border-t border-dashed border-paper-border dark:border-paper-darkBorder bg-paper-muted/30 dark:bg-paper-dark/60 p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="text-[11px] font-mono uppercase tracking-wider text-oxblood dark:text-oxblood-light font-semibold flex items-center gap-1.5">
                            <Sparkles className="w-3.5 h-3.5 text-brass" />
                            <span>Топ студентов по семантическому соответствию проекту:</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleOpenMatchingForProject(p.id)}
                            className="text-[11px] font-mono text-ink-muted dark:text-stone-300 hover:text-oxblood dark:hover:text-oxblood-light underline cursor-pointer"
                          >
                            Все подходящие студенты →
                          </button>
                        </div>

                        <div className="divide-y divide-paper-border/60 dark:divide-paper-darkBorder/60 bg-paper-card dark:bg-paper-darkCard border border-paper-border dark:border-paper-darkBorder">
                          {topCandidatesForThisProject.map(({ student, match }) => {
                            const studentId = student.id || 1;
                            return (
                              <div
                                key={studentId}
                                className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                              >
                                <div className="space-y-1">
                                  <div className="flex flex-wrap items-center gap-2">
                                    <span className="font-semibold text-sm text-ink dark:text-ink-light">
                                      {student.name}
                                    </span>
                                    <SemanticMatchBadge score={match.matchScore} size="sm" />
                                    <span className="text-[10px] font-mono text-ink-muted dark:text-stone-400">
                                      {student.group} • {formatYearDisplay(student.year)}
                                    </span>
                                  </div>
                                  <div className="text-xs font-mono text-ink-muted dark:text-stone-400">
                                    {student.specialization}
                                  </div>
                                  {match.missingSkills.length > 0 && (
                                    <div className="text-[10px] font-mono text-ink-muted dark:text-stone-400 flex items-center gap-1 pt-0.5">
                                      <span className="text-oxblood dark:text-oxblood-light font-medium">
                                        Для проекта требуется:
                                      </span>
                                      {match.missingSkills.map((sk) => (
                                        <span
                                          key={sk}
                                          className="px-1.5 py-0.2 bg-paper-muted dark:bg-stone-800 border border-paper-border dark:border-stone-700 text-ink dark:text-stone-300"
                                        >
                                          +{sk}
                                        </span>
                                      ))}
                                    </div>
                                  )}
                                </div>

                                <div className="flex items-center gap-2 shrink-0">
                                  <button
                                    type="button"
                                    onClick={() => handleViewStudentNav(studentId)}
                                    className="px-2.5 py-1 text-[10px] font-mono uppercase tracking-wider border border-paper-border dark:border-paper-darkBorder hover:border-ink text-ink dark:text-ink-light transition cursor-pointer"
                                  >
                                    Резюме
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => onContactCandidate(student.name)}
                                    className="px-3 py-1 text-[10px] font-mono uppercase tracking-wider bg-oxblood hover:bg-oxblood-hover text-white transition cursor-pointer"
                                  >
                                    Пригласить
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ========================================================
          ВКЛАДКА 2: Подбор кандидатов (ИИ-ранжирование по проекту)
          (GET /api/organizations/projects/:id/matches)
          ======================================================== */}
      {activeSubTab === 'matching' && (
        <div className="space-y-6">
          {/* Селектор проекта для семантического матчинга */}
          {myCompanyProjects.length === 0 ? (
            <div className="p-5 border-2 border-dashed border-brass/80 bg-brass/10 dark:bg-amber-950/20 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-brass/20 text-brass flex items-center justify-center shrink-0">
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
                onClick={handleCreateProjectNav}
                className="btn-editorial px-4 py-2 bg-ink text-paper-light dark:bg-paper-light dark:text-ink text-xs font-mono uppercase tracking-wider transition flex items-center gap-1.5 shrink-0 cursor-pointer border border-ink dark:border-paper-light"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Создать проект</span>
              </button>
            </div>
          ) : (
            <div className="p-4 bg-paper-card dark:bg-paper-darkCard border border-paper-border dark:border-paper-darkBorder flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-brass shrink-0" />
                <div>
                  <span className="text-xs font-mono uppercase tracking-wider text-ink dark:text-ink-light font-semibold block">
                    Проект для расчета ИИ-совместимости:
                  </span>
                  <span className="text-[10px] font-mono text-ink-muted dark:text-stone-400">
                    Ранжирование базы студентов под требования выбранной задачи
                  </span>
                </div>
              </div>
              <div className="relative w-full sm:w-auto">
                <select
                  value={selectedMatchingProjectId}
                  onChange={(e) =>
                    setSelectedMatchingProjectId(
                      e.target.value === 'all' ? 'all' : Number(e.target.value)
                    )
                  }
                  className="appearance-none pl-3.5 pr-9 py-2.5 text-xs font-mono bg-paper-light dark:bg-paper-dark border border-paper-border dark:border-paper-darkBorder text-ink dark:text-ink-light focus:outline-none focus:border-oxblood cursor-pointer w-full sm:w-auto sm:min-w-[340px]"
                >
                  <option value="all">★ Все проекты (лучшее совпадение)</option>
                  {myCompanyProjects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.index} • {p.title}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-3.5 h-3.5 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-ink-muted dark:text-stone-400" />
              </div>
            </div>
          )}

          {/* Панель поиска и фильтрации студентов */}
          <div className="p-5 border border-paper-border dark:border-paper-darkBorder bg-paper-card dark:bg-paper-darkCard space-y-4">
            <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
              {/* Поисковая строка */}
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-muted dark:text-stone-400" />
                <input
                  type="text"
                  value={studentSearchQuery}
                  onChange={(e) => setStudentSearchQuery(e.target.value)}
                  placeholder="Поиск по ФИО, стеку, специальности или группе..."
                  className="w-full pl-10 pr-4 py-2.5 text-xs font-mono bg-paper-light dark:bg-paper-dark border border-paper-border dark:border-paper-darkBorder focus:outline-none focus:border-oxblood dark:focus:border-oxblood-light text-ink dark:text-ink-light placeholder:text-ink-muted/60"
                />
                {studentSearchQuery && (
                  <button
                    type="button"
                    onClick={() => setStudentSearchQuery('')}
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
                <div className="relative inline-flex items-center">
                  <select
                    value={selectedCourse}
                    onChange={(e) => setSelectedCourse(e.target.value)}
                    className="appearance-none pl-3.5 pr-9 py-2 text-xs font-mono bg-paper-light dark:bg-paper-dark border border-paper-border dark:border-paper-darkBorder focus:outline-none focus:border-oxblood text-ink dark:text-ink-light cursor-pointer"
                  >
                    <option value="all">Все курсы</option>
                    <option value="IV Курс">IV Курс (ВКР)</option>
                    <option value="III Курс">III Курс (Практика)</option>
                  </select>
                  <ChevronDown className="w-3.5 h-3.5 absolute right-3 pointer-events-none text-ink-muted dark:text-stone-400" />
                </div>
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

              {hasActiveStudentFilters && (
                <button
                  type="button"
                  onClick={handleResetStudentFilters}
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
              {hasActiveStudentFilters && (
                <button
                  type="button"
                  onClick={handleResetStudentFilters}
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

                // Семантический матч кандидата с привязкой к конкретному проекту или лучшему из всех
                const matchResult =
                  selectedMatchingProjectId !== 'all'
                    ? (() => {
                        const proj = myCompanyProjects.find(
                          (p) => p.id === selectedMatchingProjectId
                        );
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
                        <button
                          type="button"
                          onClick={() => handleViewStudentNav(studentId)}
                          className="w-14 h-14 border-2 border-ink dark:border-stone-400 bg-paper-muted dark:bg-paper-dark flex items-center justify-center text-ink dark:text-ink-light shrink-0 font-serif font-bold text-lg hover:border-oxblood dark:hover:border-oxblood-light transition cursor-pointer group overflow-hidden"
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

                        <div className="space-y-1.5">
                          <div className="flex flex-wrap items-center gap-3">
                            <span className="editorial-serif text-2xl font-semibold text-ink dark:text-ink-light">
                              <button
                                type="button"
                                onClick={() => handleViewStudentNav(studentId)}
                                className="hover:text-oxblood dark:hover:text-oxblood-light hover:underline cursor-pointer transition-colors text-left"
                              >
                                {student.name}
                              </button>
                            </span>

                            {myCompanyProjects.length === 0 ? (
                              <span className="px-3 py-1 text-[11px] font-mono text-ink-muted bg-paper-muted/50 dark:bg-stone-800 border border-paper-border dark:border-stone-700">
                                Опубликуйте проект для расчета совместимости
                              </span>
                            ) : matchResult ? (
                              <SemanticMatchBadge score={matchResult.matchScore} size="sm" />
                            ) : (
                              <span className="px-3 py-1 text-[11px] font-mono text-ink-muted bg-paper-muted/50 dark:bg-stone-800 border border-paper-border dark:border-stone-700">
                                Опубликуйте проект для расчета совместимости
                              </span>
                            )}

                            <span className="px-2.5 py-0.5 text-[10px] font-mono uppercase tracking-widest bg-hunter text-paper-light">
                              {student.status}
                            </span>
                          </div>

                          {myCompanyProjects.length > 0 && matchResult && (
                            <div className="text-xs font-mono text-hunter dark:text-emerald-400 flex items-center gap-1.5 pt-0.5">
                              <Sparkles className="w-3.5 h-3.5 text-brass shrink-0" />
                              {selectedMatchingProjectId === 'all' ? (
                                <span className="font-medium text-ink dark:text-stone-300">
                                  Лучшее совпадение по проекту:{' '}
                                  <strong className="text-oxblood dark:text-oxblood-light font-bold">
                                    «{matchResult.projectTitle}»
                                  </strong>
                                </span>
                              ) : (
                                <span className="font-medium text-ink dark:text-stone-300">
                                  Совпадение с проектом:{' '}
                                  <strong className="text-oxblood dark:text-oxblood-light font-bold">
                                    «{matchResult.projectTitle}»
                                  </strong>
                                </span>
                              )}
                            </div>
                          )}

                          {matchResult && matchResult.missingSkills.length > 0 && (
                            <div className="text-[10px] font-mono text-ink-muted dark:text-stone-400 flex items-center gap-1.5 flex-wrap pt-0.5">
                              <span className="text-oxblood dark:text-oxblood-light font-medium">
                                Для проекта требуется:
                              </span>
                              {matchResult.missingSkills.map((sk) => (
                                <span
                                  key={sk}
                                  className="px-1.5 py-0.2 bg-paper-muted dark:bg-stone-800 border border-paper-border dark:border-stone-700 text-ink dark:text-stone-300"
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
                        <button
                          type="button"
                          onClick={() => handleViewStudentNav(studentId)}
                          className="btn-editorial px-4 py-2 text-xs font-mono uppercase tracking-wider border border-paper-border dark:border-paper-darkBorder hover:border-ink dark:hover:border-stone-400 text-ink dark:text-ink-light transition flex items-center gap-1.5 cursor-pointer bg-paper-card dark:bg-paper-darkCard"
                        >
                          <span>Резюме</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onContactCandidate(student.name)}
                          className="btn-editorial px-4 py-2 text-xs font-mono uppercase tracking-wider bg-ink text-paper-light dark:bg-paper-light dark:text-ink transition flex items-center gap-1.5 cursor-pointer border border-ink dark:border-paper-light"
                        >
                          <Send className="w-3.5 h-3.5" />
                          <span>Пригласить</span>
                        </button>
                      </div>
                    </div>

                    {student.bio && (
                      <p className="text-xs sm:text-sm text-ink-muted dark:text-stone-300 leading-relaxed font-normal line-clamp-2">
                        {student.bio}
                      </p>
                    )}

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
          ВКЛАДКА 3: Заявки и отклики студентов
          ======================================================== */}
      {activeSubTab === 'applications' && (
        <div className="border border-paper-border dark:border-paper-darkBorder bg-paper-card dark:bg-paper-darkCard transition-colors duration-300">
          <div className="p-6 border-b border-paper-border dark:border-paper-darkBorder flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="text-2xl font-normal text-ink dark:text-ink-light">
                Список откликов на проекты компании
              </h3>
              <p className="text-xs text-ink-muted dark:text-stone-400 font-mono mt-0.5">
                Студенты и команды, подавшие заявку на решение задач компании {companyName}
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
                  Перейдите во вкладку «Подбор кандидатов (ИИ)» для поиска и приглашения студентов
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
                      {c.studentId ? (
                        <button
                          type="button"
                          onClick={() => handleViewStudentNav(c.studentId!)}
                          className="w-12 h-12 border-2 border-ink dark:border-stone-400 bg-paper-muted dark:bg-paper-dark flex items-center justify-center text-ink dark:text-ink-light shrink-0 font-serif font-bold text-base hover:border-oxblood dark:hover:border-oxblood-light transition cursor-pointer group overflow-hidden"
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

                      <div className="space-y-2">
                        <div className="flex flex-wrap items-center gap-3">
                          <span className="editorial-serif text-2xl font-semibold text-ink dark:text-ink-light">
                            {c.studentId ? (
                              <button
                                type="button"
                                onClick={() => handleViewStudentNav(c.studentId!)}
                                className="hover:text-oxblood dark:hover:text-oxblood-light hover:underline cursor-pointer transition-colors text-left"
                              >
                                {c.name}
                              </button>
                            ) : (
                              c.name
                            )}
                          </span>

                          {c.isTeam && (
                            <span className="px-2.5 py-0.5 text-[10px] font-mono uppercase tracking-widest bg-oxblood text-white flex items-center gap-1">
                              <Users className="w-3 h-3" /> Командная заявка
                            </span>
                          )}

                          <SemanticMatchBadge score={c.match} size="sm" />

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

                        {c.teamMembers && c.teamMembers.length > 1 && (
                          <div className="text-xs font-mono text-ink-muted dark:text-stone-400 flex items-center gap-1.5 pt-0.5">
                            <span className="text-oxblood dark:text-oxblood-light font-medium">
                              Состав команды:
                            </span>
                            <span>
                              {c.teamMembers
                                .map((m) => `${m.studentName} (${m.role === 'LEAD' ? 'PM' : 'Dev'})`)
                                .join(', ')}
                            </span>
                          </div>
                        )}

                        {c.coverLetter && (
                          <p className="text-xs font-mono italic text-ink-muted dark:text-stone-400 bg-paper-light dark:bg-paper-dark p-2.5 border border-paper-border dark:border-paper-darkBorder line-clamp-2">
                            «{c.coverLetter}»
                          </p>
                        )}

                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {c.stack.map((s) => (
                            <SkillBadge
                              key={typeof s === 'string' ? s : s.name}
                              skill={s}
                              size="sm"
                            />
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5 shrink-0 self-start md:self-auto">
                      <button
                        type="button"
                        onClick={() => {
                          const resolvedChatId = c.applicationId
                            ? (c.applicationId.startsWith('chat-') ? c.applicationId : `chat-${c.applicationId}`)
                            : `chat-${c.id}`;
                          handleOpenChatNav(resolvedChatId);
                        }}
                        className="px-3.5 py-2 border border-paper-border dark:border-paper-darkBorder hover:border-oxblood dark:hover:border-oxblood-light text-oxblood dark:text-oxblood-light text-xs font-mono uppercase tracking-wider transition flex items-center gap-1.5 cursor-pointer bg-paper-light dark:bg-paper-dark"
                        title="Открыть чат по отклику"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>Чат</span>
                      </button>

                      <button
                        type="button"
                        disabled={isAccepted}
                        onClick={() => onApproveCandidate(c.id)}
                        className={`px-4 py-2 text-xs font-mono uppercase tracking-widest transition cursor-pointer ${
                          isAccepted
                            ? 'bg-paper-muted text-ink-muted dark:bg-paper-dark dark:text-stone-500 cursor-not-allowed'
                            : 'bg-oxblood hover:bg-oxblood-hover text-paper-light'
                        }`}
                      >
                        {isAccepted ? 'Приглашен' : 'Пригласить в проект'}
                      </button>

                      <button
                        type="button"
                        onClick={() => onContactCandidate(c.name)}
                        className="px-3.5 py-2 border border-paper-border dark:border-paper-darkBorder text-xs font-mono uppercase tracking-widest hover:border-ink dark:hover:border-stone-400 text-ink dark:text-ink-light transition cursor-pointer"
                      >
                        Написать
                      </button>
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
