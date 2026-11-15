import type { ProjectApplication, Role, StudentProfile, Project, SkillItem } from '../types';

/**
 * 1. Валидация курса (таблица `students.year` VARCHAR(50))
 * Ограничение диапазона целых чисел от 1 до 6.
 * Не допускает отрицательные числа, 0 или значения больше 6.
 */
export function clampYear(raw: string | number | undefined): number {
  if (raw === undefined || raw === null || raw === '') return 1;
  const num = typeof raw === 'number' ? raw : parseInt(String(raw), 10);
  if (isNaN(num) || num < 1) return 1;
  if (num > 6) return 6;
  return num;
}

/**
 * Парсер любого входящего курса (например, 'IV Курс', '4 курс', '4') в число 1..6
 */
export function parseYearToNumber(raw: string | number | undefined): number {
  if (raw === undefined || raw === null || raw === '') return 1;
  if (typeof raw === 'number') {
    return clampYear(raw);
  }
  const trimmed = raw.trim();
  // Римские цифры
  if (/^I$/i.test(trimmed) || /^I\s/i.test(trimmed)) return 1;
  if (/^II$/i.test(trimmed) || /^II\s/i.test(trimmed)) return 2;
  if (/^III$/i.test(trimmed) || /^III\s/i.test(trimmed)) return 3;
  if (/^IV$/i.test(trimmed) || /^IV\s/i.test(trimmed)) return 4;
  if (/^V$/i.test(trimmed) || /^V\s/i.test(trimmed)) return 5;
  if (/^VI$/i.test(trimmed) || /^VI\s/i.test(trimmed)) return 6;

  // Поиск первой цифры от 1 до 6
  const match = trimmed.match(/[1-6]/);
  if (match) {
    return parseInt(match[0], 10);
  }
  return 1;
}

/**
 * Форматирование для красивого отображения в карточках и профилях
 */
export function formatYearDisplay(raw: string | number | undefined): string {
  const num = parseYearToNumber(raw);
  return `${num} курс`;
}

/**
 * 2. Сортировка ID пары напарников (таблица `student_connections`)
 * Ограничение БД: CHECK (student_id < partner_id)
 * Меньший ID всегда сторона A (student_id), больший ID — сторона B (partner_id).
 * Поддерживает как числовые ID, так и строковые UUID.
 */
export function orderConnectionPair(
  id1: number | string,
  id2: number | string
): { studentId: number | string; partnerId: number | string } {
  if (id1 === id2) {
    throw new Error('Студент не может добавить в напарники самого себя (student_id must not equal partner_id)');
  }

  // Если оба ID числовые (или строковые числа)
  const num1 = Number(id1);
  const num2 = Number(id2);
  if (!isNaN(num1) && !isNaN(num2)) {
    return num1 < num2
      ? { studentId: id1, partnerId: id2 }
      : { studentId: id2, partnerId: id1 };
  }

  // Для строковых UUID (лексикографическое сравнение по стандарту UUID)
  const str1 = String(id1);
  const str2 = String(id2);
  return str1 < str2
    ? { studentId: id1, partnerId: id2 }
    : { studentId: id2, partnerId: id1 };
}

/**
 * 3. Защита от дублей в заявках (таблицы `applications` + `application_members`)
 * Ограничение БД: UNIQUE(student_id, project_id)
 * Проверяет, участвует ли студент уже в заявке на данный проект (как LEAD или как MEMBER).
 */
export function isStudentInProjectApplication(
  studentId: number | string,
  projectId: number,
  applications: ProjectApplication[]
): boolean {
  const targetId = String(studentId);
  return applications.some((app) => {
    if (app.projectId !== projectId) return false;
    const isLead = String(app.studentId) === targetId;
    const isMember = app.members?.some((m) => String(m.studentId) === targetId);
    return isLead || isMember;
  });
}

/**
 * Проверка возможности подачи заявки студентом (LEAD)
 */
