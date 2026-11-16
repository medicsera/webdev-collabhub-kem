import React, { useEffect } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Header } from './Header';
import { Footer } from './Footer';
import { Toast } from './Toast';
import { ApplyModal } from './modals/ApplyModal';
import { EditSkillsModal } from './modals/EditSkillsModal';
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
  } = useApp();

  // Автоматический сброс прокрутки к верху страницы при любой смене URL-маршрута
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
    // Next Best Action: автоматический редирект на список поданных заявок
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

      {/* Основной контент страницы с тактильной журнальной анимацией перелистывания полосы */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div key={`${location.pathname}${location.search}`} className="editorial-page-turn w-full">
          <Outlet />
        </div>
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
