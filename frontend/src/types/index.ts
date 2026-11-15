export type Role = 'student' | 'hr';

export type TabId =
  | 'catalog'
  | 'my-projects'
  | 'hr-dashboard'
  | 'profile'
  | 'company-profile'
  | 'public-company'
  | 'public-student'
  | 'students-catalog'
  | 'chats';

export type ProjectFormat = 'all' | 'ВКР / Диплом' | 'Стажировка' | 'Курсовой проект';

export type SkillLevel = 'BASIC' | 'INTERMEDIATE' | 'ADVANCED';

export const SKILL_LEVEL_NAMES: Record<SkillLevel, string> = {
  BASIC: 'Базовый',
  INTERMEDIATE: 'Уверенный',
  ADVANCED: 'Продвинутый',
};

export interface SkillItem {
  id?: string | number;
  name: string;
  level: SkillLevel;
  category?: 'HARD' | 'SOFT' | 'LANGUAGE' | 'TOOL';
}

// 9. portfolio_items — Опыт и проекты студента
export interface PortfolioItem {
  id: string;
  studentId?: string | number;
  title: string;
  description: string;
  role: string;
  technologies: string[];
  url?: string;
  startedAt?: string;
  finishedAt?: string;
}

// 8. resumes — Резюме студента
export interface ResumeItem {
  id: string;
  studentId?: string | number;
  fileName: string;
  fileUrl?: string;
  mimeType?: string;
  parsedText?: string;
  isPrimary: boolean;
  createdAt: string;
}

// 2. students — Профиль студента
export interface StudentProfile {
  id?: number;
  userId?: string;
  name: string; // ФИО (first_name + last_name)
  firstName?: string;
  lastName?: string;
  group: string; // university_group
  year: string; // Число курса (1..6) строкой
  university: string;
  specialization: string;
  telegram: string;
  city: string;
  phone?: string;
  status: string;
  skills: SkillItem[];
  portfolio?: PortfolioItem[];
  resumes?: ResumeItem[];
  bio: string;
  aiMatch: number;
  aiFeedback: string;
  avatarUrl?: string;
}

// 10. student_connections — Друзья / напарники
export type ConnectionStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'CANCELLED';

export interface StudentConnection {
  id: string;
  studentId: number | string; // Меньший ID (student_id < partner_id)
  partnerId: number | string; // Больший ID
  status: ConnectionStatus;
  requestedBy: number | string; // Кто инициировал заявку
  createdAt: string;
  respondedAt?: string;
}

// 3. organizations — Корпоративный профиль
export type VerificationStatus = 'PENDING' | 'VERIFIED' | 'REJECTED';

export interface CompanyProfile {
  id?: number | string;
  userId?: string;
  name: string; // company_name
  department: string;
  industry: string;
  city: string;
  address: string;
  website: string;
  contactPerson: string;
  contactRole: string;
  contactTelegram: string;
  contactEmail: string;
  description: string;
  benefits: string[];
  avatarUrl?: string;
  verificationStatus?: VerificationStatus;
  verificationNote?: string;
}

// 11. projects — Проектные задачи / стажировки
export type ProjectTypeEnum = 'INTERNSHIP' | 'VKR' | 'COURSE_PROJECT' | 'COMMERCIAL' | 'OPEN_SOURCE';
export type ProjectDifficulty = 'JUNIOR' | 'MIDDLE' | 'SENIOR';
export type ProjectEmploymentType = 'FULL_TIME' | 'PART_TIME' | 'PROJECT' | 'VOLUNTEER' | 'UNPAID_INTERNSHIP';
export type ProjectStatus = 'DRAFT' | 'ACTIVE' | 'CLOSED' | 'ARCHIVED';

export interface Project {
  id: number;
  index: string;
  title: string;
  company: string;
  companyId?: number;
  department: string;
  type: 'ВКР / Диплом' | 'Стажировка' | 'Курсовой проект';
  match: number;
  teamSize: string;
  desc: string;
  tags: string[];
  requiredSkills: SkillItem[];
  applied: boolean;
  // Дополнительные поля по схеме БД
  expectedResults?: string;
  conditions?: string;
  difficulty?: ProjectDifficulty;
  employmentType?: ProjectEmploymentType;
  projectStatus?: ProjectStatus;
  city?: string;
  isRemote?: boolean;
  deadline?: string;
}

// 13. application_members — Состав команды отклика
export type ApplicationMemberRole = 'LEAD' | 'MEMBER';

export interface ApplicationMember {
  studentId: number | string;
  studentName: string;
  studentGroup?: string;
  avatarUrl?: string;
  role: ApplicationMemberRole;
  joinedAt: string;
}

// 12. applications — Отклики на проекты
export type ApplicationStatus = 'PENDING' | 'REVIEWING' | 'INTERVIEW' | 'ACCEPTED' | 'REJECTED';

export interface ProjectApplication {
  id: string;
  projectId: number;
  studentId: number | string; // LEAD
  isTeam: boolean;
  status: ApplicationStatus;
  coverLetter?: string;
  members: ApplicationMember[];
  createdAt: string;
  updatedAt?: string;
  chatId: string;
}

// 15. messages & 14. chats — Чат по отклику
export interface ChatMessage {
  id: string;
  chatId: string;
  senderId: string | number;
  senderName: string;
  senderRole: 'student' | 'hr';
  content: string;
  isRead: boolean;
  createdAt: string;
}

export interface Chat {
  id: string;
  applicationId: string;
  projectId: number;
  projectTitle: string;
  companyName: string;
  studentName?: string;
  messages: ChatMessage[];
}

// 16. notifications — Уведомления
export type NotificationType =
  | 'APPLICATION_STATUS_CHANGED'
  | 'NEW_APPLICATION'
  | 'INTERVIEW_INVITE'
  | 'FRIEND_REQUEST'
  | 'FRIEND_ACCEPTED'
  | 'SYSTEM';

export interface AppNotification {
  id: string;
  userId: string | number;
  type: NotificationType;
  title: string;
  body: string;
  link?: string;
  isRead: boolean;
  createdAt: string;
}

export interface Candidate {
  id: string;
  studentId?: number;
  name: string;
  group: string;
  project: string;
  match: number;
  stack: (string | SkillItem)[];
  status: 'Новая заявка' | 'На рассмотрении' | 'Принят' | 'Приглашен';
  avatarUrl?: string;
  applicationId?: string;
  isTeam?: boolean;
  teamMembers?: ApplicationMember[];
  coverLetter?: string;
}
