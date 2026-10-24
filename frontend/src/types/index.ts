export type Role = 'student' | 'hr';

export type TabId = 'catalog' | 'my-projects' | 'hr-dashboard' | 'profile';

export type ProjectFormat = 'all' | 'ВКР / Диплом' | 'Стажировка' | 'Курсовой проект';

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
  applied: boolean;
}

export interface Candidate {
  id: string;
  name: string;
  group: string;
  project: string;
  match: number;
  stack: string[];
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
  skills: string[];
  bio: string;
  aiMatch: number;
  aiFeedback: string;
}
