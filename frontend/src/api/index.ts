import type { CompanyProfile, StudentProfile } from '../types';
import { MOCK_COMPANIES, MOCK_STUDENTS } from '../data/mockData';

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
  } catch (err: any) {
    // Если ошибка не 404, а сетевая (бэкенд не запущен локально) — используем локальные моки
    if (err.message !== 'Компания не найдена в реестре') {
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
  } catch (err: any) {
    if (err.message !== 'Профиль студента не найден') {
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
