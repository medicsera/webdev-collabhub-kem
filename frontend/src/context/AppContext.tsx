import React, { createContext, useContext, useState, useEffect, useMemo, type ReactNode } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type {
  Role,
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
} from '../types';
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
} from '../data/mockData';
import { orderConnectionPair } from '../utils/dbValidation';
import type { ApplyModalSubmitData } from '../components/modals/ApplyModal';

interface AppContextType {
  // Аутентификация и роль
  isLoggedIn: boolean;
  currentRole: Role;
  login: (role: Role, phone?: string) => void;
  logout: () => void;
  setRole: (role: Role) => void;

  // Тема оформления
  isDark: boolean;
  toggleTheme: (event?: React.MouseEvent | { clientX: number; clientY: number }) => void;
  themeTransition: 'dawn' | 'sunset' | null;

  // Уведомления
  toastMessage: string | null;
  showToast: (msg: string) => void;

  // Данные (управляемые через TanStack Query)
  projects: Project[];
  candidates: Candidate[];
  studentProfile: StudentProfile;
  companyProfile: CompanyProfile;
  connections: StudentConnection[];
  applications: ProjectApplication[];
  chats: Chat[];
  notifications: AppNotification[];
  myAcceptedFriends: StudentProfile[];

  // Мутации данных
  submitApplication: (data: ApplyModalSubmitData) => { success: boolean; error?: string };
  createProject: (data: Omit<Project, 'id' | 'index' | 'match' | 'applied'>) => Project;
  updateProject: (updated: Project) => void;
  deleteProject: (projectId: number) => void;
  updateProjectStatus: (projectId: number, newStatus: ProjectStatus) => void;
  updateStudentProfile: (updated: StudentProfile) => void;
  updateStudentSkills: (skills: SkillItem[]) => void;
  updateCompanyProfile: (updated: CompanyProfile) => void;
  approveCandidate: (candidateId: string) => void;
  contactCandidate: (candidateName: string) => void;
  sendMessage: (chatId: string, content: string) => void;
  sendFriendRequest: (targetStudentId: number) => void;
  acceptFriendRequest: (connectionId: string) => void;
  rejectFriendRequest: (connectionId: string) => void;
  cancelFriendRequest: (connectionId: string) => void;
  markNotificationAsRead: (notifId: string) => void;
  markAllNotificationsAsRead: () => void;
  recalculateBio: () => void;
  isRecalculating: boolean;

  // Модальные окна быстрого действия
  selectedProjectForModal: Project | null;
  setSelectedProjectForModal: (project: Project | null) => void;
  isEditSkillsModalOpen: boolean;
  setIsEditSkillsModalOpen: (open: boolean) => void;
  isEditStudentProfileModalOpen: boolean;
  setIsEditStudentProfileModalOpen: (open: boolean) => void;
  isEditCompanyModalOpen: boolean;
  setIsEditCompanyModalOpen: (open: boolean) => void;
}

