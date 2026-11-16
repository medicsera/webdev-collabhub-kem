import type { Project, SkillItem, StudentProfile } from '../types';

export type SemanticScores = Record<string, number>;

interface CacheEntry {
  score: number;
  /** Фингерпечат входных данных пары — при изменении навыков/требований инвалидируется */
  hash: string;
  updatedAt: number;
}

type CacheStore = Record<string, CacheEntry>;

const STORAGE_KEY = 'collabhub:semantic-match:v1';
/** Ограничение размера кэша (пар), чтобы localStorage не разрастался */
const MAX_ENTRIES = 2000;
const TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 дней

/** Стабильный JSON: ключи объектов сортируются, порядок массивов сохраняется */
function stableStringify(value: unknown): string {
  if (value === null || typeof value !== 'object') {
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) {
    return `[${value.map(stableStringify).join(',')}]`;
  }
  const entries = Object.entries(value as Record<string, unknown>).sort(([a], [b]) =>
    a.localeCompare(b),
  );
  return `{${entries.map(([k, v]) => `${JSON.stringify(k)}:${stableStringify(v)}`).join(',')}}`;
}

/** FNV-1a 32-bit — короткий детерминированный хеш для фингерпринта пары */
function fnv1a(input: string): string {
  let hash = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(36);
}

/** Фингерпечат «навыки студента × требования проекта» */
export function pairHash(
  studentSkills: Array<{ name: string; proficiency_level?: string; level?: string }>,
  projectRequirements: string[],
): string {
  const skills = studentSkills
    .map((s) => ({
      name: s.name.trim().toLowerCase(),
      level: (s.proficiency_level ?? s.level ?? '').toString().toUpperCase(),
    }))
    .sort((a, b) => a.name.localeCompare(b.name) || a.level.localeCompare(b.level));
  const reqs = projectRequirements.map((r) => r.trim().toLowerCase()).sort();
  return fnv1a(stableStringify({ s: skills, r: reqs }));
}

function readStore(): CacheStore {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as CacheStore;
    if (!parsed || typeof parsed !== 'object') return {};
    return parsed;
  } catch {
    return {};
  }
}

function writeStore(store: CacheStore): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch (err) {
    console.warn('[semantic-cache] не удалось записать localStorage:', err);
  }
}

/** Кэшированные счёта для пар, чей хеш совпал с текущими входными данными */
export function loadCachedScores(
  entries: Array<{ key: string; hash: string }>,
): SemanticScores {
  if (entries.length === 0) return {};
  const store = readStore();
  const now = Date.now();
  const scores: SemanticScores = {};
  for (const { key, hash } of entries) {
    const hit = store[key];
    if (hit && hit.hash === hash && now - hit.updatedAt <= TTL_MS) {
      scores[key] = hit.score;
    }
  }
  return scores;
}

/** Сохранить/обновить счёта; вытесняет самые старые при превышении лимита */
export function saveCachedScores(entries: Array<{ key: string; hash: string; score: number }>): void {
  if (entries.length === 0) return;
  const store = readStore();
  const now = Date.now();
  for (const { key, hash, score } of entries) {
    store[key] = { score, hash, updatedAt: now };
  }

  const keys = Object.keys(store);
  if (keys.length > MAX_ENTRIES) {
    keys
      .sort((a, b) => (store[a].updatedAt ?? 0) - (store[b].updatedAt ?? 0))
      .slice(0, keys.length - MAX_ENTRIES)
      .forEach((k) => delete store[k]);
  }
  writeStore(store);
}

/** Полная очистка кэша (например, при смене схемы эмбеддингов) */
export function clearSemanticMatchCache(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

/** Построить пары «студент × проект» с хешами входных данных */
export function buildMatchPairs(
  students: StudentProfile[],
  projects: Project[],
): Array<{
  key: string;
  hash: string;
  studentSkills: Array<{ name: string; proficiency_level: string }>;
  projectRequirements: string[];
}> {
  const list: Array<{
    key: string;
    hash: string;
    studentSkills: Array<{ name: string; proficiency_level: string }>;
    projectRequirements: string[];
  }> = [];

  for (const student of students) {
    const studentSkills = (student.skills ?? []).map((sk: SkillItem) => ({
      name: sk.name,
      proficiency_level: sk.level,
    }));
    if (studentSkills.length === 0) continue;

    for (const project of projects) {
      const requirements =
        project.requiredSkills && project.requiredSkills.length > 0
          ? project.requiredSkills.map((r) => r.name)
          : project.tags;
      if (requirements.length === 0) continue;

      const key = `${String(student.id ?? student.name)}:${String(project.id)}`;
      list.push({
        key,
        hash: pairHash(studentSkills, requirements),
        studentSkills,
        projectRequirements: requirements,
      });
    }
  }
  return list;
}