export function canStudentApplyToProject(
  studentId: number | string,
  projectId: number,
  applications: ProjectApplication[]
): { allowed: boolean; reason?: string } {
  if (isStudentInProjectApplication(studentId, projectId, applications)) {
    return {
      allowed: false,
      reason: 'Вы уже состоите в активной заявке на этот проект (ограничение БД: UNIQUE(student_id, project_id))',
    };
  }
  return { allowed: true };
}

/**
 * Проверка возможности добавления напарника (MEMBER) в команду
 */
export function canAddMemberToProjectApplication(
  memberStudentId: number | string,
  projectId: number,
  applications: ProjectApplication[]
): { allowed: boolean; reason?: string } {
  if (isStudentInProjectApplication(memberStudentId, projectId, applications)) {
    return {
      allowed: false,
      reason: 'Студент уже участвует в другой заявке на этот проект (ограничение БД: UNIQUE(student_id, project_id))',
    };
  }
  return { allowed: true };
}

/**
 * 4. Проверка прав доступа к чату отклика (`chats` + `messages`)
 * Доступ имеют:
 * - Компания / HR работодателя
 * - Студент-инициатор (LEAD из `applications.student_id`)
 * - Все участники команды (MEMBER из `application_members`)
 */
export function canUserAccessApplicationChat(
  userId: number | string,
  role: Role,
  application: ProjectApplication
): boolean {
  // Компания всегда имеет доступ к чату по своей заявке
  if (role === 'hr') return true;

  const targetId = String(userId);
  const isLead = String(application.studentId) === targetId;
  const isMember = application.members?.some((m) => String(m.studentId) === targetId);

  return isLead || Boolean(isMember);
}

/**
 * 5. Расчет семантического соответствия кандидата и проекта
 * (REST API: GET /api/organizations/projects/:id/matches)
 */
export interface CandidateMatchResult {
  studentId: number | string;
  projectId: number;
  projectTitle: string;
  matchScore: number;
  matchedSkills: SkillItem[];
  missingSkills: string[];
}

export function calculateStudentProjectMatch(
  student: StudentProfile,
  project: Project
): CandidateMatchResult {
  const projectSkills =
    project.requiredSkills && project.requiredSkills.length > 0
      ? project.requiredSkills
      : project.tags.map((t) => ({ name: t, level: 'INTERMEDIATE' as const }));

  const studentSkillMap = new Map<string, SkillItem>();
  student.skills.forEach((s) => {
    studentSkillMap.set(s.name.toLowerCase(), s);
  });

  const matchedSkills: SkillItem[] = [];
  const missingSkills: string[] = [];

  let totalWeight = 0;
  let earnedWeight = 0;

  projectSkills.forEach((reqSkill) => {
    totalWeight += 1;
    const found = studentSkillMap.get(reqSkill.name.toLowerCase());
    if (found) {
      matchedSkills.push(found);
      const levelMultiplier =
        found.level === 'ADVANCED' ? 1.0 : found.level === 'INTERMEDIATE' ? 0.8 : 0.6;
      earnedWeight += levelMultiplier;
    } else {
      missingSkills.push(reqSkill.name);
    }
  });

  let score = 55;
  if (totalWeight > 0) {
    const ratio = earnedWeight / totalWeight;
    score = Math.round(50 + ratio * 48);
  }

  return {
    studentId: student.id || 0,
    projectId: project.id,
    projectTitle: project.title,
    matchScore: Math.min(98, Math.max(50, score)),
    matchedSkills,
    missingSkills,
  };
}

export function getBestProjectMatchForStudent(
  student: StudentProfile,
  projects: Project[]
): CandidateMatchResult | null {
  if (projects.length === 0) return null;
  let best: CandidateMatchResult | null = null;
  for (const proj of projects) {
    const res = calculateStudentProjectMatch(student, proj);
    if (!best || res.matchScore > best.matchScore) {
      best = res;
    }
  }
  return best;
}
