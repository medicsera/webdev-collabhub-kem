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
import { PublicCompanyProfileTab } from './components/tabs/PublicCompanyProfileTab';
import { PublicStudentProfileTab } from './components/tabs/PublicStudentProfileTab';
import { StudentsCatalogTab } from './components/tabs/StudentsCatalogTab';
import { AuthScreen } from './components/AuthScreen';

import type {
  Role,
  TabId,
  Project,
  ProjectStatus,
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
import {
  getCompanyProfileApi,
  getStudentProfileApi,
  updateStudentBioApi,
  recalculateStudentProfileApi,
} from './api';
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
  const [studentProfile, setStudentProfile] = useState<StudentProfile>(() => {
    // Восстанавливаем bio / ИИ-рекомендации из localStorage (переживают F5)
    if (typeof window === 'undefined') return INITIAL_STUDENT_PROFILE;
    try {
      const bio = localStorage.getItem('collabhub:student-bio');
      const aiRaw = localStorage.getItem('collabhub:student-ai');
      const ai = aiRaw ? (JSON.parse(aiRaw) as { aiMatch?: number; aiFeedback?: string }) : {};
      return {
        ...INITIAL_STUDENT_PROFILE,
        ...(bio ? { bio } : {}),
        ...(ai.aiMatch !== undefined ? { aiMatch: ai.aiMatch } : {}),
        ...(ai.aiFeedback ? { aiFeedback: ai.aiFeedback } : {}),
      };
    } catch {
      return INITIAL_STUDENT_PROFILE;
    }
  });
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
    const frameId = requestAnimationFrame(() => resetScrollToTop());
    const timerId = setTimeout(() => resetScrollToTop(), 50);
    return () => {
      cancelAnimationFrame(frameId);
      clearTimeout(timerId);
    };
  }, [currentTab]);

  const getRoleTabIndex = (role: Role, tab: TabId): number => {
    if (role === 'student') {
      const studentOrder: TabId[] = ['catalog', 'my-projects', 'chats', 'profile'];
      const idx = studentOrder.indexOf(tab);
      return idx >= 0 ? idx : 0;
    } else {
      const hrOrder: TabId[] = ['hr-dashboard', 'company-profile', 'chats', 'students-catalog', 'catalog'];
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

    // При переключении вкладок закрываем любые открытые модальные окна чатов
    setActiveChatId(null);

    const oldIndex = getRoleTabIndex(currentRole, currentTab);
    const newIndex = getRoleTabIndex(currentRole, newTab);
    const direction = newIndex >= oldIndex ? 'forward' : 'backward';

    resetScrollToTop();

    setTabDirection(direction);
    setExitingTab(currentTab);
    setCurrentTab(newTab);
    setIsTabTransitioning(true);

    requestAnimationFrame(() => {
      resetScrollToTop();
    });

    setTimeout(() => {
      setExitingTab(null);
      setIsTabTransitioning(false);
      resetScrollToTop();
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
      projectStatus: newProjData.projectStatus || 'ACTIVE',
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

  const handleStatusChangeProject = (projectId: number, newStatus: ProjectStatus) => {
    setProjects((prev) =>
      prev.map((p) => (p.id === projectId ? { ...p, projectStatus: newStatus } : p))
    );
    const statusLabels: Record<ProjectStatus, string> = {
      ACTIVE: 'опубликован (ACTIVE)',
      DRAFT: 'переведен в черновики (DRAFT)',
      CLOSED: 'набор закрыт (CLOSED)',
      ARCHIVED: 'перенесен в архив (ARCHIVED)',
    };
    showToast(`Статус проекта изменен: ${statusLabels[newStatus] || newStatus}`);
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

  // Сохранение bio в backend (debounced) — чтобы описание опыта переживало F5
  const bioSaveTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const handleUpdateBio = (bio: string) => {
    setStudentProfile((prev) => ({ ...prev, bio }));
    if (bioSaveTimerRef.current) clearTimeout(bioSaveTimerRef.current);
    bioSaveTimerRef.current = setTimeout(() => {
      const id = studentProfile.id;
      if (id !== undefined && id !== null) {
        void updateStudentBioApi(id, bio);
      }
      // Локальный фолбэк для mock-профиля без UUID в БД
      try {
        localStorage.setItem('collabhub:student-bio', bio);
      } catch {
        /* ignore */
      }
    }, 600);
  };

  // Реальный пересчёт: backend → ai-service (match + GigaChat analyze + embed)
  const handleRecalculateBio = async () => {
    setIsRecalculating(true);
    try {
      const id = studentProfile.id ?? 1;
      const result = await recalculateStudentProfileApi(id, {
        bio: studentProfile.bio,
        skills: studentProfile.skills.map((s) => ({
          name: s.name,
          proficiency_level: s.level,
        })),
      });
      setStudentProfile((prev) => ({
        ...prev,
        bio: result.bio ?? prev.bio,
        aiMatch: Math.round(result.aiMatch),
        aiFeedback: result.aiFeedback,
      }));
      try {
        localStorage.setItem('collabhub:student-bio', result.bio ?? studentProfile.bio);
        localStorage.setItem('collabhub:student-ai', JSON.stringify({
          aiMatch: Math.round(result.aiMatch),
          aiFeedback: result.aiFeedback,
        }));
      } catch {
        /* ignore */
      }
      showToast(
        result.embeddingSaved
          ? 'Профиль пересчитан: match + GigaChat + вектор сохранён'
          : 'Профиль пересчитан через ai-service',
      );
    } catch (err: unknown) {
      console.error('[recalculate] failed:', err);
      showToast('AI-сервис недоступен — попробуйте позже');
    } finally {
      setIsRecalculating(false);
    }
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
      if (path === '/chats' || path.startsWith('/chats/')) {
        const chatMatch = path.match(/^\/chats\/(.+)/);
        if (chatMatch) {
          setActiveChatId(chatMatch[1]);
        }
        setCurrentTab('chats');
        return;
      }

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
            studentProfile={studentProfile}
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
            studentProfile={studentProfile}
            onOpenChat={handleOpenChat}
            onViewCompany={handleViewCompany}
            onNavigateToCatalog={() => handleSwitchTab('catalog')}
          />
        );
      case 'chats':
        return (
          <ChatsPage
            chats={chats}
            applications={applications}
            currentRole={currentRole}
            currentUserId={currentRole === 'student' ? currentStudentId : 'hr-user'}
            currentUserName={currentRole === 'student' ? studentProfile.name : `${companyProfile.name} (HR)`}
            activeChatId={activeChatId}
            onSendMessage={handleSendMessage}
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
            onOpenCreateModal={() => setIsCreateModalOpen(true)}
            onEditProject={(p) => setProjectToEdit(p)}
            onDeleteProject={handleDeleteProject}
            onUpdateProjectStatus={handleStatusChangeProject}
          />
        );
      case 'company-profile':
        return (
          <CompanyProfileTab
            company={companyProfile}
            onOpenEditModal={() => setIsEditCompanyModalOpen(true)}
            onNavigateToDashboard={() => handleSwitchTab('hr-dashboard')}
            onLogout={handleLogout}
          />
        );
      case 'profile':
        return (
          <ProfileTab
            profile={studentProfile}
            projects={projects}
            connections={connections}
            allStudents={MOCK_STUDENTS}
            onUpdateBio={handleUpdateBio}
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
      case 'students-catalog':
        return (
          <StudentsCatalogTab
            students={MOCK_STUDENTS}
            projects={projects}
            companyName={companyProfile.name}
            onViewStudent={handleViewStudent}
            onContactStudent={(student) => {
              showToast(`Приглашение отправлено студенту «${student.name}»`);
            }}
          />
        );
      case 'public-company':
        return (
          <PublicCompanyProfileTab
            company={publicCompany}
            projects={projects}
            studentProfile={studentProfile}
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
            projects={projects}
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
  const { projects, currentRole, setSelectedProjectForModal } = useApp();
  return (
    <CatalogTab
      projects={projects}
      currentRole={currentRole}
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
    setEditingProject,
  } = useApp();

  return (
    <HRDashboardTab
      candidates={candidates}
      allStudents={MOCK_STUDENTS}
      projects={projects}
      companyName={companyProfile.name}
      onApproveCandidate={approveCandidate}
      onContactCandidate={contactCandidate}
      onEditProject={setEditingProject}
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
