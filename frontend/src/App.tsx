import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { Toast } from './components/Toast';
import { ApplyModal } from './components/modals/ApplyModal';
import { CreateProjectModal } from './components/modals/CreateProjectModal';
import { EditProjectModal } from './components/modals/EditProjectModal';
import { EditStudentProfileModal } from './components/modals/EditStudentProfileModal';
import { EditCompanyModal } from './components/modals/EditCompanyModal';
import { CatalogTab } from './components/tabs/CatalogTab';
import { MyProjectsTab } from './components/tabs/MyProjectsTab';
import { HRDashboardTab } from './components/tabs/HRDashboardTab';
import { ProfileTab } from './components/tabs/ProfileTab';
import { CompanyProfileTab } from './components/tabs/CompanyProfileTab';

import type { Role, TabId, Project, Candidate, StudentProfile, CompanyProfile } from './types';
import {
  INITIAL_PROJECTS,
  INITIAL_CANDIDATES,
  INITIAL_STUDENT_PROFILE,
  INITIAL_COMPANY_PROFILE,
} from './data/mockData';

export const App: React.FC = () => {
  const [currentRole, setCurrentRole] = useState<Role>('student');
  const [currentTab, setCurrentTab] = useState<TabId>('catalog');
  const [isDark, setIsDark] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('theme');
      if (savedTheme) return savedTheme === 'dark';
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  const [projects, setProjects] = useState<Project[]>(INITIAL_PROJECTS);
  const [candidates, setCandidates] = useState<Candidate[]>(INITIAL_CANDIDATES);
  const [studentProfile, setStudentProfile] = useState<StudentProfile>(INITIAL_STUDENT_PROFILE);
  const [companyProfile, setCompanyProfile] = useState<CompanyProfile>(INITIAL_COMPANY_PROFILE);

  const [selectedProjectForModal, setSelectedProjectForModal] = useState<Project | null>(null);
  const [projectToEdit, setProjectToEdit] = useState<Project | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditStudentModalOpen, setIsEditStudentModalOpen] = useState(false);
  const [isEditCompanyModalOpen, setIsEditCompanyModalOpen] = useState(false);

  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isRecalculating, setIsRecalculating] = useState(false);
  const [themeTransition, setThemeTransition] = useState<'dawn' | 'sunset' | null>(null);

  // Блокировка фоновой прокрутки страницы при открытых модальных окнах
  const isAnyModalOpen = Boolean(
    selectedProjectForModal ||
      isCreateModalOpen ||
      projectToEdit ||
      isEditStudentModalOpen ||
      isEditCompanyModalOpen
  );

  useEffect(() => {
    if (isAnyModalOpen) {
      const scrollBarWidth = window.innerWidth - document.documentElement.clientWidth;
      document.body.style.overflow = 'hidden';
      if (scrollBarWidth > 0) {
        document.body.style.paddingRight = `${scrollBarWidth}px`;
      }
    } else {
      document.body.style.overflow = '';
      document.body.style.paddingRight = '';
    }
    return () => {
      document.body.style.overflow = '';
      document.body.style.paddingRight = '';
    };
  }, [isAnyModalOpen]);

  // Sync theme with html root class and localStorage
  useEffect(() => {
    const root = document.documentElement;
    if (isDark) {
      root.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDark]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
  };

  useEffect(() => {
    if (!toastMessage) return;
    const timer = setTimeout(() => {
      setToastMessage(null);
    }, 3200);
    return () => clearTimeout(timer);
  }, [toastMessage]);

  const toggleTheme = () => {
    const nextIsDark = !isDark;
    setThemeTransition(nextIsDark ? 'sunset' : 'dawn');

    const updateDOM = () => {
      setIsDark(nextIsDark);
    };

    if (typeof document !== 'undefined' && 'startViewTransition' in document) {
      document.startViewTransition(updateDOM);
    } else {
      updateDOM();
    }

    setTimeout(() => {
      setThemeTransition(null);
    }, 800);
  };

  const handleSetRole = (role: Role) => {
    setCurrentRole(role);
    if (role === 'student') {
      setCurrentTab('catalog');
      showToast('Включен режим студента');
    } else {
      setCurrentTab('hr-dashboard');
      showToast(`Включен режим компании (${companyProfile.name})`);
    }
  };

  const handleSwitchTab = (tab: TabId) => {
    setCurrentTab(tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectProject = (project: Project) => {
    setSelectedProjectForModal(project);
  };

  const handleCloseApplyModal = () => {
    setSelectedProjectForModal(null);
  };

  const handleSubmitApplication = (projectId: number, _coverLetter: string) => {
    setProjects((prev) =>
      prev.map((p) => (p.id === projectId ? { ...p, applied: true } : p))
    );

    const project = projects.find((p) => p.id === projectId);
    if (project) {
      const newCandidate: Candidate = {
        id: 'cand-' + Date.now(),
        name: studentProfile.name,
        group: `${studentProfile.university} • ${studentProfile.group} (${studentProfile.year})`,
        project: project.title,
        match: project.match,
        stack: studentProfile.skills,
        status: 'Новая заявка',
      };
      setCandidates((prev) => [newCandidate, ...prev]);
    }

    handleCloseApplyModal();
    showToast('Заявка успешно отправлена в компанию');
  };

  const handleCreateProject = (
    newProjData: Omit<Project, 'id' | 'index' | 'match' | 'applied'>
  ) => {
    const nextIndexNum = projects.length + 1;
    const formattedIndex = `№ ${String(nextIndexNum).padStart(2, '0')}`;

    const newProject: Project = {
      ...newProjData,
      id: Date.now(),
      index: formattedIndex,
      match: 94,
      applied: false,
    };

    setProjects((prev) => [newProject, ...prev]);
    showToast('Проект добавлен в каталог и реестр компании');
  };

  const handleUpdateProject = (updated: Project) => {
    setProjects((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
    setProjectToEdit(null);
    showToast(`Проект «${updated.title}» успешно обновлен`);
  };

  const handleDeleteProject = (projectId: number) => {
    setProjects((prev) => prev.filter((p) => p.id !== projectId));
    showToast('Проект удален из базы данных');
  };

  const handleUpdateStudentProfile = (updated: StudentProfile) => {
    setStudentProfile(updated);
    showToast('Профиль студента и подтвержденные навыки сохранены');
  };

  const handleUpdateCompanyProfile = (updated: CompanyProfile) => {
    setCompanyProfile(updated);
    showToast('Информация о компании успешно обновлена');
  };

  const handleApproveCandidate = (candidateId: string) => {
    const candidate = candidates.find((c) => c.id === candidateId);
    setCandidates((prev) =>
      prev.map((c) => (c.id === candidateId ? { ...c, status: 'Приглашен' } : c))
    );
    if (candidate) {
      showToast(`Студент «${candidate.name}» приглашен в проект`);
    }
  };

  const handleContactCandidate = (candidateName: string) => {
    showToast(`Сообщение отправлено студенту «${candidateName}»`);
  };

  const handleRecalculateBio = () => {
    setIsRecalculating(true);
    setTimeout(() => {
      setIsRecalculating(false);
      setStudentProfile((prev) => ({
        ...prev,
        aiMatch: 97,
        aiFeedback:
          'Анализ обновленного профиля: RuBERT и Qwen выявили высокую согласованность стека с задачами проектирования архитектуры, распределенных баз данных и веб-платформ. Рекомендуем обратить внимание на новые темы от Софт Инжиниринг и Goodline.',
      }));
      showToast('Векторный профиль компетенций успешно пересчитан!');
    }, 1100);
  };

  return (
    <div className="bg-paper-light text-ink dark:bg-paper-dark dark:text-ink-light min-h-screen transition-colors duration-300 flex flex-col selection:bg-oxblood selection:text-white">
      {/* Шапка и навигация */}
      <Header
        currentRole={currentRole}
        setRole={handleSetRole}
        currentTab={currentTab}
        switchTab={handleSwitchTab}
        isDark={isDark}
        toggleTheme={toggleTheme}
      />

      {/* Основной контент */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {currentTab === 'catalog' && (
          <CatalogTab
            projects={projects}
            currentRole={currentRole}
            onSelectProject={handleSelectProject}
            onOpenCreateModal={() => setIsCreateModalOpen(true)}
          />
        )}

        {currentTab === 'my-projects' && <MyProjectsTab projects={projects} />}

        {currentTab === 'hr-dashboard' && (
          <HRDashboardTab
            candidates={candidates}
            projects={projects}
            companyName={companyProfile.name}
            onOpenCreateModal={() => setIsCreateModalOpen(true)}
            onEditProject={(p) => setProjectToEdit(p)}
            onDeleteProject={handleDeleteProject}
            onApproveCandidate={handleApproveCandidate}
            onContactCandidate={handleContactCandidate}
            onNavigateToCompanyProfile={() => setCurrentTab('company-profile')}
          />
        )}

        {currentTab === 'company-profile' && (
          <CompanyProfileTab
            company={companyProfile}
            projects={projects}
            onOpenEditModal={() => setIsEditCompanyModalOpen(true)}
            onOpenCreateProjectModal={() => setIsCreateModalOpen(true)}
            onEditProject={(p) => setProjectToEdit(p)}
          />
        )}

        {currentTab === 'profile' && (
          <ProfileTab
            profile={studentProfile}
            onUpdateBio={(bio) =>
              setStudentProfile((prev) => ({ ...prev, bio }))
            }
            onRecalculate={handleRecalculateBio}
            isRecalculating={isRecalculating}
            onOpenEditProfileModal={() => setIsEditStudentModalOpen(true)}
          />
        )}
      </main>

      {/* Подвал с академической сводкой */}
      <Footer />

      {/* Модальное окно: Подача заявки */}
      <ApplyModal
        project={selectedProjectForModal}
        onClose={handleCloseApplyModal}
        onSubmit={handleSubmitApplication}
      />

      {/* Модальное окно: Создание проекта (HR) */}
      <CreateProjectModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreate={handleCreateProject}
        initialCompany={companyProfile.name}
        initialDepartment={companyProfile.department}
      />

      {/* Модальное окно: Редактирование проекта (HR) */}
      <EditProjectModal
        project={projectToEdit}
        isOpen={Boolean(projectToEdit)}
        onClose={() => setProjectToEdit(null)}
        onUpdate={handleUpdateProject}
        onDelete={handleDeleteProject}
      />

      {/* Модальное окно: Редактирование профиля студента и навыков */}
      <EditStudentProfileModal
        isOpen={isEditStudentModalOpen}
        onClose={() => setIsEditStudentModalOpen(false)}
        profile={studentProfile}
        onSave={handleUpdateStudentProfile}
      />

      {/* Модальное окно: Редактирование информации о компании */}
      <EditCompanyModal
        isOpen={isEditCompanyModalOpen}
        onClose={() => setIsEditCompanyModalOpen(false)}
        company={companyProfile}
        onSave={handleUpdateCompanyProfile}
      />

      {/* Всплывающее уведомление */}
      <Toast message={toastMessage} />

      {/* Атмосферный эффект рассвета и заката при переключении темы */}
      {themeTransition && (
        <div
          className={`fixed inset-0 pointer-events-none z-50 ${
            themeTransition === 'dawn' ? 'dawn-overlay' : 'sunset-overlay'
          }`}
          aria-hidden="true"
        />
      )}
    </div>
  );
};

export default App;