const AppContext = createContext<AppContextType | null>(null);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const queryClient = useQueryClient();

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

  const [isDark, setIsDark] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('theme');
      if (savedTheme) return savedTheme === 'dark';
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [themeTransition, setThemeTransition] = useState<'dawn' | 'sunset' | null>(null);
  const [isRecalculating, setIsRecalculating] = useState(false);

  // Состояния для модальных окон
  const [selectedProjectForModal, setSelectedProjectForModal] = useState<Project | null>(null);
  const [isEditSkillsModalOpen, setIsEditSkillsModalOpen] = useState(false);
  const [isEditStudentProfileModalOpen, setIsEditStudentProfileModalOpen] = useState(false);
  const [isEditCompanyModalOpen, setIsEditCompanyModalOpen] = useState(false);

  // Управление темой оформления
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

  const toggleTheme = (e?: React.MouseEvent | { clientX: number; clientY: number }) => {
    const nextIsDark = !isDark;
    setThemeTransition(nextIsDark ? 'sunset' : 'dawn');
    setTimeout(() => setThemeTransition(null), 600);

    if (
      e &&
      'clientX' in e &&
      typeof document !== 'undefined' &&
      'startViewTransition' in document &&
      !window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ) {
      const x = e.clientX;
      const y = e.clientY;
      const maxRadius = Math.hypot(
        Math.max(x, window.innerWidth - x),
        Math.max(y, window.innerHeight - y)
      );
      const transition = (document as unknown as { startViewTransition: (cb: () => void) => { ready: Promise<void> } }).startViewTransition(() => {
        setIsDark(nextIsDark);
      });
      transition.ready.then(() => {
        document.documentElement.animate(
          {
            clipPath: [
              `circle(0px at ${x}px ${y}px)`,
              `circle(${maxRadius}px at ${x}px ${y}px)`,
            ],
          },
          {
            duration: 500,
            easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
            pseudoElement: '::view-transition-new(root)',
          }
        );
      });
      return;
    }

    const updateDOM = () => {
      setIsDark(nextIsDark);
    };

    if (typeof document !== 'undefined' && 'startViewTransition' in document) {
      (document as unknown as { startViewTransition: (cb: () => void) => void }).startViewTransition(updateDOM);
    } else {
      updateDOM();
    }
  };

  const login = (role: Role, _phone?: string) => {
    setCurrentRole(role);
    setIsLoggedIn(true);
    localStorage.setItem('isLoggedIn', 'true');
    localStorage.setItem('currentRole', role);
    if (role === 'student') {
      showToast('Добро пожаловать! Вы вошли как Студент');
    } else {
      showToast('Добро пожаловать! Вы вошли как Индустриальный партнер');
    }
  };

  const logout = () => {
    setIsLoggedIn(false);
    localStorage.removeItem('isLoggedIn');
    showToast('Вы вышли из учетной записи');
  };

  const setRole = (role: Role) => {
    setCurrentRole(role);
    localStorage.setItem('currentRole', role);
    if (role === 'student') {
      showToast('Включен режим студента');
    } else {
      showToast('Включен режим компании (Софт Инжиниринг)');
    }
  };

  // --- TanStack Queries ---
  const { data: projects = INITIAL_PROJECTS } = useQuery<Project[]>({
    queryKey: ['projects'],
    queryFn: () => INITIAL_PROJECTS,
    staleTime: Infinity,
  });

  const { data: candidates = INITIAL_CANDIDATES } = useQuery<Candidate[]>({
    queryKey: ['candidates'],
    queryFn: () => INITIAL_CANDIDATES,
    staleTime: Infinity,
  });

  const { data: studentProfile = INITIAL_STUDENT_PROFILE } = useQuery<StudentProfile>({
    queryKey: ['studentProfile'],
    queryFn: () => INITIAL_STUDENT_PROFILE,
    staleTime: Infinity,
  });

  const { data: companyProfile = INITIAL_COMPANY_PROFILE } = useQuery<CompanyProfile>({
    queryKey: ['companyProfile'],
    queryFn: () => INITIAL_COMPANY_PROFILE,
    staleTime: Infinity,
  });

  const { data: connections = INITIAL_CONNECTIONS } = useQuery<StudentConnection[]>({
    queryKey: ['connections'],
    queryFn: () => INITIAL_CONNECTIONS,
    staleTime: Infinity,
  });

  const { data: applications = INITIAL_APPLICATIONS } = useQuery<ProjectApplication[]>({
    queryKey: ['applications'],
    queryFn: () => INITIAL_APPLICATIONS,
    staleTime: Infinity,
  });

  const { data: chats = INITIAL_CHATS } = useQuery<Chat[]>({
    queryKey: ['chats'],
    queryFn: () => INITIAL_CHATS,
    staleTime: Infinity,
  });

  const { data: notifications = INITIAL_NOTIFICATIONS } = useQuery<AppNotification[]>({
    queryKey: ['notifications'],
    queryFn: () => INITIAL_NOTIFICATIONS,
    staleTime: Infinity,
  });

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

  // --- Мутации данных (с инвалидацией кэша TanStack Query) ---

  const submitApplicationMutation = useMutation({
    mutationFn: async (data: ApplyModalSubmitData) => {
      const project = projects.find((p) => p.id === data.projectId);
      if (!project) throw new Error('Проект не найден');

      const alreadyApplied = applications.some(
        (app) =>
          app.projectId === data.projectId &&
          (Number(app.studentId) === currentStudentId ||
            app.members?.some((m) => Number(m.studentId) === currentStudentId))
      );

      if (alreadyApplied) {
        throw new Error('Вы уже участвуете в заявке на этот проект (ограничение БД: UNIQUE)');
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

      const newNotif: AppNotification = {
        id: `notif-${Date.now()}`,
        userId: currentStudentId,
        type: 'APPLICATION_STATUS_CHANGED',
        title: 'Заявка отправлена',
        body: `Ваша ${data.isTeam ? 'командная ' : ''}заявка на проект «${project.title}» (${project.company}) успешно зарегистрирована со статусом «Новая заявка».`,
        createdAt: new Date().toISOString(),
        isRead: false,
      };

      return { newApplication, newChat, newCandidate, newNotif, projectId: data.projectId, isTeam: data.isTeam, membersCount: members.length };
    },
    onSuccess: ({ newApplication, newChat, newCandidate, newNotif, projectId, isTeam, membersCount }) => {
      queryClient.setQueryData<ProjectApplication[]>(['applications'], (prev = []) => [newApplication, ...prev]);
      queryClient.setQueryData<Chat[]>(['chats'], (prev = []) => [newChat, ...prev]);
      queryClient.setQueryData<Candidate[]>(['candidates'], (prev = []) => [newCandidate, ...prev]);
      queryClient.setQueryData<AppNotification[]>(['notifications'], (prev = []) => [newNotif, ...prev]);
      queryClient.setQueryData<Project[]>(['projects'], (prev = []) =>
        prev.map((p) => (p.id === projectId ? { ...p, applied: true } : p))
      );
      queryClient.invalidateQueries({ queryKey: ['applications'] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['chats'] });
      showToast(isTeam ? `Командная заявка (${membersCount} чел.) успешно отправлена!` : 'Заявка успешно отправлена в компанию');
    },
    onError: (err: Error) => {
      showToast(err.message || 'Ошибка при отправке заявки');
    },
  });

  const submitApplication = (data: ApplyModalSubmitData) => {
    try {
      submitApplicationMutation.mutate(data);
      setSelectedProjectForModal(null);
      return { success: true };
    } catch (e) {
      return { success: false, error: (e as Error).message };
    }
  };

  const createProjectMutation = useMutation({
    mutationFn: async (newProjData: Omit<Project, 'id' | 'index' | 'match' | 'applied'>) => {
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
      return newProject;
    },
    onSuccess: (newProject) => {
      queryClient.setQueryData<Project[]>(['projects'], (prev = []) => [newProject, ...prev]);
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      showToast('Проект добавлен в каталог и реестр компании');
    },
  });

  const createProject = (newProjData: Omit<Project, 'id' | 'index' | 'match' | 'applied'>): Project => {
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
    createProjectMutation.mutate(newProjData);
    return newProject;
  };

  const updateProjectMutation = useMutation({
    mutationFn: async (updated: Project) => updated,
    onSuccess: (updated) => {
      queryClient.setQueryData<Project[]>(['projects'], (prev = []) =>
        prev.map((p) => (p.id === updated.id ? updated : p))
      );
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      showToast(`Проект «${updated.title}» успешно обновлен`);
    },
  });

  const updateProject = (updated: Project) => {
    updateProjectMutation.mutate(updated);
  };

  const deleteProjectMutation = useMutation({
    mutationFn: async (projectId: number) => projectId,
    onSuccess: (projectId) => {
      queryClient.setQueryData<Project[]>(['projects'], (prev = []) =>
        prev.filter((p) => p.id !== projectId)
      );
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      showToast('Проект удален из базы данных');
    },
  });

  const deleteProject = (projectId: number) => {
    deleteProjectMutation.mutate(projectId);
  };

  const updateProjectStatus = (projectId: number, newStatus: ProjectStatus) => {
    queryClient.setQueryData<Project[]>(['projects'], (prev = []) =>
      prev.map((p) => (p.id === projectId ? { ...p, projectStatus: newStatus } : p))
    );
    queryClient.invalidateQueries({ queryKey: ['projects'] });
    const statusLabels: Record<ProjectStatus, string> = {
      ACTIVE: 'опубликован (ACTIVE)',
      DRAFT: 'переведен в черновики (DRAFT)',
      CLOSED: 'набор закрыт (CLOSED)',
      ARCHIVED: 'перенесен в архив (ARCHIVED)',
    };
    showToast(`Статус проекта изменен: ${statusLabels[newStatus] || newStatus}`);
  };

  const updateStudentProfile = (updated: StudentProfile) => {
    queryClient.setQueryData<StudentProfile>(['studentProfile'], updated);
    queryClient.invalidateQueries({ queryKey: ['studentProfile'] });
    showToast('Профиль студента и подтвержденные навыки сохранены');
  };

  const updateStudentSkills = (updatedSkills: SkillItem[]) => {
    queryClient.setQueryData<StudentProfile>(['studentProfile'], (prev) =>
      prev ? { ...prev, skills: updatedSkills } : INITIAL_STUDENT_PROFILE
    );
    queryClient.invalidateQueries({ queryKey: ['studentProfile'] });
    showToast('Технологический стек и навыки успешно обновлены');
  };

  const updateCompanyProfile = (updated: CompanyProfile) => {
    queryClient.setQueryData<CompanyProfile>(['companyProfile'], updated);
    queryClient.invalidateQueries({ queryKey: ['companyProfile'] });
    showToast('Информация о компании успешно обновлена');
  };

  const approveCandidate = (candidateId: string) => {
    const candidate = candidates.find((c) => c.id === candidateId);
    queryClient.setQueryData<Candidate[]>(['candidates'], (prev = []) =>
      prev.map((c) => (c.id === candidateId ? { ...c, status: 'Приглашен' } : c))
    );
    queryClient.invalidateQueries({ queryKey: ['candidates'] });
    if (candidate) {
      showToast(`Студент «${candidate.name}» приглашен в проект`);
    }
  };

  const contactCandidate = (candidateName: string) => {
    showToast(`Сообщение отправлено студенту «${candidateName}»`);
  };

  const sendMessage = (chatId: string, content: string) => {
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

    queryClient.setQueryData<Chat[]>(['chats'], (prev = []) =>
      prev.map((chat) =>
        chat.id === chatId ? { ...chat, messages: [...chat.messages, newMessage] } : chat
      )
    );
    queryClient.invalidateQueries({ queryKey: ['chats'] });
  };

  const sendFriendRequest = (targetStudentId: number) => {
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

    queryClient.setQueryData<StudentConnection[]>(['connections'], (prev = []) => [...prev, newConnection]);
    queryClient.invalidateQueries({ queryKey: ['connections'] });
    showToast(`Заявка в напарники отправлена студенту «${targetStudent?.name || targetStudentId}»`);
  };

  const acceptFriendRequest = (connectionId: string) => {
    const conn = connections.find((c) => c.id === connectionId);
    queryClient.setQueryData<StudentConnection[]>(['connections'], (prev = []) =>
      prev.map((c) =>
        c.id === connectionId ? { ...c, status: 'ACCEPTED', respondedAt: new Date().toISOString() } : c
      )
    );

    if (conn) {
      const partnerId =
        Number(conn.studentId) === currentStudentId ? Number(conn.partnerId) : Number(conn.studentId);
      const partner = MOCK_STUDENTS.find((s) => Number(s.id) === partnerId);

      const newNotif: AppNotification = {
        id: `notif-${Date.now()}`,
        userId: currentStudentId,
        type: 'FRIEND_ACCEPTED',
        title: 'Заявка в напарники подтверждена',
        body: `Вы и ${partner?.name || 'студент'} теперь напарники и можете совместно подавать заявки на проекты.`,
        createdAt: new Date().toISOString(),
        isRead: false,
      };
      queryClient.setQueryData<AppNotification[]>(['notifications'], (prev = []) => [newNotif, ...prev]);
    }
    queryClient.invalidateQueries({ queryKey: ['connections'] });
    queryClient.invalidateQueries({ queryKey: ['notifications'] });
    showToast('Заявка принята! Теперь вы напарники для командных проектов');
  };

  const rejectFriendRequest = (connectionId: string) => {
    queryClient.setQueryData<StudentConnection[]>(['connections'], (prev = []) =>
      prev.map((c) =>
        c.id === connectionId ? { ...c, status: 'REJECTED', respondedAt: new Date().toISOString() } : c
      )
    );
    queryClient.invalidateQueries({ queryKey: ['connections'] });
    showToast('Заявка в напарники отклонена');
  };

  const cancelFriendRequest = (connectionId: string) => {
    queryClient.setQueryData<StudentConnection[]>(['connections'], (prev = []) =>
      prev.filter((c) => c.id !== connectionId)
    );
    queryClient.invalidateQueries({ queryKey: ['connections'] });
    showToast('Исходящий запрос в напарники отменен');
  };

  const markNotificationAsRead = (notifId: string) => {
    queryClient.setQueryData<AppNotification[]>(['notifications'], (prev = []) =>
      prev.map((n) => (n.id === notifId ? { ...n, isRead: true } : n))
    );
  };

  const markAllNotificationsAsRead = () => {
    queryClient.setQueryData<AppNotification[]>(['notifications'], (prev = []) =>
      prev.map((n) => ({ ...n, isRead: true }))
    );
    showToast('Все уведомления отмечены как прочитанные');
  };

  const recalculateBio = () => {
    setIsRecalculating(true);
    setTimeout(() => {
      setIsRecalculating(false);
      queryClient.setQueryData<StudentProfile>(['studentProfile'], (prev) =>
        prev
          ? {
              ...prev,
              aiMatch: 97,
              aiFeedback:
                'Анализ обновленного профиля: Векторный энкодер MiniLM-L12-v2 и GigaChat выявили высокую согласованность стека с задачами проектирования архитектуры, распределенных баз данных и веб-платформ. Рекомендуем обратить внимание на новые темы от Софт Инжиниринг и Goodline.',
            }
          : INITIAL_STUDENT_PROFILE
      );
      queryClient.invalidateQueries({ queryKey: ['studentProfile'] });
      showToast('Векторный профиль компетенций успешно пересчитан!');
    }, 1100);
  };

  const value = {
    isLoggedIn,
    currentRole,
    login,
    logout,
    setRole,
    isDark,
    toggleTheme,
    themeTransition,
    toastMessage,
    showToast,
    projects,
    candidates,
    studentProfile,
    companyProfile,
    connections,
    applications,
    chats,
    notifications,
    myAcceptedFriends,
    submitApplication,
    createProject,
    updateProject,
    deleteProject,
    updateProjectStatus,
    updateStudentProfile,
    updateStudentSkills,
    updateCompanyProfile,
    approveCandidate,
    contactCandidate,
    sendMessage,
    sendFriendRequest,
    acceptFriendRequest,
    rejectFriendRequest,
    cancelFriendRequest,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    recalculateBio,
    isRecalculating,
    selectedProjectForModal,
    setSelectedProjectForModal,
    isEditSkillsModalOpen,
    setIsEditSkillsModalOpen,
    isEditStudentProfileModalOpen,
    setIsEditStudentProfileModalOpen,
    isEditCompanyModalOpen,
    setIsEditCompanyModalOpen,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

// eslint-disable-next-line react-refresh/only-export-components
export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
