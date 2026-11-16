import { useEffect, useMemo, useState } from 'react';
import type { Project, StudentProfile } from '../types';
import { postSemanticMatchApi } from '../api';
import {
  buildMatchPairs,
  loadCachedScores,
  saveCachedScores,
  type SemanticScores,
} from '../utils/semanticMatchCache';

export type { SemanticScores };
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
 *
 * Считает батч «студенты × проекты» одним запросом к POST /api/v1/semantic-match.
 * Результаты кэшируются в localStorage: при повторном открытии вкладки счёт
 * берётся из кэша, запрос уходит только для пар, чей хеш входных данных
 * (навыки студента × требования проекта) изменился.
 *
 * Важно: students и projects должны быть стабильными ссылками
 * (useMemo в родителе), иначе эффект будет перезапускаться на каждый рендер.
 */
export function useSemanticMatches(
  students: StudentProfile[],
  projects: Project[],
): UseSemanticMatchesResult {
  const [scores, setScores] = useState<SemanticScores>({});
  const [status, setStatus] = useState<SemanticMatchStatus>('loading');

  const pairs = useMemo(() => buildMatchPairs(students, projects), [students, projects]);

  // Подпись состава пар: эффект перезапускается только при изменении
  // ключей/хешей (т.е. реально изменились навыки или требования), а не при
  // новой ссылке на массив students/projects.
  const pairsSignature = useMemo(
    () => pairs.map((p) => `${p.key}@${p.hash}`).join('|'),
    [pairs],
  );

  useEffect(() => {
    if (pairs.length === 0) {
      setScores({});
      setStatus('ready');
      return;
    }

    let cancelled = false;

    // 1. Кэш: только пары с совпавшим хешем входных данных
    const cached = loadCachedScores(pairs);
    const missing = pairs.filter((p) => cached[p.key] === undefined);

    if (missing.length === 0) {
      // Всё уже посчитано и данные не менялись — без сетевого запроса
      setScores(cached);
      setStatus('ready');
      return;
    }

    // 2. Частичный кэш показываем сразу, недостающее — докачиваем
    setScores(cached);
    setStatus('loading');

    postSemanticMatchApi(missing)
      .then((fresh) => {
        if (cancelled) return;

        const next: SemanticScores = { ...cached, ...fresh };
        const toSave = missing
          .filter((p) => fresh[p.key] !== undefined)
          .map((p) => ({ key: p.key, hash: p.hash, score: fresh[p.key] }));
        saveCachedScores(toSave);

        setScores(next);
        setStatus('ready');
      })
      .catch((err: unknown) => {
        console.warn('[semantic-match] AI-сервис недоступен, используем локальную эвристику', err);
        if (cancelled) return;
        // Кэшированные счёта оставляем; без кэша — пусто → локальная эвристика
        setScores(cached);
        setStatus(Object.keys(cached).length > 0 ? 'ready' : 'error');
      });

    return () => {
      cancelled = true;
    };
    // pairsSignature покрывает changes keys/hashes; pairs нужен для значений внутри
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pairsSignature]);

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
