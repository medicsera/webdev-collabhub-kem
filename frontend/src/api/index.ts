import type { CompanyProfile, StudentProfile, Project } from '../types';
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
