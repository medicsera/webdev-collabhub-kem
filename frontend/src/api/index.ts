import type { CompanyProfile, StudentProfile, Project, ProjectStatus } from '../types';
import { MOCK_COMPANIES, MOCK_STUDENTS, INITIAL_PROJECTS } from '../data/mockData';
import type { CandidateMatchResult } from '../utils/dbValidation';

const API_BASE_URL =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_URL) ||
  '/api/v1';

/**
 * Получение публичного профиля компании по ID
 */
export async function getCompanyProfileApi(id: number): Promise<CompanyProfile> {
  try {
    const res = await fetch(`${API_BASE_URL}/companies/${id}`, {
      headers: { Accept: 'application/json' },
    });
    if (res.ok) {
      const data = await res.json();
      return data as CompanyProfile;
    }
    if (res.status === 404) {
      throw new Error('Компания не найдена в реестре');
    }
  } catch (err: unknown) {
    const error = err as Error;
    // Если ошибка не 404, а сетевая (бэкенд не запущен локально) — используем локальные моки
    if (error?.message !== 'Компания не найдена в реестре') {
      const mock = MOCK_COMPANIES.find((c) => c.id === id);
      if (mock) return mock;
    }
    throw err;
  }

  const mockFallback = MOCK_COMPANIES.find((c) => c.id === id);
  if (mockFallback) return mockFallback;
  throw new Error('Компания не найдена в реестре');
}

/**
 * Получение полного каталога студентов для работодателя
 */
export async function getAllStudentsApi(): Promise<StudentProfile[]> {
  try {
    const res = await fetch(`${API_BASE_URL}/students`, {
      headers: { Accept: 'application/json' },
    });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        return data as StudentProfile[];
      }
    }
  } catch {
    console.warn('[API notice] using mock students fallback');
  }

  return MOCK_STUDENTS;
}

/**
 * Получение публичного профиля/резюме студента по ID
 */
export async function getStudentProfileApi(id: number): Promise<StudentProfile> {
  try {
    const res = await fetch(`${API_BASE_URL}/students/${id}`, {
      headers: { Accept: 'application/json' },
    });
    if (res.ok) {
      const data = await res.json();
      return data as StudentProfile;
    }
    if (res.status === 404) {
      throw new Error('Профиль студента не найден');
    }
  } catch (err: unknown) {
    const error = err as Error;
    if (error?.message !== 'Профиль студента не найден') {
      if (id >= 1 && id <= MOCK_STUDENTS.length) {
        return MOCK_STUDENTS[id - 1];
      }
    }
    throw err;
  }

  if (id >= 1 && id <= MOCK_STUDENTS.length) {
    return MOCK_STUDENTS[id - 1];
  }
  throw new Error('Профиль студента не найден');
}

/**
 * Получение активных проектов организации (GET /api/v1/organizations/projects?status=ACTIVE)
 */
export async function getOrganizationProjectsApi(status = 'ACTIVE'): Promise<Project[]> {
  try {
    const res = await fetch(`${API_BASE_URL}/organizations/projects?status=${encodeURIComponent(status)}`, {
      headers: { Accept: 'application/json' },
    });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        return data as Project[];
      }
    }
  } catch {
    console.warn('[API notice] using fallback organization projects');
  }

  return INITIAL_PROJECTS.filter((p) => p.company === 'Софт Инжиниринг');
}

/**
 * Получение семантических соответствий кандидатов под конкретный проект
 * (GET /api/v1/organizations/projects/:id/matches)
 */
export async function getProjectMatchesApi(projectId: number): Promise<CandidateMatchResult[]> {
  try {
    const res = await fetch(`${API_BASE_URL}/organizations/projects/${projectId}/matches`, {
      headers: { Accept: 'application/json' },
    });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data)) {
        return data as CandidateMatchResult[];
      }
    }
  } catch {
    console.warn(`[API notice] using client-side calculation for project matches ${projectId}`);
  }

  return [];
}

export interface SemanticMatchPair {
  key: string;
  studentSkills: { name: string; proficiency_level?: string }[];
  projectRequirements: string[];
}

/**
 * Семантический матч через эмбеддинги ai-service (MiniLM-L12-v2).
 * Принимает батч пар «студент ↔ проект», возвращает счёт по каждой паре (0-100).
 * При недоступности AI-сервиса кидает ошибку — вызывающий остаётся на локальной эвристике.
 */
