export type Role = 'student' | 'hr';

export type TabId =
  | 'catalog'
  | 'my-projects'
  | 'hr-dashboard'
  | 'profile'
  | 'company-profile';

export type ProjectFormat = 'all' | 'ВКР / Диплом' | 'Стажировка' | 'Курсовой проект';

export type SkillLevel = 'BASIC' | 'INTERMEDIATE' | 'ADVANCED';

export const SKILL_LEVEL_NAMES: Record<SkillLevel, string> = {
  BASIC: 'Базовый',
  INTERMEDIATE: 'Уверенный',
  ADVANCED: 'Продвинутый',
};

export interface SkillItem {
  name: string;
  level: SkillLevel;
}

export interface Project {
  id: number;
  index: string;
  title: string;
  company: string;
  department: string;
  type: 'ВКР / Диплом' | 'Стажировка' | 'Курсовой проект';
  match: number;
  teamSize: string;
  desc: string;
  tags: string[];
  requiredSkills: SkillItem[];
  applied: boolean;
}

export interface Candidate {
  id: string;
  name: string;
  group: string;
  project: string;
  match: number;
  stack: (string | SkillItem)[];
  status: 'Новая заявка' | 'На рассмотрении' | 'Принят' | 'Приглашен';
}

export interface StudentProfile {
  name: string;
  group: string;
  year: string;
  university: string;
  specialization: string;
  telegram: string;
  city: string;
  status: string;
  skills: SkillItem[];
  bio: string;
  aiMatch: number;
  aiFeedback: string;
}

export interface CompanyProfile {
  id?: number;
  name: string;
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
}
