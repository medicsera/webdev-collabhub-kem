import { useEffect, useMemo, useState } from 'react';
import type { Project, StudentProfile } from '../types';
import { postSemanticMatchApi } from '../api';

export type SemanticScores = Record<string, number>;
export type SemanticMatchStatus = 'loading' | 'ready' | 'error';

/** Ключ пары «студент ↔ проект»: `${student}:${project}` */
export const semanticKey = (student: StudentProfile, project: Project): string =>
  `${String(student.id ?? student.name)}:${String(project.id)}`;

interface UseSemanticMatchesResult {
  scores: SemanticScores;
  status: SemanticMatchStatus;
  /** Счёт эмбеддингов для конкретной пары; undefined — ещё не рассчитано */
  getScore: (student: StudentProfile, project: Project) => number | undefined;
  /** Лучший счёт студента среди проектов (для режима «все проекты») */
  bestScore: (
    student: StudentProfile,
    projects: Project[],
  ) => { score: number; project: Project } | undefined;
}

/**
 * Семантический матч через ai-service (эмбеддинги MiniLM-L12-v2).
 * Считает батч «студенты × проекты» одним запросом к POST /api/v1/semantic-match.
 * При недоступности AI-сервиса возвращает пустые scores — вызывающий код
 * остаётся на локальной эвристике.
 *
 * Важно: students и projects должны быть стабильными ссылками
 * (useMemo в родителе), иначе запрос будет уходить на каждый рендер.
 */
export function useSemanticMatches(
  students: StudentProfile[],
  projects: Project[],
): UseSemanticMatchesResult {
  const [scores, setScores] = useState<SemanticScores>({});
  const [status, setStatus] = useState<SemanticMatchStatus>('loading');

  const pairs = useMemo(() => {
    const list = [];
    for (const student of students) {
      const studentSkills = student.skills.map((sk) => ({
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
        list.push({
          key: semanticKey(student, project),
          studentSkills,
          projectRequirements: requirements,
        });
      }
    }
    return list;
  }, [students, projects]);

  useEffect(() => {
    if (pairs.length === 0) {
      setScores({});
      setStatus('ready');
      return;
    }

    let cancelled = false;
    setStatus('loading');
    postSemanticMatchApi(pairs)
      .then((next) => {
        if (!cancelled) {
          setScores(next);
          setStatus('ready');
        }
      })
      .catch((err: unknown) => {
        console.warn('[semantic-match] AI-сервис недоступен, используем локальную эвристику', err);
        if (!cancelled) {
          setScores({});
          setStatus('error');
        }
      });

    return () => {
      cancelled = true;
    };
  }, [pairs]);

  return useMemo(() => {
    const getScore = (student: StudentProfile, project: Project): number | undefined =>
      scores[semanticKey(student, project)];

    const bestScore = (student: StudentProfile, projectsList: Project[]) => {
      let best: { score: number; project: Project } | undefined;
      for (const project of projectsList) {
        const score = getScore(student, project);
        if (score !== undefined && (!best || score > best.score)) {
          best = { score, project };
        }
      }
      return best;
    };

    return { scores, status, getScore, bestScore };
  }, [scores, status]);
}