export async function postSemanticMatchApi(pairs: SemanticMatchPair[]): Promise<Record<string, number>> {
  const res = await fetch(`${API_BASE_URL}/semantic-match`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({ pairs }),
  });
  if (!res.ok) {
    throw new Error(`semantic-match failed: ${res.status}`);
  }
  const data = (await res.json()) as { results?: { key: string; matchScore: number }[] };
  const scores: Record<string, number> = {};
  for (const r of data.results ?? []) {
    scores[r.key] = Math.round(r.matchScore);
  }
  return scores;
}

/** Сохранить bio студента (PATCH /api/v1/students/:id) */
export async function updateStudentBioApi(
  id: number | string,
  bio: string,
): Promise<{ id: string; bio: string } | null> {
  try {
    const res = await fetch(`${API_BASE_URL}/students/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({ bio }),
    });
    if (res.ok) {
      return (await res.json()) as { id: string; bio: string };
    }
  } catch (err) {
    console.warn('[API notice] updateStudentBio failed', err);
  }
  return null;
}

export interface RecalculateResult {
  bio: string | null;
  aiMatch: number;
  aiFeedback: string;
  bestProject?: { id: string; title: string };
  embeddingSaved?: boolean;
  persisted?: boolean;
}

/**
 * Пересчёт ИИ-рекомендаций: bio + навыки → backend → ai-service
 * (match лучших проектов + GigaChat analyze + embed).
 */
export async function recalculateStudentProfileApi(
  id: number | string,
  payload: {
    bio: string;
    skills: { name: string; proficiency_level?: string }[];
  },
): Promise<RecalculateResult> {
  const res = await fetch(`${API_BASE_URL}/students/${id}/recalculate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`recalculate failed: ${res.status} ${text}`);
  }
  return (await res.json()) as RecalculateResult;
}

/**
 * Изменение статуса проекта (DRAFT / ACTIVE / CLOSED / ARCHIVED)
 * Поддерживает эндпоинты:
 * - POST /api/v1/organizations/projects/:id/publish
 * - POST /api/v1/organizations/projects/:id/close
 * - POST /api/v1/organizations/projects/:id/archive
 * - PATCH /api/v1/organizations/projects/:id
 */
export async function updateProjectStatusApi(
  projectId: number,
  newStatus: ProjectStatus
): Promise<boolean> {
  try {
    let endpoint = `${API_BASE_URL}/organizations/projects/${projectId}`;
    let method = 'PATCH';
    let body: BodyInit | null = JSON.stringify({ projectStatus: newStatus });

    if (newStatus === 'ACTIVE') {
      endpoint = `${API_BASE_URL}/organizations/projects/${projectId}/publish`;
      method = 'POST';
      body = null;
    } else if (newStatus === 'CLOSED') {
      endpoint = `${API_BASE_URL}/organizations/projects/${projectId}/close`;
      method = 'POST';
      body = null;
    } else if (newStatus === 'ARCHIVED') {
      endpoint = `${API_BASE_URL}/organizations/projects/${projectId}/archive`;
      method = 'POST';
      body = null;
    }

    const res = await fetch(endpoint, {
      method,
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      ...(body ? { body } : {}),
    });

    return res.ok;
  } catch {
    console.warn(`[API notice] using mock status update for project ${projectId} -> ${newStatus}`);
    return true;
  }
}

export interface LlmEvaluationResult {
  verdict: 'RECOMMENDED' | 'CONSIDER' | 'NOT_RECOMMENDED';
  verdictTitle: string;
  pros: string[];
  cons: string[];
  summary: string;
  recommendations: string[];
  coverLetterTip?: string;
  matchScore: number;
}

export interface EvaluateCompetenciesParams {
  studentSkills: Array<{ name: string; level?: string } | string>;
  projectTitle: string;
  projectDescription: string;
  projectRequirements: Array<{ name: string; level?: string } | string>;
  studentBio?: string;
  matchScore?: number;
}

/**
 * Комплексное LLM-сравнение компетенций студента и требований проекта:
 * Возвращает вердикт (стоит ли отправлять), сильные стороны (что хорошо),
 * пробелы (что плохо) и персональные рекомендации от модели.
 */
