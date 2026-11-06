import React, { useState, useEffect, useMemo } from 'react';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { Toast } from './components/Toast';
import { ApplyModal, type ApplyModalSubmitData } from './components/modals/ApplyModal';
import { CreateProjectModal } from './components/modals/CreateProjectModal';
import { EditProjectModal } from './components/modals/EditProjectModal';
import { EditStudentProfileModal } from './components/modals/EditStudentProfileModal';
import { EditSkillsModal } from './components/modals/EditSkillsModal';
import { EditCompanyModal } from './components/modals/EditCompanyModal';
import { ApplicationChatModal } from './components/modals/ApplicationChatModal';
import { CatalogTab } from './components/tabs/CatalogTab';
import { MyProjectsTab } from './components/tabs/MyProjectsTab';
import { HRDashboardTab } from './components/tabs/HRDashboardTab';
import { ProfileTab } from './components/tabs/ProfileTab';
import { CompanyProfileTab } from './components/tabs/CompanyProfileTab';
import { PublicCompanyProfileTab } from './components/tabs/PublicCompanyProfileTab';
import { PublicStudentProfileTab } from './components/tabs/PublicStudentProfileTab';
import { AuthScreen } from './components/AuthScreen';

import type {
  Role,
  TabId,
  Project,
  Candidate,
  StudentProfile,
  CompanyProfile,
  SkillItem,
  StudentConnection,
  ProjectApplication,
  Chat,
  AppNotification,
  ApplicationMember,
} from './types';
import {
  INITIAL_PROJECTS,
  INITIAL_CANDIDATES,
  INITIAL_STUDENT_PROFILE,
  INITIAL_COMPANY_PROFILE,
  MOCK_STUDENTS,
  INITIAL_CONNECTIONS,
  INITIAL_APPLICATIONS,
  INITIAL_CHATS,
  INITIAL_NOTIFICATIONS,
} from './data/mockData';
import { getCompanyProfileApi, getStudentProfileApi } from './api';
import { orderConnectionPair } from './utils/dbValidation';

