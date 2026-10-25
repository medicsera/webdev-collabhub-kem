import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { Toast } from './components/Toast';
import { ApplyModal } from './components/modals/ApplyModal';
import { CreateProjectModal } from './components/modals/CreateProjectModal';
import { CatalogTab } from './components/tabs/CatalogTab';
import { MyProjectsTab } from './components/tabs/MyProjectsTab';
import { HRDashboardTab } from './components/tabs/HRDashboardTab';
import { ProfileTab } from './components/tabs/ProfileTab';

import type { Role, TabId, Project, Candidate, StudentProfile } from './types';
import {
  INITIAL_PROJECTS,
  INITIAL_CANDIDATES,
  INITIAL_STUDENT_PROFILE,
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

  const [selectedProjectForModal, setSelectedProjectForModal] = useState<Project | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isRecalculating, setIsRecalculating] = useState(false);
  const [themeTransition, setThemeTransition] = useState<'dawn' | 'sunset' | null>(null);

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
    setIsDark(nextIsDark);

    setTimeout(() => {
      setThemeTransition(null);
    }, 950);
  };

  const handleSetRole = (role: Role) => {
    setCurrentRole(role);
    if (role === 'student') {
      setCurrentTab('catalog');
      showToast('Включен режим студента');
    } else {
      setCurrentTab('hr-dashboard');
      showToast('Включен режим представителя компании');
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
    setCurrentTab('catalog');
    showToast('Проект добавлен в каталог');
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
            activeProjectsCount={projects.length}
            totalApplicationsCount={candidates.length + projects.filter((p) => p.applied).length}
            onOpenCreateModal={() => setIsCreateModalOpen(true)}
            onApproveCandidate={handleApproveCandidate}
            onContactCandidate={handleContactCandidate}
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
      />

      {/* Всплывающее уведомление */}
      <Toast message={toastMessage} />

      {/* Атмосферный эффект рассвета и заката при переключении темы */}
      {themeTransition && (
        <div
          className={`fixed inset-0 pointer-events-none z-50 ${
            themeTransition === 'dawn' ? 'animate-dawn' : 'animate-sunset'
          }`}
          aria-hidden="true"
        />
      )}
    </div>
  );
};

export default App;
