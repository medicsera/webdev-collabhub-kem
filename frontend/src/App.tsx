import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useParams } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AppProvider, useApp } from './context/AppContext';
import { AppLayout } from './components/AppLayout';
import { ProtectedRoute } from './components/ProtectedRoute';
import { RoleGuard } from './components/RoleGuard';
import { AuthScreen } from './components/AuthScreen';
import { Toast } from './components/Toast';

// Компоненты страниц / вкладок
import { CatalogTab } from './components/tabs/CatalogTab';
import { MyProjectsTab } from './components/tabs/MyProjectsTab';
import { HRDashboardTab } from './components/tabs/HRDashboardTab';
import { StudentsCatalogTab } from './components/tabs/StudentsCatalogTab';
import { ChatsPage } from './components/ChatsPage';
import { ProfileTab } from './components/tabs/ProfileTab';
import { CompanyProfileTab } from './components/tabs/CompanyProfileTab';

// Страницы бывших модальных окон (повышенные до полноценных маршрутов)
import { CreateProjectPage } from './pages/CreateProjectPage';
import { EditProjectPage } from './pages/EditProjectPage';
import { EditStudentProfilePage } from './pages/EditStudentProfilePage';
import { EditCompanyPage } from './pages/EditCompanyPage';
import { CompanyProfilePage } from './pages/CompanyProfilePage';
import { StudentProfilePage } from './pages/StudentProfilePage';

import { MOCK_STUDENTS } from './data/mockData';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 1000 * 60 * 5,
    },
  },
});

// Умный домашний редирект в зависимости от роли пользователя
const HomeRedirect: React.FC = () => {
  const { currentRole } = useApp();
  return <Navigate to={currentRole === 'student' ? '/catalog' : '/hr/dashboard'} replace />;
};

// Экран авторизации с защитой от повторного входа
const AuthScreenWrapper: React.FC = () => {
  const { isLoggedIn, currentRole, login, isDark, toggleTheme, themeTransition, toastMessage } = useApp();

  if (isLoggedIn) {
    return <Navigate to={currentRole === 'student' ? '/catalog' : '/hr/dashboard'} replace />;
  }

  return (
    <>
      <AuthScreen
        onLogin={login}
        isDark={isDark}
        toggleTheme={toggleTheme}
        themeTransition={themeTransition}
      />
      <Toast message={toastMessage} />
    </>
  );
};

// Обёртки компонентов страниц с подключением к контексту
const CatalogPageWrapper: React.FC = () => {
  const { projects, currentRole, studentProfile, setSelectedProjectForModal } = useApp();
  return (
    <CatalogTab
      projects={projects}
      currentRole={currentRole}
      studentProfile={studentProfile}
      onSelectProject={setSelectedProjectForModal}
    />
  );
};

const MyProjectsPageWrapper: React.FC = () => {
  const { projects, applications, studentProfile } = useApp();
  return (
    <MyProjectsTab
      projects={projects}
      applications={applications}
      currentStudentId={studentProfile.id || 1}
      studentProfile={studentProfile}
    />
  );
};

const HRDashboardPageWrapper: React.FC = () => {
  const {
    candidates,
    projects,
    companyProfile,
    approveCandidate,
    contactCandidate,
    deleteProject,
    updateProjectStatus,
  } = useApp();

  return (
    <HRDashboardTab
      candidates={candidates}
      allStudents={MOCK_STUDENTS}
      projects={projects}
      companyName={companyProfile.name}
      onApproveCandidate={approveCandidate}
      onContactCandidate={contactCandidate}
      onDeleteProject={deleteProject}
      onUpdateProjectStatus={updateProjectStatus}
    />
  );
};

const StudentsCatalogPageWrapper: React.FC = () => {
  const { projects, companyProfile, showToast } = useApp();
  return (
    <StudentsCatalogTab
      students={MOCK_STUDENTS}
      projects={projects}
      companyName={companyProfile.name}
      onContactStudent={(student) => {
        showToast(`Приглашение отправлено студенту «${student.name}»`);
      }}
    />
  );
};