export const App: React.FC = () => {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('isLoggedIn') === 'true';
    }
    return false;
  });
  const [currentRole, setCurrentRole] = useState<Role>(() => {
    if (typeof window !== 'undefined') {
      const savedRole = localStorage.getItem('currentRole') as Role;
      if (savedRole === 'student' || savedRole === 'hr') return savedRole;
    }
    return 'student';
  });
  const [currentTab, setCurrentTab] = useState<TabId>(() => {
    if (typeof window !== 'undefined') {
      const savedRole = localStorage.getItem('currentRole');
      return savedRole === 'hr' ? 'hr-dashboard' : 'catalog';
    }
    return 'catalog';
  });
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

  // Стейты новой схемы БД (student_connections, applications, chats, messages, notifications)
  const [connections, setConnections] = useState<StudentConnection[]>(INITIAL_CONNECTIONS);
  const [applications, setApplications] = useState<ProjectApplication[]>(INITIAL_APPLICATIONS);
  const [chats, setChats] = useState<Chat[]>(INITIAL_CHATS);
  const [notifications, setNotifications] = useState<AppNotification[]>(INITIAL_NOTIFICATIONS);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);

  const [selectedProjectForModal, setSelectedProjectForModal] = useState<Project | null>(null);
  const [projectToEdit, setProjectToEdit] = useState<Project | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditStudentModalOpen, setIsEditStudentModalOpen] = useState(false);
  const [isEditSkillsModalOpen, setIsEditSkillsModalOpen] = useState(false);
  const [isEditCompanyModalOpen, setIsEditCompanyModalOpen] = useState(false);

  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isRecalculating, setIsRecalculating] = useState(false);
  const [themeTransition, setThemeTransition] = useState<'dawn' | 'sunset' | null>(null);
  const [isExiting, setIsExiting] = useState(false);

  // Состояния для публичных профилей (двусторонний просмотр)
  const [_viewingCompanyId, setViewingCompanyId] = useState<number | null>(null);
  const [_viewingStudentId, setViewingStudentId] = useState<number | null>(null);
  const [previousTab, setPreviousTab] = useState<TabId | null>(null);

  const [publicCompany, setPublicCompany] = useState<CompanyProfile | null>(null);
  const [isCompanyLoading, setIsCompanyLoading] = useState<boolean>(false);
  const [companyError, setCompanyError] = useState<string | null>(null);

  const [publicStudent, setPublicStudent] = useState<StudentProfile | null>(null);
  const [isStudentLoading, setIsStudentLoading] = useState<boolean>(false);
  const [studentError, setStudentError] = useState<string | null>(null);

  // Состояния для плавной горизонтальной анимации переключения вкладок (эффект горизонтальной прокрутки)
  const [exitingTab, setExitingTab] = useState<TabId | null>(null);
  const [tabDirection, setTabDirection] = useState<'forward' | 'backward'>('forward');
  const [isTabTransitioning, setIsTabTransitioning] = useState<boolean>(false);

  // Блокировка фоновой прокрутки страницы при открытых модальных окнах
  const isAnyModalOpen = Boolean(
    selectedProjectForModal ||
      isCreateModalOpen ||
      projectToEdit ||
      isEditStudentModalOpen ||
      isEditSkillsModalOpen ||
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

  const resetScrollToTop = () => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  };

  // Автоматический сброс уровня прокрутки к самому верху при переходе между страницами (Issue 3)
  useEffect(() => {
    resetScrollToTop();
  }, [isLoggedIn]);

  useEffect(() => {
    resetScrollToTop();
  }, [currentTab]);

  const getRoleTabIndex = (role: Role, tab: TabId): number => {
    if (role === 'student') {
      const studentOrder: TabId[] = ['catalog', 'my-projects', 'profile'];
      const idx = studentOrder.indexOf(tab);
      return idx >= 0 ? idx : 0;
    } else {
      const hrOrder: TabId[] = ['hr-dashboard', 'company-profile', 'catalog'];
      const idx = hrOrder.indexOf(tab);
      return idx >= 0 ? idx : 0;
    }
  };

  const handleLogin = (role: Role, _phone?: string) => {
    setCurrentRole(role);
    // Сначала проигрываем анимацию выхода с auth-экрана и сбрасываем скролл
    setIsExiting(true);
    resetScrollToTop();

    setTimeout(() => {
      setIsLoggedIn(true);
      setIsExiting(false);
      resetScrollToTop();
      localStorage.setItem('isLoggedIn', 'true');
      localStorage.setItem('currentRole', role);
      setExitingTab(null);
      setIsTabTransitioning(false);
      if (role === 'student') {
        setCurrentTab('catalog');
        showToast('Добро пожаловать! Вы вошли как Студент');
      } else {
        setCurrentTab('hr-dashboard');
        showToast(`Добро пожаловать! Вы вошли как Компания (${companyProfile.name})`);
      }
    }, 320);
  };

  const handleLogout = () => {
    // Сначала проигрываем анимацию выхода с основного экрана и сбрасываем скролл
    setIsExiting(true);
    resetScrollToTop();

    setTimeout(() => {
      setIsLoggedIn(false);
      setIsExiting(false);
      resetScrollToTop();
      localStorage.removeItem('isLoggedIn');
      setExitingTab(null);
      setIsTabTransitioning(false);
      showToast('Вы вышли из учетной записи');
    }, 320);
  };

  const handleSetRole = (role: Role) => {
    setCurrentRole(role);
    localStorage.setItem('currentRole', role);
    setExitingTab(null);
    setIsTabTransitioning(false);
    resetScrollToTop();
    if (role === 'student') {
      setCurrentTab('catalog');
      showToast('Включен режим студента');
    } else {
      setCurrentTab('hr-dashboard');
      showToast(`Включен режим компании (${companyProfile.name})`);
    }
  };

  const handleSwitchTab = (newTab: TabId) => {
    if (newTab === currentTab) {
      resetScrollToTop();
      return;
    }

    const oldIndex = getRoleTabIndex(currentRole, currentTab);
    const newIndex = getRoleTabIndex(currentRole, newTab);
    const direction = newIndex >= oldIndex ? 'forward' : 'backward';

    resetScrollToTop();

    setTabDirection(direction);
    setExitingTab(currentTab);
    setCurrentTab(newTab);
    setIsTabTransitioning(true);

    setTimeout(() => {
      setExitingTab(null);
      setIsTabTransitioning(false);
    }, 380);
  };

  const handleSelectProject = (project: Project) => {
    setSelectedProjectForModal(project);
  };

  const handleCloseApplyModal = () => {
    setSelectedProjectForModal(null);
  };

  // Подтвержденные друзья текущего студента
  const currentStudentId = Number(studentProfile.id || 1);
  const myAcceptedFriends = useMemo(() => {
    return connections
      .filter(
        (c) =>
          c.status === 'ACCEPTED' &&
          (Number(c.studentId) === currentStudentId || Number(c.partnerId) === currentStudentId)
      )
      .map((c) => {
        const partnerId =
          Number(c.studentId) === currentStudentId ? Number(c.partnerId) : Number(c.studentId);
        return MOCK_STUDENTS.find((s) => Number(s.id) === partnerId);
      })
      .filter(Boolean) as StudentProfile[];
  }, [connections, currentStudentId]);

  // Задача 3: Обработчики связей напарников (student_connections)
  const handleSendFriendRequest = (targetStudentId: number) => {
    // Ограничение БД: CHECK (student_id < partner_id)!
    const { studentId: idA, partnerId: idB } = orderConnectionPair(currentStudentId, targetStudentId);

    const targetStudent = MOCK_STUDENTS.find((s) => Number(s.id) === targetStudentId);

    const newConnection: StudentConnection = {
      id: `conn-${Date.now()}`,
      studentId: idA,
      partnerId: idB,
      status: 'PENDING',
      requestedBy: currentStudentId,
      createdAt: new Date().toISOString(),
    };

    setConnections((prev) => [...prev, newConnection]);
    showToast(`Заявка в напарники отправлена студенту «${targetStudent?.name || targetStudentId}»`);
  };

  const handleAcceptFriendRequest = (connectionId: string) => {
    const conn = connections.find((c) => c.id === connectionId);
    setConnections((prev) =>
      prev.map((c) =>
        c.id === connectionId
          ? { ...c, status: 'ACCEPTED', respondedAt: new Date().toISOString() }
          : c
      )
    );

    if (conn) {
      const partnerId =
        Number(conn.studentId) === currentStudentId ? Number(conn.partnerId) : Number(conn.studentId);
      const partner = MOCK_STUDENTS.find((s) => Number(s.id) === partnerId);

      // Добавляем уведомление FRIEND_ACCEPTED
      const newNotif: AppNotification = {
        id: `notif-${Date.now()}`,
        userId: currentStudentId,
        type: 'FRIEND_ACCEPTED',
        title: 'Заявка в напарники подтверждена',
        body: `Вы и ${partner?.name || 'студент'} теперь напарники и можете совместно подавать заявки на проекты.`,
        createdAt: new Date().toISOString(),
        isRead: false,
      };
      setNotifications((prev) => [newNotif, ...prev]);
    }

    showToast('Заявка принята! Теперь вы напарники для командных проектов');
  };

  const handleRejectFriendRequest = (connectionId: string) => {
    setConnections((prev) =>
      prev.map((c) =>
        c.id === connectionId
          ? { ...c, status: 'REJECTED', respondedAt: new Date().toISOString() }
          : c
      )
    );
    showToast('Заявка в напарники отклонена');
  };

  const handleCancelFriendRequest = (connectionId: string) => {
    setConnections((prev) => prev.filter((c) => c.id !== connectionId));
    showToast('Исходящий запрос в напарники отменен');
  };

  // Задача 5: Обработчики чатов (chats + messages)
  const handleOpenChat = (chatId: string) => {
    setActiveChatId(chatId);
  };

  const handleCloseChat = () => {
    setActiveChatId(null);
  };

  const handleSendMessage = (chatId: string, content: string) => {
    const isHr = currentRole === 'hr';
    const senderName = isHr
      ? `${companyProfile.contactPerson} (${companyProfile.name})`
      : studentProfile.name;

    const newMessage = {
      id: `msg-${Date.now()}`,
      chatId,
      senderId: isHr ? 'hr-user' : currentStudentId,
      senderName,
      senderRole: currentRole,
      content,
      isRead: false,
      createdAt: new Date().toISOString(),
    };

    setChats((prev) =>
      prev.map((chat) =>
        chat.id === chatId
          ? { ...chat, messages: [...chat.messages, newMessage] }
          : chat
      )
    );
  };

  // Обработчики уведомлений
  const handleMarkNotificationAsRead = (notifId: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === notifId ? { ...n, isRead: true } : n))
    );
  };

  const handleMarkAllNotificationsAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    showToast('Все уведомления отмечены как прочитанные');
  };

  // Задача 4: Подача заявки (командной или индивидуальной)
  const handleSubmitApplication = (data: ApplyModalSubmitData) => {
    const project = projects.find((p) => p.id === data.projectId);
    if (!project) return;

    // Ограничение БД: один студент не может состоять в двух заявках на один и тот же проект (UNIQUE: student_id, project_id)
    const alreadyApplied = applications.some(
      (app) =>
        app.projectId === data.projectId &&
        (Number(app.studentId) === currentStudentId ||
          app.members?.some((m) => Number(m.studentId) === currentStudentId))
    );

    if (alreadyApplied) {
      showToast('Ошибка: Вы уже участвуете в заявке на этот проект (ограничение БД: UNIQUE)');
      return;
    }

    const members: ApplicationMember[] = [
      {
        studentId: currentStudentId,
        studentName: studentProfile.name,
        studentGroup: studentProfile.group,
        role: 'LEAD',
        joinedAt: new Date().toISOString(),
      },
    ];

    if (data.isTeam && data.memberStudentIds.length > 0) {
      data.memberStudentIds.forEach((mId) => {
        const friend = MOCK_STUDENTS.find((s) => Number(s.id) === mId);
        if (friend) {
          members.push({
            studentId: mId,
            studentName: friend.name,
            studentGroup: friend.group,
            role: 'MEMBER',
            joinedAt: new Date().toISOString(),
          });
        }
      });
    }

    const newAppId = `app-${Date.now()}`;
    const newChatId = `chat-${newAppId}`;

    const newApplication: ProjectApplication = {
      id: newAppId,
      projectId: data.projectId,
      studentId: currentStudentId,
      isTeam: data.isTeam,
      status: 'PENDING',
      coverLetter: data.coverLetter,
      members,
      createdAt: new Date().toISOString(),
      chatId: newChatId,
    };

    // Создаем чат по отклику (chats + messages)
    const newChat: Chat = {
      id: newChatId,
      applicationId: newAppId,
      projectId: project.id,
      projectTitle: project.title,
      companyName: project.company,
      messages: [
        {
          id: `msg-${Date.now()}`,
          chatId: newChatId,
          senderId: currentStudentId,
          senderName: `${studentProfile.name}${data.isTeam ? ' (Team Lead)' : ''}`,
          senderRole: 'student',
          content:
            data.coverLetter.trim() ||
            `Здравствуйте! ${data.isTeam ? 'Наша команда подала' : 'Я подал'} заявку на участие в проекте «${project.title}». Будем рады обсудить задачи!`,
          isRead: false,
          createdAt: new Date().toISOString(),
        },
      ],
    };

    setApplications((prev) => [newApplication, ...prev]);
    setChats((prev) => [newChat, ...prev]);

    setProjects((prev) =>
      prev.map((p) => (p.id === data.projectId ? { ...p, applied: true } : p))
    );

    // Добавляем отклик в панель работодателя (candidates)
    const newCandidate: Candidate = {
      id: 'cand-' + Date.now(),
      studentId: currentStudentId,
      name: members.map((m) => m.studentName).join(' & '),
      group: `${studentProfile.university} • ${studentProfile.group} (${studentProfile.year})`,
      project: project.title,
      match: project.match,
      stack: studentProfile.skills,
      status: 'Новая заявка',
      applicationId: newAppId,
      isTeam: data.isTeam,
      teamMembers: members,
      coverLetter: data.coverLetter,
    };
    setCandidates((prev) => [newCandidate, ...prev]);

    // Уведомление об успешной отправке
    const newNotif: AppNotification = {
      id: `notif-${Date.now()}`,
      userId: currentStudentId,
      type: 'APPLICATION_STATUS_CHANGED',
      title: 'Заявка отправлена',
      body: `Ваша ${data.isTeam ? 'командная ' : ''}заявка на проект «${project.title}» (${project.company}) успешно зарегистрирована со статусом «Новая заявка».`,
      createdAt: new Date().toISOString(),
      isRead: false,
    };
    setNotifications((prev) => [newNotif, ...prev]);

    handleCloseApplyModal();
    showToast(
      data.isTeam
        ? `Командная заявка (${members.length} чел.) успешно отправлена!`
        : 'Заявка успешно отправлена в компанию'
    );
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

  const handleUpdateStudentSkills = (updatedSkills: SkillItem[]) => {
    setStudentProfile((prev) => ({ ...prev, skills: updatedSkills }));
    showToast('Технологический стек и навыки успешно обновлены');
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

  // Загрузка публичного профиля компании
  const loadCompany = async (companyId: number) => {
    setIsCompanyLoading(true);
    setCompanyError(null);
    try {
      const data = await getCompanyProfileApi(companyId);
      setPublicCompany(data);
    } catch (err: unknown) {
      setCompanyError((err as Error)?.message || 'Компания не найдена');
      setPublicCompany(null);
    } finally {
      setIsCompanyLoading(false);
    }
  };

  // Загрузка публичного профиля студента
  const loadStudent = async (studentId: number) => {
    setIsStudentLoading(true);
    setStudentError(null);
    try {
      const data = await getStudentProfileApi(studentId);
      setPublicStudent(data);
    } catch (err: unknown) {
      setStudentError((err as Error)?.message || 'Профиль студента не найден');
      setPublicStudent(null);
    } finally {
      setIsStudentLoading(false);
    }
  };

  // === Навигация к публичным профилям ===

  const handleViewCompany = (companyId: number, _companyName?: string) => {
    setPreviousTab(currentTab);
    setViewingCompanyId(companyId);
    setViewingStudentId(null);
    window.history.pushState({ tab: 'public-company', companyId }, '', `/companies/${companyId}`);
    handleSwitchTab('public-company');
    loadCompany(companyId);
  };

  const handleViewStudent = (studentId: number) => {
    setPreviousTab(currentTab);
    setViewingStudentId(studentId);
    setViewingCompanyId(null);
    window.history.pushState({ tab: 'public-student', studentId }, '', `/students/${studentId}`);
    handleSwitchTab('public-student');
    loadStudent(studentId);
  };

  const handleBackFromPublicProfile = () => {
    const backTab = previousTab || (currentRole === 'student' ? 'catalog' : 'hr-dashboard');
    setViewingCompanyId(null);
    setViewingStudentId(null);
    setPreviousTab(null);
    window.history.pushState({}, '', '/');
    handleSwitchTab(backTab);
  };

  // Маршрутизация по прямым ссылкам (/companies/:id, /students/:id, /resumes/:id)
  useEffect(() => {
    const parseUrlRoute = () => {
      const path = window.location.pathname;
      const companyMatch = path.match(/^\/companies\/(\d+)/);
      if (companyMatch) {
        const id = parseInt(companyMatch[1], 10);
        setViewingCompanyId(id);
        setViewingStudentId(null);
        setCurrentTab('public-company');
        loadCompany(id);
        return;
      }

      const studentMatch = path.match(/^\/(?:students|resumes)\/(\d+)/);
      if (studentMatch) {
        const id = parseInt(studentMatch[1], 10);
        setViewingStudentId(id);
        setViewingCompanyId(null);
        setCurrentTab('public-student');
        loadStudent(id);
        return;
      }
    };

    parseUrlRoute();

    const handlePopState = () => {
      parseUrlRoute();
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const renderTabContent = (tab: TabId) => {
    switch (tab) {
      case 'catalog':
        return (
          <CatalogTab
            projects={projects}
            currentRole={currentRole}
            onSelectProject={handleSelectProject}
            onOpenCreateModal={() => setIsCreateModalOpen(true)}
            onViewCompany={handleViewCompany}
          />
        );
      case 'my-projects':
        return (
          <MyProjectsTab
            projects={projects}
            applications={applications}
            currentStudentId={currentStudentId}
            onOpenChat={handleOpenChat}
            onViewCompany={handleViewCompany}
          />
        );
      case 'hr-dashboard':
        return (
          <HRDashboardTab
            candidates={candidates}
            allStudents={MOCK_STUDENTS}
            projects={projects}
            companyName={companyProfile.name}
            onApproveCandidate={handleApproveCandidate}
            onContactCandidate={handleContactCandidate}
            onNavigateToCompanyProfile={() => handleSwitchTab('company-profile')}
            onViewStudent={handleViewStudent}
            onOpenChat={handleOpenChat}
          />
        );
      case 'company-profile':
        return (
          <CompanyProfileTab
            company={companyProfile}
            projects={projects}
            onOpenEditModal={() => setIsEditCompanyModalOpen(true)}
            onOpenCreateProjectModal={() => setIsCreateModalOpen(true)}
            onEditProject={(p) => setProjectToEdit(p)}
            onLogout={handleLogout}
          />
        );
      case 'profile':
        return (
          <ProfileTab
            profile={studentProfile}
            connections={connections}
            allStudents={MOCK_STUDENTS}
            onUpdateBio={(bio) =>
              setStudentProfile((prev) => ({ ...prev, bio }))
            }
            onRecalculate={handleRecalculateBio}
            isRecalculating={isRecalculating}
            onOpenEditProfileModal={() => setIsEditStudentModalOpen(true)}
            onOpenEditSkillsModal={() => setIsEditSkillsModalOpen(true)}
            onSendFriendRequest={handleSendFriendRequest}
            onAcceptFriendRequest={handleAcceptFriendRequest}
            onRejectFriendRequest={handleRejectFriendRequest}
            onCancelFriendRequest={handleCancelFriendRequest}
            onViewStudent={handleViewStudent}
            onLogout={handleLogout}
          />
        );
      case 'public-company':
        return (
          <PublicCompanyProfileTab
            company={publicCompany}
            projects={projects}
            isLoading={isCompanyLoading}
            error={companyError}
            onBack={handleBackFromPublicProfile}
            onSelectProject={handleSelectProject}
          />
        );
      case 'public-student':
        return (
          <PublicStudentProfileTab
            student={publicStudent}
            isLoading={isStudentLoading}
            error={studentError}
            onBack={handleBackFromPublicProfile}
          />
        );
      default:
        return null;
    }
  };

  const activeChat = useMemo(() => {
    if (!activeChatId) return null;
    return chats.find((c) => c.id === activeChatId) || null;
  }, [chats, activeChatId]);

  const activeChatApplication = useMemo(() => {
    if (!activeChat) return null;
    return applications.find((a) => a.id === activeChat.applicationId) || null;
  }, [applications, activeChat]);

  const activeChatProject = useMemo(() => {
    if (!activeChat) return null;
    return projects.find((p) => p.id === activeChat.projectId) || null;
  }, [projects, activeChat]);

  if (!isLoggedIn) {
    return (
      <>
        <div className={isExiting ? 'screen-exit' : 'screen-enter'}>
          <AuthScreen
            onLogin={handleLogin}
            isDark={isDark}
            toggleTheme={toggleTheme}
            themeTransition={themeTransition}
          />
        </div>
        <Toast message={toastMessage} />
      </>
    );
  }

  return (
    <div className={`bg-paper-light text-ink dark:bg-paper-dark dark:text-ink-light min-h-screen transition-colors duration-300 flex flex-col selection:bg-oxblood selection:text-white ${isExiting ? 'screen-exit' : 'screen-enter'}`}>
      {/* Шапка и навигация */}
      <Header
        currentRole={currentRole}
        setRole={handleSetRole}
        currentTab={currentTab}
        switchTab={handleSwitchTab}
        isDark={isDark}
        toggleTheme={toggleTheme}
        notifications={notifications}
        onMarkNotificationAsRead={handleMarkNotificationAsRead}
        onMarkAllNotificationsAsRead={handleMarkAllNotificationsAsRead}
        onLogout={handleLogout}
      />

      {/* Основной контент с горизонтальной анимацией переключения окон */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="tabs-viewport">
          {exitingTab && (
            <div
              key={`exit-${exitingTab}`}
              className={`absolute inset-x-0 top-0 pointer-events-none ${
                tabDirection === 'forward' ? 'tab-slide-out-left' : 'tab-slide-out-right'
              }`}
            >
              {renderTabContent(exitingTab)}
            </div>
          )}

          <div
            key={`enter-${currentTab}`}
            className={`w-full ${
              isTabTransitioning
                ? tabDirection === 'forward'
                  ? 'tab-slide-in-right'
                  : 'tab-slide-in-left'
                : ''
            }`}
          >
            {renderTabContent(currentTab)}
          </div>
        </div>
      </main>

      {/* Подвал с академической сводкой */}
      <Footer />

      {/* Модальное окно: Подача заявки (Задача 4: командный/индивидуальный отклик) */}
      <ApplyModal
        project={selectedProjectForModal}
        currentStudent={studentProfile}
        friends={myAcceptedFriends}
        applications={applications}
        onClose={handleCloseApplyModal}
        onSubmit={handleSubmitApplication}
        onViewCompany={handleViewCompany}
      />

      {/* Модальное окно: Чат по отклику (Задача 5: chats + messages) */}
      <ApplicationChatModal
        isOpen={Boolean(activeChat)}
        onClose={handleCloseChat}
        chat={activeChat}
        application={activeChatApplication}
        project={activeChatProject}
        currentRole={currentRole}
        currentUserId={currentRole === 'student' ? currentStudentId : 'hr-user'}
        currentUserName={currentRole === 'student' ? studentProfile.name : companyProfile.contactPerson}
        onSendMessage={handleSendMessage}
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

      {/* Модальное окно: Редактирование только стека навыков (+ Изменить) */}
      <EditSkillsModal
        isOpen={isEditSkillsModalOpen}
        onClose={() => setIsEditSkillsModalOpen(false)}
        skills={studentProfile.skills}
        onSave={handleUpdateStudentSkills}
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