export async function evaluateCompetenciesWithLlmApi(
  params: EvaluateCompetenciesParams
): Promise<LlmEvaluationResult> {
  const skillNames = params.studentSkills.map((s) => (typeof s === 'string' ? s : s.name));
  const reqNames = params.projectRequirements.map((r) => (typeof r === 'string' ? r : r.name));

  try {
    const res = await fetch(`${API_BASE_URL}/ai/evaluate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        studentSkills: skillNames,
        projectTitle: params.projectTitle,
        projectDescription: params.projectDescription,
        projectRequirements: reqNames,
        studentBio: params.studentBio,
        matchScore: params.matchScore,
      }),
    });

    if (res.ok) {
      const data = (await res.json()) as LlmEvaluationResult;
      return data;
    }
  } catch (err) {
    console.warn('[API notice] evaluateCompetenciesWithLlmApi fetch failed, using smart fallback', err);
  }

  // Клиентский эвристический fallback (надежный оффлайн режим)
  const studentSet = new Set(skillNames.map((s) => s.trim().toLowerCase()));
  const matching = reqNames.filter((r) => studentSet.has(r.trim().toLowerCase()));
  const missing = reqNames.filter((r) => !studentSet.has(r.trim().toLowerCase()));

  const ratio = matching.length / Math.max(1, reqNames.length);
  const score = params.matchScore ?? Math.min(98, Math.max(48, Math.round(48 + ratio * 48)));

  let verdict: 'RECOMMENDED' | 'CONSIDER' | 'NOT_RECOMMENDED';
  let verdictTitle: string;
  let pros: string[] = [];
  let cons: string[] = [];

  if (score >= 75) {
    verdict = 'RECOMMENDED';
    verdictTitle = 'Стоит отправлять заявку';
    pros = [
      `Отличное совпадение стека: подтверждены ${matching.join(', ')}.`,
      'Ваш уровень владения технологиями достаточен для уверенного старта в проекте.',
      'Высокая вероятность приглашения на первичное техническое интервью.',
    ];
    cons = missing.length > 0
      ? [`Перед собеседованием рекомендуется освежить в памяти: ${missing.join(', ')}.`]
      : ['Критичных пробелов в заявленных компетенциях не выявлено.'];
  } else if (score >= 50) {
    verdict = 'CONSIDER';
    verdictTitle = 'Стоит попробовать (есть нюансы)';
    pros = [
      `Закрыта часть базового стека: ${matching.length > 0 ? matching.join(', ') : 'профильные навыки'}.`,
      'Имеются смежные навыки, облегчающие вход в архитектуру проекта.',
    ];
    cons = [
      `Не хватает опыта по требованиям: ${missing.length > 0 ? missing.join(', ') : 'специфический стек'}.`,
      'Потребуется аргументировать готовность быстро изучить недостающие библиотеки.',
    ];
  } else {
    verdict = 'NOT_RECOMMENDED';
    verdictTitle = 'Лучше подтянуть стек перед откликом';
    pros = matching.length > 0
      ? [`Имеются начальные навыки в стеке: ${matching.join(', ')}.`]
      : ['Общая заинтересованность в направлении проекта.'];
    cons = [
      `Отсутствует большая часть ключевых требований: ${missing.join(', ')}.`,
      'Высокий риск сложностей при прохождении скрининга резюме.',
    ];
  }

  const summary = `Семантическое соответствие с проектом «${params.projectTitle}» оценивается в ${score}%. Закрыто ${matching.length} из ${reqNames.length} требований. ${
    verdict === 'RECOMMENDED'
      ? 'Ваш профиль выглядит очень уверенно для данной позиции.'
      : verdict === 'CONSIDER'
      ? 'Рекомендуем откликаться, сопроводив заявку подробным мотивационным письмом.'
      : 'Рекомендуем предварительно ознакомиться с технологиями и добавить учебные проекты.'
  }`;

  const recommendations = missing.length > 0
    ? [
        `Изучить документацию и создать небольшой демонстрационный проект по: ${missing.slice(0, 2).join(', ')}.`,
        'Указать в резюме выполненные лабораторные и курсовые работы по смежной тематике.',
      ]
    : [
        'Подготовить ссылки на релевантный код в GitHub или портфолио для демонстрации куратору.',
        'Сформулировать вопросы по архитектуре проекта к встрече с наставником.',
      ];

  const coverLetterTip = matching.length > 0
    ? `В сопроводительном письме укажите примеры использования ${matching.slice(0, 3).join(', ')}${
        missing.length > 0 ? ` и отметьте, что уже изучаете ${missing[0]}` : ''
      }.`
    : 'Сделайте упор на быструю обучаемость, профильную успеваемость и заинтересованность в компании.';

  return {
    verdict,
    verdictTitle,
    pros,
    cons,
    summary,
    recommendations,
    coverLetterTip,
    matchScore: score,
  };
}
