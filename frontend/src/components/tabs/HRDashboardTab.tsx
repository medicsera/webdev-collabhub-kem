import React, { useState, useMemo, useRef, useEffect } from 'react';
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
  Check,
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
import { useSemanticMatches } from '../../hooks/useSemanticMatches';

interface HRDashboardTabProps {
  candidates: Candidate[];
  allStudents?: StudentProfile[];
  projects: Project[];
  companyName?: string;
  initialSubTab?: 'projects' | 'matching' | 'applications';
  onApproveCandidate: (candidateId: string) => void;
  onContactCandidate: (candidateName: string) => void;
  onViewStudent?: (studentId: number) => void;
  onOpenChat?: (chatId: string) => void;
  onOpenCreateModal?: () => void;
  onEditProject?: (project: Project) => void;
  onDeleteProject?: (projectId: number) => void;
  onUpdateProjectStatus?: (projectId: number, newStatus: ProjectStatus) => void;
}

const PROJECT_STATUS_ITEMS: { status: ProjectStatus; label: string; dotClass: string }[] = [
  { status: 'ACTIVE', label: 'Опубликован', dotClass: 'bg-emerald-500' },
  { status: 'DRAFT', label: 'Черновик', dotClass: 'bg-amber-500' },
  { status: 'CLOSED', label: 'Закрыт', dotClass: 'bg-stone-500' },
  { status: 'ARCHIVED', label: 'В архиве', dotClass: 'bg-stone-400' },
];

interface ProjectStatusDropdownProps {
  currentStatus: ProjectStatus;
  projectId: number;
  onUpdateStatus?: (projectId: number, newStatus: ProjectStatus) => void;
}