const ChatsPageWrapper: React.FC = () => {
  const { chatId } = useParams<{ chatId?: string }>();
  const { chats, applications, currentRole, studentProfile, companyProfile, sendMessage } = useApp();

  return (
    <ChatsPage
      chats={chats}
      applications={applications}
      currentRole={currentRole}
      currentUserId={currentRole === 'student' ? (studentProfile.id || 1) : 'hr-user'}
      currentUserName={currentRole === 'student' ? studentProfile.name : `${companyProfile.name} (HR)`}
      activeChatId={chatId}
      onSendMessage={sendMessage}
    />
  );
};

const ProfilePageWrapper: React.FC = () => {
  const {
    projects,
    studentProfile,
    connections,
    recalculateBio,
    isRecalculating,
    setIsEditSkillsModalOpen,
    setIsEditStudentProfileModalOpen,
    sendFriendRequest,
    acceptFriendRequest,
    rejectFriendRequest,
    cancelFriendRequest,
    logout,
    updateStudentProfile,
  } = useApp();

  return (
    <ProfileTab
      profile={studentProfile}
      projects={projects}
      connections={connections}
      allStudents={MOCK_STUDENTS}
      onUpdateBio={(bio) => updateStudentProfile({ ...studentProfile, bio })}
      onRecalculate={recalculateBio}
      isRecalculating={isRecalculating}
      onOpenEditProfileModal={() => setIsEditStudentProfileModalOpen(true)}
      onOpenEditSkillsModal={() => setIsEditSkillsModalOpen(true)}
      onSendFriendRequest={sendFriendRequest}
      onAcceptFriendRequest={acceptFriendRequest}
      onRejectFriendRequest={rejectFriendRequest}
      onCancelFriendRequest={cancelFriendRequest}
      onLogout={logout}
    />
  );
};

const CompanyProfilePageWrapper: React.FC = () => {
  const { companyProfile, logout, setIsEditCompanyModalOpen } = useApp();
  return (
    <CompanyProfileTab
      company={companyProfile}
      onOpenEditModal={() => setIsEditCompanyModalOpen(true)}
      onLogout={logout}
    />
  );
};

export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      {/* Публичный экран входа */}
      <Route path="/login" element={<AuthScreenWrapper />} />

      {/* Защищенные маршруты авторизованных пользователей */}
      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          {/* Корневой умный редирект на дашборд роли */}
          <Route path="/" element={<HomeRedirect />} />

          {/* Рабочий цикл Студента (RoleGuard: student) */}
          <Route element={<RoleGuard allowedRoles={['student']} />}>
            <Route path="/catalog" element={<CatalogPageWrapper />} />
            <Route path="/my-projects" element={<MyProjectsPageWrapper />} />
            <Route path="/profile" element={<ProfilePageWrapper />} />
            <Route path="/profile/edit" element={<EditStudentProfilePage />} />
          </Route>

          {/* Рабочий цикл Организации / HR (RoleGuard: hr) */}
          <Route element={<RoleGuard allowedRoles={['hr']} />}>
            <Route path="/hr/dashboard" element={<HRDashboardPageWrapper />} />
            <Route path="/hr/projects/create" element={<CreateProjectPage />} />
            <Route path="/hr/projects/:id/edit" element={<EditProjectPage />} />
            <Route path="/students" element={<StudentsCatalogPageWrapper />} />
            <Route path="/company/profile" element={<CompanyProfilePageWrapper />} />
            <Route path="/company/profile/edit" element={<EditCompanyPage />} />
          </Route>

          {/* Общие коммуникации и просмотр публичных визиток */}
          <Route path="/chats" element={<ChatsPageWrapper />} />
          <Route path="/chats/:chatId" element={<ChatsPageWrapper />} />
          <Route path="/companies/:id" element={<CompanyProfilePage />} />
          <Route path="/students/:id" element={<StudentProfilePage />} />
          <Route path="/resumes/:id" element={<StudentProfilePage />} />

          {/* Несуществующие пути */}
          <Route path="*" element={<HomeRedirect />} />
        </Route>
      </Route>
    </Routes>
  );
};

export const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AppProvider>
          <AppRoutes />
        </AppProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
};

export default App;
