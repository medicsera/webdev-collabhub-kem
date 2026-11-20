import React, { useState, useEffect, useRef } from 'react';
import { useOutlet, useLocation, useNavigate } from 'react-router-dom';
import { Header } from './Header';
import { Footer } from './Footer';
import { Toast } from './Toast';
import { ApplyModal } from './modals/ApplyModal';
import { EditSkillsModal } from './modals/EditSkillsModal';
import { EditStudentProfileModal } from './modals/EditStudentProfileModal';
import { EditCompanyModal } from './modals/EditCompanyModal';
import { EditProjectModal } from './modals/EditProjectModal';
import { useApp } from '../context/AppContext';

export const AppLayout: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const {
    currentRole,
    setRole,
    isDark,
    toggleTheme,
    notifications,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    logout,
    toastMessage,
    themeTransition,
    selectedProjectForModal,
    setSelectedProjectForModal,
    studentProfile,
    myAcceptedFriends,
    applications,
    submitApplication,
    isEditSkillsModalOpen,
    setIsEditSkillsModalOpen,
    updateStudentSkills,
    isEditStudentProfileModalOpen,
    setIsEditStudentProfileModalOpen,
    isEditCompanyModalOpen,
    setIsEditCompanyModalOpen,
    updateStudentProfile,
    companyProfile,
    updateCompanyProfile,
    editingProject,
    setEditingProject,
    updateProject,
    deleteProject,
  } = useApp();

  const outlet = useOutlet();

  // Только центральные вкладки в хеддере участвуют в горизонтальной прокрутке:
  // Для студента: 0: Каталог, 1: Мои заявки, 2: Чаты
  // Для HR: 0: Панель управления, 1: База студентов, 2: Чаты
  // Профиль (/profile, /company/profile), детальные карточки и модалки возвращают -1
  const getCentralTabOrder = (pathname: string): number => {
    if (pathname === '/catalog' || pathname === '/') return 0;
    if (pathname.startsWith('/hr/dashboard') || pathname === '/hr') return 0;
    if (pathname.startsWith('/my-projects')) return 1;
    if (pathname.startsWith('/students') || pathname.startsWith('/resumes')) return 1;
    if (pathname.startsWith('/chats')) return 2;
    return -1;
  };

  // Кэшируем отрендеренные страницы по pathname, чтобы иметь оба экрана для плавного перехода
  const viewsCacheRef = useRef<Record<string, React.ReactNode>>({});
  if (outlet) {
    viewsCacheRef.current[location.pathname] = outlet;
  }

  // Отслеживание предыдущего и текущего маршрута
  const [routeState, setRouteState] = useState<{ pathname: string; order: number }>({
    pathname: location.pathname,
    order: getCentralTabOrder(location.pathname),
  });

  interface SlideTransition {
    direction: 'to-left' | 'to-right';
    fromPath: string;
    toPath: string;
    fromView: React.ReactNode;
    toView: React.ReactNode;
  }

  const [transition, setTransition] = useState<SlideTransition | null>(null);

  // Синхронный запуск перехода при смене маршрута (без 1-фреймовой задержки)
  if (location.pathname !== routeState.pathname) {
    const fromOrder = routeState.order;
    const toOrder = getCentralTabOrder(location.pathname);
    const fromPath = routeState.pathname;
    const toPath = location.pathname;

    setRouteState({ pathname: toPath, order: toOrder });

    // Анимация слайда запускается ИСКЛЮЧИТЕЛЬНО между центральными кнопками хедера
    if (fromOrder !== -1 && toOrder !== -1 && fromOrder !== toOrder) {
      const direction: 'to-left' | 'to-right' = toOrder > fromOrder ? 'to-left' : 'to-right';
      setTransition({
        direction,
        fromPath,
        toPath,
        fromView: viewsCacheRef.current[fromPath] || outlet,
        toView: outlet,
      });
    } else {
      setTransition(null);
    }
  }

  // Страховочный таймер завершения анимации
  useEffect(() => {
    if (!transition) return;
    const timer = setTimeout(() => {
      setTransition(null);
    }, 340);
    return () => clearTimeout(timer);
  }, [transition]);

  // Сброс скролла при смене вкладки
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }, [location.pathname]);

  const handleViewCompany = (companyId: number) => {
    navigate(`/companies/${companyId}`);
  };

  const handleSubmitApplication = (data: Parameters<typeof submitApplication>[0]) => {
    submitApplication(data);
    setSelectedProjectForModal(null);
    navigate('/my-projects');
  };

  return (
    <div className="bg-paper-light text-ink dark:bg-paper-dark dark:text-ink-light min-h-screen transition-colors duration-300 flex flex-col selection:bg-oxblood selection:text-white screen-enter">
      {/* Paper grain overlay texture */}
      <div className="paper-grain" aria-hidden="true" />

      {/* Шапка и навигация */}
      <Header
        currentRole={currentRole}
        setRole={setRole}
        isDark={isDark}
        toggleTheme={toggleTheme}
        notifications={notifications}
        onMarkNotificationAsRead={markNotificationAsRead}
        onMarkAllNotificationsAsRead={markAllNotificationsAsRead}
        onLogout={logout}
      />

      {/* Основной контент страницы с полной сплошной горизонтальной прокруткой дорожки */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 overflow-x-hidden min-h-[calc(100vh-160px)]">
        {transition ? (
          <div className="w-full overflow-hidden">
            <div
              key={`${transition.fromPath}->${transition.toPath}`}
              className={`w-[200%] flex flex-row items-start ${
                transition.direction === 'to-left'
                  ? 'track-slide-left'
                  : 'track-slide-right'
              }`}
              onAnimationEnd={(e) => {
                if (e.target === e.currentTarget) {
                  setTransition(null);
                }
              }}
            >
              {transition.direction === 'to-left' ? (
                <>
                  <div className="w-1/2 shrink-0 overflow-hidden max-h-[calc(100vh-140px)]">
                    {transition.fromView}
                  </div>
                  <div className="w-1/2 shrink-0 overflow-hidden">
                    {transition.toView}
                  </div>
                </>
              ) : (
                <>
                  <div className="w-1/2 shrink-0 overflow-hidden">
                    {transition.toView}
                  </div>
                  <div className="w-1/2 shrink-0 overflow-hidden max-h-[calc(100vh-140px)]">
                    {transition.fromView}
                  </div>
                </>
              )}
            </div>
          </div>
        ) : (
          <div className="w-full">
            {outlet}
          </div>
        )}
      </main>

      {/* Подвал с академической сводкой */}
      <Footer />

      {/* Модальное окно быстрого отклика: Подача заявки */}
      <ApplyModal
        project={selectedProjectForModal}
        currentStudent={studentProfile}
        friends={myAcceptedFriends}
        applications={applications}
        onClose={() => setSelectedProjectForModal(null)}
        onSubmit={handleSubmitApplication}
        onViewCompany={handleViewCompany}
      />

      {/* Модальное окно быстрого редактирования стека компетенций */}
      <EditSkillsModal
        isOpen={isEditSkillsModalOpen}
        onClose={() => setIsEditSkillsModalOpen(false)}
        skills={studentProfile.skills}
        onSave={updateStudentSkills}
      />

      {/* Модальное окно редактирования профиля студента */}
      <EditStudentProfileModal
        isOpen={isEditStudentProfileModalOpen}
        onClose={() => setIsEditStudentProfileModalOpen(false)}
        profile={studentProfile}
        onSave={(updated) => {
          updateStudentProfile(updated);
          setIsEditStudentProfileModalOpen(false);
        }}
      />

      {/* Модальное окно редактирования профиля компании */}
      <EditCompanyModal
        isOpen={isEditCompanyModalOpen}
        onClose={() => setIsEditCompanyModalOpen(false)}
        company={companyProfile}
        onSave={(updated) => {
          updateCompanyProfile(updated);
          setIsEditCompanyModalOpen(false);
        }}
      />

      {/* Модальное окно редактирования проекта */}
      <EditProjectModal
        isOpen={Boolean(editingProject)}
        project={editingProject}
        onClose={() => setEditingProject(null)}
        onUpdate={(updated) => {
          updateProject(updated);
          setEditingProject(null);
        }}
        onDelete={(projectId) => {
          deleteProject(projectId);
          setEditingProject(null);
        }}
      />

      {/* Всплывающее уведомление платформы */}
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