const ProjectStatusDropdown: React.FC<ProjectStatusDropdownProps> = ({
  currentStatus,
  projectId,
  onUpdateStatus,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const currentItem =
    PROJECT_STATUS_ITEMS.find((s) => s.status === currentStatus) || PROJECT_STATUS_ITEMS[0];

  const getBadgeStyle = (status: ProjectStatus) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 border-emerald-500/30 hover:border-emerald-500/60 dark:hover:border-emerald-400/50';
      case 'DRAFT':
        return 'bg-amber-500/10 text-amber-800 dark:text-amber-300 border-amber-500/30 hover:border-amber-500/60 dark:hover:border-amber-400/50';
      case 'CLOSED':
        return 'bg-stone-500/10 text-stone-700 dark:text-stone-300 border-stone-500/30 hover:border-stone-500/60 dark:hover:border-stone-400/50';
      case 'ARCHIVED':
        return 'bg-stone-400/10 text-stone-600 dark:text-stone-400 border-stone-400/30 hover:border-stone-400/60';
      default:
        return 'bg-stone-500/10 text-stone-700 dark:text-stone-300 border-stone-500/30';
    }
  };

  const isInteractive = Boolean(onUpdateStatus);

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <button
        type="button"
        disabled={!isInteractive}
        onClick={() => isInteractive && setIsOpen(!isOpen)}
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-mono uppercase tracking-wider border rounded-xs transition-all ${
          isInteractive
            ? 'cursor-pointer select-none hover:shadow-xs active:scale-[0.98]'
            : 'cursor-default'
        } ${getBadgeStyle(currentStatus)}`}
        title={isInteractive ? 'Нажмите, чтобы сменить статус проекта' : undefined}
      >
        <span className={`w-2 h-2 rounded-full ${currentItem.dotClass} shrink-0`} />
        <span className="font-semibold">{currentItem.label}</span>
        {isInteractive && (
          <ChevronDown
            className={`w-3 h-3 transition-transform duration-200 opacity-70 ${
              isOpen ? 'rotate-180' : ''
            }`}
          />
        )}
      </button>

      {isOpen && isInteractive && (
        <div className="absolute right-0 top-full mt-1.5 w-44 z-30 bg-paper-card dark:bg-paper-darkCard border border-stone-300 dark:border-stone-700 shadow-lg py-1 fade-in">
          <div className="px-3 py-1 text-[10px] font-mono uppercase tracking-wider text-stone-600 dark:text-stone-400 border-b border-stone-200 dark:border-stone-800 font-medium">
            Статус проекта:
          </div>
          {PROJECT_STATUS_ITEMS.map((item) => {
            const isSelected = item.status === currentStatus;
            return (
              <button
                key={item.status}
                type="button"
                onClick={() => {
                  if (onUpdateStatus) {
                    onUpdateStatus(projectId, item.status);
                  }
                  setIsOpen(false);
                }}
                className={`w-full text-left px-3 py-1.5 text-xs font-mono flex items-center justify-between transition-colors cursor-pointer ${
                  isSelected
                    ? 'bg-paper-muted/80 dark:bg-stone-800/80 font-semibold text-stone-900 dark:text-stone-100'
                    : 'text-stone-700 dark:text-stone-300 hover:bg-paper-muted/50 dark:hover:bg-stone-800/50'
                }`}
              >
                <span className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${item.dotClass} shrink-0`} />
                  <span>{item.label}</span>
                </span>
                {isSelected && (
                  <Check className="w-3.5 h-3.5 text-oxblood dark:text-oxblood-light shrink-0" />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export const HRDashboardTab: React.FC<HRDashboardTabProps> = ({
  candidates,
  allStudents = MOCK_STUDENTS,
  projects,
  companyName = 'Софт Инжиниринг',
  initialSubTab = 'projects',
  onApproveCandidate,
  onContactCandidate,
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

  // ИИ-счёт через эмбеддинги ai-service (батч «студенты × проекты»)
  const { getScore, bestScore, status: semanticStatus } = useSemanticMatches(
    allStudents,
    myCompanyProjects
  );

  // Отклики: для каждого кандидата — навыки из stack, проект по названию c.project
  const candidateMatchScores = useMemo(() => {
    const map = new Map<string, { score: number; ai: boolean }>();
    for (const c of candidates) {
      const project = myCompanyProjects.find(
        (p) => p.title.toLowerCase().trim() === c.project.toLowerCase().trim()
      );
      const studentLike: StudentProfile = {
        id: c.studentId ?? (Number(c.id.replace(/\D/g, '')) || 0),
        name: c.name,
        group: c.group,
        year: '4',
        university: 'КемГУ',
        specialization: '',
        telegram: '',
        city: 'Кемерово',
        status: c.status,
        skills: (c.stack || []).map((s) =>
          typeof s === 'string'
            ? { name: s, level: 'INTERMEDIATE' as const }
            : { name: s.name, level: s.level || 'INTERMEDIATE' }
        ),
        bio: '',
        aiMatch: c.match,
        aiFeedback: '',
      };

      let ai: number | undefined;
      if (project) {
        ai = getScore(studentLike, project);
      }
      map.set(c.id, { score: ai ?? c.match, ai: ai !== undefined });
    }
    return map;
  }, [candidates, myCompanyProjects, getScore]);

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

  return (
    <section id="tab-hr-dashboard" className="space-y-8">
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
        {/* Всего проектов */}
        <div className="border border-stone-300/80 dark:border-stone-700/80 bg-paper-card dark:bg-paper-darkCard p-6 sm:p-7 flex flex-col justify-between transition-colors shadow-xs">
          <div className="text-[11px] font-mono uppercase tracking-wider text-stone-600 dark:text-stone-400 font-medium">
            Всего проектов
          </div>
          <div
            className={`editorial-serif text-3xl sm:text-4xl font-bold mt-2 ${
              myCompanyProjects.length === 0
                ? 'text-stone-400 dark:text-stone-600'
                : 'text-stone-900 dark:text-stone-100'
            }`}
          >
            {String(myCompanyProjects.length).padStart(2, '0')}
          </div>
          <div className="text-xs font-mono text-stone-600 dark:text-stone-400 mt-2 font-medium flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-stone-400 dark:bg-stone-500" />
            <span>В реестре компании</span>
          </div>
        </div>

        {/* Активных */}
        <div className="border border-stone-300/80 dark:border-stone-700/80 bg-paper-card dark:bg-paper-darkCard p-6 sm:p-7 flex flex-col justify-between transition-colors shadow-xs">
          <div className="text-[11px] font-mono uppercase tracking-wider text-stone-600 dark:text-stone-400 font-medium">
            Активных
          </div>
          <div
            className={`editorial-serif text-3xl sm:text-4xl font-bold mt-2 ${
              activeProjectsCount === 0
                ? 'text-stone-400 dark:text-stone-600'
                : 'text-stone-900 dark:text-stone-100'
            }`}
          >
            {String(activeProjectsCount).padStart(2, '0')}
          </div>
          <div className="text-xs font-mono text-stone-600 dark:text-stone-400 mt-2 font-medium flex items-center gap-1.5">
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                activeProjectsCount > 0 ? 'bg-emerald-500' : 'bg-stone-400'
              }`}
            />
            <span>Открыты для заявок</span>
          </div>
        </div>

        {/* В черновиках */}
        <div className="border border-stone-300/80 dark:border-stone-700/80 bg-paper-card dark:bg-paper-darkCard p-6 sm:p-7 flex flex-col justify-between transition-colors shadow-xs">
          <div className="text-[11px] font-mono uppercase tracking-wider text-stone-600 dark:text-stone-400 font-medium">
            В черновиках
          </div>
          <div
            className={`editorial-serif text-3xl sm:text-4xl font-bold mt-2 ${
              draftProjectsCount === 0
                ? 'text-stone-400 dark:text-stone-600'
                : 'text-stone-900 dark:text-stone-100'
            }`}
          >
            {String(draftProjectsCount).padStart(2, '0')}
          </div>
          <div className="text-xs font-mono text-stone-600 dark:text-stone-400 mt-2 font-medium">
            {closedProjectsCount > 0 ? `+ ${closedProjectsCount} закрытых` : 'Скрыты из каталога'}
          </div>
        </div>

        {/* Откликов студентов (выделяется терракотовым акцентом при > 0) */}
        <div
          className={`border bg-paper-card dark:bg-paper-darkCard p-6 sm:p-7 flex flex-col justify-between transition-colors shadow-xs relative ${
            candidates.length > 0
              ? 'border-stone-300/80 dark:border-stone-700/80 border-t-2 border-t-oxblood dark:border-t-oxblood-light'
              : 'border-stone-300/80 dark:border-stone-700/80'
          }`}
        >
          <div className="flex items-center justify-between gap-1">
            <span className="text-[11px] font-mono uppercase tracking-wider text-stone-600 dark:text-stone-400 font-medium">
              Откликов студентов
            </span>
            {candidates.length > 0 && (
              <span
                className="w-2 h-2 rounded-full bg-oxblood dark:bg-oxblood-light animate-pulse"
                title="Есть отклики, требующие внимания"
              />
            )}
          </div>
          <div
            className={`editorial-serif text-3xl sm:text-4xl font-bold mt-2 ${
              candidates.length === 0
                ? 'text-stone-400 dark:text-stone-600'
                : 'text-oxblood dark:text-oxblood-light font-extrabold'
            }`}
          >
            {String(candidates.length).padStart(2, '0')}
          </div>
          <div
            className={`text-xs font-mono mt-2 font-medium ${
              candidates.length > 0
                ? 'text-oxblood dark:text-oxblood-light'
                : 'text-stone-600 dark:text-stone-400'
            }`}
          >
            {candidates.length > 0 ? '● Требуют рассмотрения' : 'Заявок пока нет'}
          </div>
        </div>
      </div>

      {/* ========================================================
          Навигационные вкладки панели компании
          (Вкладка по умолчанию — «Мои проекты»)
          ======================================================== */}
      <div className="flex border-b border-stone-300/80 dark:border-stone-700/80 gap-2 sm:gap-6 text-xs uppercase font-mono tracking-wider overflow-x-auto">
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
          <div className="p-5 sm:p-6 border border-stone-300/80 dark:border-stone-700/80 bg-paper-card dark:bg-paper-darkCard space-y-4 shadow-xs">
            <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
              {/* Поиск по проектам */}
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-500 dark:text-stone-400 pointer-events-none" />
                <input
                  type="text"
                  value={projectSearchQuery}
                  onChange={(e) => setProjectSearchQuery(e.target.value)}
                  placeholder="Поиск по названию задачи, технологиям, отделу..."
                  className="h-11 w-full pl-10 pr-9 text-xs font-mono bg-paper-light dark:bg-paper-dark border border-stone-300/80 dark:border-stone-700/80 text-stone-900 dark:text-stone-100 placeholder:text-stone-400 dark:placeholder:text-stone-500 focus:outline-none focus-visible:ring-1 focus-visible:ring-oxblood focus-visible:border-oxblood dark:focus-visible:ring-oxblood-light dark:focus-visible:border-oxblood-light transition-colors"
                />
                {projectSearchQuery && (
                  <button
                    type="button"
                    onClick={() => setProjectSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 dark:text-stone-500 dark:hover:text-stone-200 transition-colors cursor-pointer"
                    title="Очистить поиск"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Единый контрол формата: Формат: Все форматы ▾ */}
              <div className="relative inline-flex items-center shrink-0 h-11 border border-stone-300/80 dark:border-stone-700/80 bg-paper-light dark:bg-paper-dark transition-colors focus-within:ring-1 focus-within:ring-oxblood focus-within:border-oxblood dark:focus-within:ring-oxblood-light dark:focus-within:border-oxblood-light">
                <select
                  value={projectTypeFilter}
                  onChange={(e) => setProjectTypeFilter(e.target.value)}
                  className="h-full appearance-none pl-3.5 pr-9 text-xs font-mono bg-transparent text-stone-800 dark:text-stone-200 focus:outline-none cursor-pointer"
                >
                  <option value="all">Формат: Все форматы</option>
                  <option value="ВКР / Диплом">Формат: ВКР / Диплом</option>
                  <option value="Стажировка">Формат: Стажировка</option>
                  <option value="Курсовой проект">Формат: Курсовой проект</option>
                </select>
                <ChevronDown className="w-3.5 h-3.5 absolute right-3 pointer-events-none text-stone-500 dark:text-stone-400" />
              </div>
            </div>

            {/* Фильтры по статусу публикации */}
            <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-stone-300/80 dark:border-stone-700/80">
              <span className="text-[11px] font-mono uppercase tracking-wider text-stone-600 dark:text-stone-400 flex items-center gap-1 font-medium">
                <Filter className="w-3 h-3" /> Статус:
              </span>
              <button
                type="button"
                onClick={() => setProjectStatusFilter('all')}
                className={`px-3 py-1.5 text-[11px] font-mono uppercase tracking-wider border transition cursor-pointer font-medium ${
                  projectStatusFilter === 'all'
                    ? 'border-ink bg-ink text-paper-light dark:border-ink-light dark:bg-ink-light dark:text-paper-dark'
                    : 'border-stone-300/80 dark:border-stone-700/80 text-stone-600 dark:text-stone-400 hover:border-ink hover:text-ink dark:hover:text-stone-200'
                }`}
              >
                Все ({myCompanyProjects.length})
              </button>
              <button
                type="button"
                onClick={() => setProjectStatusFilter('ACTIVE')}
                className={`px-3 py-1.5 text-[11px] font-mono uppercase tracking-wider border transition cursor-pointer font-medium ${
                  projectStatusFilter === 'ACTIVE'
                    ? 'border-emerald-600 bg-emerald-600 text-white'
                    : 'border-stone-300/80 dark:border-stone-700/80 text-stone-600 dark:text-stone-400 hover:border-emerald-600 hover:text-emerald-700 dark:hover:text-emerald-400'
                }`}
              >
                ● Активные ({activeProjectsCount})
              </button>
              <button
                type="button"
                onClick={() => setProjectStatusFilter('DRAFT')}
                className={`px-3 py-1.5 text-[11px] font-mono uppercase tracking-wider border transition cursor-pointer font-medium ${
                  projectStatusFilter === 'DRAFT'
                    ? 'border-amber-600 bg-amber-600 text-white'
                    : 'border-stone-300/80 dark:border-stone-700/80 text-stone-600 dark:text-stone-400 hover:border-amber-600 hover:text-amber-700 dark:hover:text-amber-400'
                }`}
              >
                ✎ Черновики ({draftProjectsCount})
              </button>
              <button
                type="button"
                onClick={() => setProjectStatusFilter('CLOSED')}
                className={`px-3 py-1.5 text-[11px] font-mono uppercase tracking-wider border transition cursor-pointer font-medium ${
                  projectStatusFilter === 'CLOSED'
                    ? 'border-stone-600 bg-stone-600 text-white'
                    : 'border-stone-300/80 dark:border-stone-700/80 text-stone-600 dark:text-stone-400 hover:border-stone-600 hover:text-stone-800 dark:hover:text-stone-200'
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
                  className="ml-auto text-[11px] font-mono uppercase text-oxblood dark:text-oxblood-light hover:underline flex items-center gap-1 cursor-pointer font-medium"
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

                const skillsList =
                  p.requiredSkills && p.requiredSkills.length > 0
                    ? p.requiredSkills.map((s) => (typeof s === 'string' ? s : s.name))
                    : p.tags;

                // Считаем топ кандидатов для этого конкретного проекта
                // (приоритет — счёт из эмбеддингов ai-service, иначе локальная эвристика)
                const topCandidatesForThisProject = allStudents
                  .map((student) => {
                    const localMatch = calculateStudentProjectMatch(student, p);
                    const aiScore = getScore(student, p);
                    return {
                      student,
                      match: {
                        ...localMatch,
                        matchScore: aiScore ?? localMatch.matchScore,
                      },
                      aiPowered: aiScore !== undefined,
                    };
                  })
                  .sort((a, b) => b.match.matchScore - a.match.matchScore)
                  .slice(0, 3);

                // Отклики конкретно на этот проект
                const projectApplications = candidates.filter(
                  (c) => c.project.toLowerCase().trim() === p.title.toLowerCase().trim()
                );

                return (
                  <article
                    key={p.id}
                    className="border border-stone-300/80 dark:border-stone-700/80 bg-paper-card dark:bg-paper-darkCard p-6 sm:p-7 lg:p-8 space-y-5 hover:border-stone-400 dark:hover:border-stone-600 transition-colors shadow-xs"
                  >
                    {/* Верхняя строка: Индекс, формат, статус и единый выпадающий бейдж статуса */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-300/80 dark:border-stone-700/80 pb-3.5">
                      <div className="flex flex-wrap items-center gap-2.5">
                        <span className="text-xs font-mono font-bold text-oxblood dark:text-oxblood-light">
                          {p.index}
                        </span>
                        <span className="text-xs font-mono px-2.5 py-0.5 border border-stone-300/80 dark:border-stone-700/80 bg-paper-light dark:bg-paper-dark text-stone-800 dark:text-stone-200">
                          {p.type}
                        </span>
                        <span className="text-xs font-mono text-stone-600 dark:text-stone-400 font-medium">
                          {p.department}
                        </span>
                      </div>

                      {/* Единый интерактивный статус-бейдж со сменой статуса */}
                      <div className="flex items-center gap-2 self-start sm:self-auto">
                        <ProjectStatusDropdown
                          currentStatus={status}
                          projectId={p.id}
                          onUpdateStatus={onUpdateProjectStatus}
                        />
                      </div>
                    </div>

                    {/* Название, описание и стек технологий */}
                    <div className="space-y-3">
                      <h3 className="text-xl sm:text-2xl font-semibold text-ink dark:text-ink-light leading-snug">
                        {p.title}
                      </h3>
                      <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-300 leading-relaxed font-normal max-w-3xl">
                        {p.desc}
                      </p>

                      {/* Аккуратные моноширинные чипы стека технологий */}
                      {skillsList && skillsList.length > 0 && (
                        <div className="flex flex-wrap items-center gap-1.5 pt-1">
                          {skillsList.map((skillName) => (
                            <span
                              key={skillName}
                              className="px-2.5 py-0.5 text-[11px] font-mono border border-stone-300/80 dark:border-stone-700/80 bg-paper-light dark:bg-paper-dark text-stone-700 dark:text-stone-300 rounded-xs"
                            >
                              {skillName}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Мета-информация: Команда, локация, отклики */}
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs font-mono text-stone-600 dark:text-stone-400 pt-0.5 font-medium">
                      <span className="flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5 text-oxblood dark:text-oxblood-light shrink-0" />
                        <span>{p.teamSize}</span>
                      </span>
                      <span className="text-stone-400 dark:text-stone-600">•</span>
                      <span className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-hunter dark:text-emerald-400 shrink-0" />
                        <span>{p.city || 'Кемерово'} {p.isRemote ? '(Удаленно)' : '(В офисе)'}</span>
                      </span>
                      {projectApplications.length > 0 && (
                        <>
                          <span className="text-stone-400 dark:text-stone-600">•</span>
                          <span className="text-oxblood dark:text-oxblood-light font-semibold">
                            {projectApplications.length} откликов
                          </span>
                        </>
                      )}
                    </div>

                    {/* Панель действий карточки проекта */}
                    <div className="pt-3.5 border-t border-stone-300/80 dark:border-stone-700/80 flex flex-col md:flex-row md:items-center justify-between gap-3">
                      {/* Левая группа: ИИ-подбор и раскрытие кандидатов */}
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleOpenMatchingForProject(p.id)}
                          className="btn-editorial px-3.5 py-2 bg-ink text-paper-light dark:bg-paper-light dark:text-ink text-xs font-mono uppercase tracking-wider transition flex items-center gap-1.5 cursor-pointer border border-ink dark:border-paper-light"
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
                          className="px-3.5 py-2 border border-stone-300/80 dark:border-stone-700/80 hover:border-ink dark:hover:border-stone-400 text-xs font-mono uppercase tracking-wider text-ink dark:text-ink-light transition flex items-center gap-1.5 cursor-pointer bg-paper-light dark:bg-paper-dark"
                        >
                          <span>Топ кандидатов</span>
                          {isExpanded ? (
                            <ChevronUp className="w-3.5 h-3.5" />
                          ) : (
                            <ChevronDown className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>

                      {/* Правая группа: Редактирование и удаление */}
                      <div className="flex items-center gap-2 self-start md:self-auto">
                        <button
                          type="button"
                          onClick={() => handleEditProjectNav(p)}
                          className="px-3.5 py-2 border border-stone-300/80 dark:border-stone-700/80 hover:border-ink dark:hover:border-stone-400 text-xs font-mono uppercase tracking-wider text-ink dark:text-ink-light transition flex items-center gap-1.5 cursor-pointer bg-paper-card dark:bg-paper-darkCard"
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
                            className="px-2.5 py-2 border border-oxblood/40 hover:bg-oxblood/10 text-oxblood dark:text-oxblood-light text-xs font-mono uppercase tracking-wider transition flex items-center gap-1 cursor-pointer"
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
                      <div className="mt-4 pt-4 border-t border-dashed border-stone-300/80 dark:border-stone-700/80 bg-paper-muted/30 dark:bg-paper-dark/60 p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="text-[11px] font-mono uppercase tracking-wider text-oxblood dark:text-oxblood-light font-semibold flex items-center gap-1.5">
                            <Sparkles className="w-3.5 h-3.5 text-brass" />
                            <span>Топ студентов по семантическому соответствию проекту:</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleOpenMatchingForProject(p.id)}
                            className="text-[11px] font-mono text-stone-600 dark:text-stone-300 hover:text-oxblood dark:hover:text-oxblood-light underline cursor-pointer"
                          >
                            Все подходящие студенты →
                          </button>
                        </div>

                        <div className="divide-y divide-stone-200/80 dark:divide-stone-800/80 bg-paper-card dark:bg-paper-darkCard border border-stone-300/80 dark:border-stone-700/80">
                          {topCandidatesForThisProject.map(({ student, match, aiPowered }) => {
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
                                    <SemanticMatchBadge
                                      score={match.matchScore}
                                      size="sm"
                                      aiPowered={aiPowered}
                                      pending={semanticStatus === 'loading'}
                                    />
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
            <div className="p-6 border-2 border-dashed border-brass/80 bg-brass/10 dark:bg-amber-950/20 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-brass/20 text-brass flex items-center justify-center shrink-0">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-semibold text-sm text-ink dark:text-ink-light">
                    Нет активных проектов для расчета семантического соответствия
                  </h4>
                  <p className="text-xs text-stone-600 dark:text-stone-400 mt-0.5">
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
            <div className="p-5 sm:p-6 bg-paper-card dark:bg-paper-darkCard border border-stone-300/80 dark:border-stone-700/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
              <div className="flex items-center gap-2.5">
                <Sparkles className="w-4 h-4 text-brass shrink-0" />
                <div>
                  <span className="text-xs font-mono uppercase tracking-wider text-ink dark:text-ink-light font-semibold block">
                    Проект для расчета ИИ-совместимости:
                  </span>
                  <span className="text-[11px] font-mono text-stone-600 dark:text-stone-400 font-medium">
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
                  className="appearance-none h-11 pl-3.5 pr-9 text-xs font-mono bg-paper-light dark:bg-paper-dark border border-stone-300/80 dark:border-stone-700/80 text-stone-900 dark:text-stone-100 focus:outline-none focus-visible:ring-1 focus-visible:ring-oxblood focus-visible:border-oxblood dark:focus-visible:ring-oxblood-light dark:focus-visible:border-oxblood-light cursor-pointer w-full sm:w-auto sm:min-w-[340px] transition-colors"
                >
                  <option value="all">★ Все проекты (лучшее совпадение)</option>
                  {myCompanyProjects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.index} • {p.title}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-3.5 h-3.5 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-stone-500 dark:text-stone-400" />
              </div>
            </div>
          )}

          {/* Панель поиска и фильтрации студентов */}
          <div className="p-5 sm:p-6 border border-stone-300/80 dark:border-stone-700/80 bg-paper-card dark:bg-paper-darkCard space-y-4 shadow-xs">
            <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
              {/* Поисковая строка */}
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-500 dark:text-stone-400 pointer-events-none" />
                <input
                  type="text"
                  value={studentSearchQuery}
                  onChange={(e) => setStudentSearchQuery(e.target.value)}
                  placeholder="Поиск по ФИО, стеку, специальности или группе..."
                  className="h-11 w-full pl-10 pr-9 text-xs font-mono bg-paper-light dark:bg-paper-dark border border-stone-300/80 dark:border-stone-700/80 focus:outline-none focus-visible:ring-1 focus-visible:ring-oxblood focus-visible:border-oxblood dark:focus-visible:ring-oxblood-light dark:focus-visible:border-oxblood-light text-stone-900 dark:text-stone-100 placeholder:text-stone-400 dark:placeholder:text-stone-500 transition-colors"
                />
                {studentSearchQuery && (
                  <button
                    type="button"
                    onClick={() => setStudentSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 dark:text-stone-500 dark:hover:text-stone-200 transition-colors cursor-pointer"
                    title="Очистить поиск"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Фильтр по курсу — единый контрол высотой h-11 */}
              <div className="relative inline-flex items-center shrink-0 h-11 border border-stone-300/80 dark:border-stone-700/80 bg-paper-light dark:bg-paper-dark transition-colors focus-within:ring-1 focus-within:ring-oxblood focus-within:border-oxblood dark:focus-within:ring-oxblood-light dark:focus-within:border-oxblood-light">
                <select
                  value={selectedCourse}
                  onChange={(e) => setSelectedCourse(e.target.value)}
                  className="h-full appearance-none pl-3.5 pr-9 text-xs font-mono bg-transparent text-stone-800 dark:text-stone-200 focus:outline-none cursor-pointer"
                >
                  <option value="all">Курс: Все курсы</option>
                  <option value="IV Курс">Курс: IV Курс (ВКР)</option>
                  <option value="III Курс">Курс: III Курс (Практика)</option>
                </select>
                <ChevronDown className="w-3.5 h-3.5 absolute right-3 pointer-events-none text-stone-500 dark:text-stone-400" />
              </div>
            </div>

            {/* Быстрые фильтры по ключевым технологиям */}
            <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-stone-300/80 dark:border-stone-700/80">
              <span className="text-[11px] font-mono uppercase tracking-wider text-stone-600 dark:text-stone-400 flex items-center gap-1 font-medium">
                <Filter className="w-3 h-3" /> Стек:
              </span>
              <button
                type="button"
                onClick={() => setSelectedSkill('all')}
                className={`px-3 py-1.5 text-[11px] font-mono uppercase tracking-wider border transition cursor-pointer font-medium ${
                  selectedSkill === 'all'
                    ? 'border-ink bg-ink text-paper-light dark:border-ink-light dark:bg-ink-light dark:text-paper-dark'
                    : 'border-stone-300/80 dark:border-stone-700/80 text-stone-600 dark:text-stone-400 hover:border-ink hover:text-ink dark:hover:text-stone-200'
                }`}
              >
                Все
              </button>
              {popularSkills.map((sk) => (
                <button
                  key={sk}
                  type="button"
                  onClick={() => setSelectedSkill(selectedSkill === sk ? 'all' : sk)}
                  className={`px-3 py-1.5 text-[11px] font-mono uppercase tracking-wider border transition cursor-pointer font-medium ${
                    selectedSkill === sk
                      ? 'border-oxblood bg-oxblood text-white'
                      : 'border-stone-300/80 dark:border-stone-700/80 text-stone-600 dark:text-stone-400 hover:border-oxblood hover:text-oxblood dark:hover:text-oxblood-light'
                  }`}
                >
                  {sk}
                </button>
              ))}

              {hasActiveStudentFilters && (
                <button
                  type="button"
                  onClick={handleResetStudentFilters}
                  className="ml-auto text-[11px] font-mono uppercase text-oxblood dark:text-oxblood-light hover:underline flex items-center gap-1 cursor-pointer font-medium"
                >
                  <X className="w-3 h-3" /> Сбросить фильтры
                </button>
              )}
            </div>
          </div>

          {/* Список студентов */}
          {filteredStudents.length === 0 ? (
            <div className="p-12 text-center border border-stone-300/80 dark:border-stone-700/80 bg-paper-card dark:bg-paper-darkCard space-y-3 shadow-xs">
              <p className="editorial-serif italic text-2xl text-stone-700 dark:text-stone-300">
                Студенты по заданным параметрам не найдены
              </p>
              <p className="text-xs font-mono text-stone-600 dark:text-stone-400">
                Попробуйте изменить поисковый запрос или сбросить фильтры
              </p>
              {hasActiveStudentFilters && (
                <button
                  type="button"
                  onClick={handleResetStudentFilters}
                  className="px-4 py-2 border border-stone-300/80 dark:border-stone-700/80 hover:border-ink text-xs font-mono uppercase tracking-wider transition cursor-pointer"
                >
                  Сбросить фильтры
                </button>
              )}
            </div>
          ) : (
            <div className="divide-y divide-stone-200/80 dark:divide-stone-800/80 border border-stone-300/80 dark:border-stone-700/80 bg-paper-card dark:bg-paper-darkCard shadow-xs">
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

                // Приоритет: счёт из эмбеддингов ai-service, иначе локальная эвристика
                const aiBest =
                  selectedMatchingProjectId !== 'all'
                    ? (() => {
                        const proj = myCompanyProjects.find(
                          (p) => p.id === selectedMatchingProjectId
                        );
                        if (!proj) return undefined;
                        const score = getScore(student, proj);
                        return score !== undefined ? { score, project: proj } : undefined;
                      })()
                    : bestScore(student, myCompanyProjects);
                const matchScore = aiBest?.score ?? matchResult?.matchScore ?? 0;
                const aiPowered = aiBest !== undefined;

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
                              <SemanticMatchBadge
                                score={matchScore}
                                size="sm"
                                aiPowered={aiPowered}
                                pending={semanticStatus === 'loading'}
                              />
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
        <div className="border border-stone-300/80 dark:border-stone-700/80 bg-paper-card dark:bg-paper-darkCard transition-colors duration-300 shadow-xs">
          <div className="p-6 border-b border-stone-300/80 dark:border-stone-700/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="text-2xl font-normal text-ink dark:text-ink-light">
                Список откликов на проекты компании
              </h3>
              <p className="text-xs text-stone-600 dark:text-stone-400 font-mono mt-0.5">
                Студенты и команды, подавшие заявку на решение задач компании {companyName}
              </p>
            </div>
            <span className="text-[11px] font-mono uppercase px-2.5 py-1 border border-stone-300/80 dark:border-stone-700/80 text-stone-600 dark:text-stone-400 self-start sm:self-auto font-medium">
              Осенний семестр 2026/2027
            </span>
          </div>

          <div
            id="hr-candidates-list"
            className="divide-y divide-stone-200/80 dark:divide-stone-800/80"
          >
            {candidates.length === 0 ? (
              <div className="p-12 text-center space-y-2">
                <p className="editorial-serif italic text-2xl text-stone-600 dark:text-stone-400">
                  Пока нет новых откликов
                </p>
                <p className="text-xs font-mono text-stone-600 dark:text-stone-400">
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

                          <SemanticMatchBadge
                            score={candidateMatchScores.get(c.id)?.score ?? c.match}
                            size="sm"
                            aiPowered={candidateMatchScores.get(c.id)?.ai ?? false}
                            pending={
                              semanticStatus === 'loading' &&
                              !(candidateMatchScores.get(c.id)?.ai ?? false)
                            }
                          />

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
                          <p className="text-xs font-mono italic text-stone-600 dark:text-stone-300 bg-paper-light dark:bg-paper-dark p-2.5 border border-stone-300/80 dark:border-stone-700/80 line-clamp-2">
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
                        className="px-3.5 py-2 border border-stone-300/80 dark:border-stone-700/80 hover:border-oxblood dark:hover:border-oxblood-light text-oxblood dark:text-oxblood-light text-xs font-mono uppercase tracking-wider transition flex items-center gap-1.5 cursor-pointer bg-paper-light dark:bg-paper-dark"
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
                            ? 'bg-paper-muted text-stone-500 dark:bg-paper-dark dark:text-stone-500 cursor-not-allowed'
                            : 'bg-oxblood hover:bg-oxblood-hover text-paper-light font-medium'
                        }`}
                      >
                        {isAccepted ? 'Приглашен' : 'Пригласить в проект'}
                      </button>

                      <button
                        type="button"
                        onClick={() => onContactCandidate(c.name)}
                        className="px-3.5 py-2 border border-stone-300/80 dark:border-stone-700/80 text-xs font-mono uppercase tracking-widest hover:border-ink dark:hover:border-stone-400 text-ink dark:text-ink-light transition cursor-pointer"
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
