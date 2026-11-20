import React, { useMemo, useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  Users,
  UserCheck,
  AlertTriangle,
  Crown,
  Check,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Lightbulb,
  RotateCw,
} from 'lucide-react';
import type { Project, StudentProfile, ProjectApplication } from '../../types';
import { SkillBadge } from '../SkillBadge';
import { SemanticMatchBadge } from '../SemanticMatchBadge';
import { formatYearDisplay } from '../../utils/dbValidation';
import { canStudentApplyToProject, canAddMemberToProjectApplication } from '../../utils/dbValidation';
import { useBodyScrollLock } from '../../hooks/useBodyScrollLock';
import { useSemanticMatches } from '../../hooks/useSemanticMatches';
import { evaluateCompetenciesWithLlmApi, type LlmEvaluationResult } from '../../api';

export interface ApplyModalSubmitData {
  projectId: number;
  coverLetter: string;
  isTeam: boolean;
  memberStudentIds: number[];
}

interface ApplyModalProps {
  project: Project | null;
  currentStudent: StudentProfile;
  friends?: StudentProfile[];
  applications?: ProjectApplication[];
  onClose: () => void;
  onSubmit: (data: ApplyModalSubmitData) => void;
  onViewCompany?: (companyId: number, companyName: string) => void;
}

export const ApplyModal: React.FC<ApplyModalProps> = ({
  project,
  currentStudent,
  friends = [],
  applications = [],
  onClose,
  onSubmit,
  onViewCompany,
}) => {
  const [coverLetter, setCoverLetter] = useState('');
  const [isTeam, setIsTeam] = useState(false);
  const [selectedFriendIds, setSelectedFriendIds] = useState<number[]>([]);
  const [llmEvaluation, setLlmEvaluation] = useState<LlmEvaluationResult | null>(null);
  const [isLoadingLlm, setIsLoadingLlm] = useState(false);
  const [llmError, setLlmError] = useState<string | null>(null);

  useEffect(() => {
    setLlmEvaluation(null);
    setIsLoadingLlm(false);
    setLlmError(null);
  }, [project?.id]);

  useBodyScrollLock(Boolean(project));
  // Векторный матч «текущий студент ↔ этот проект»
  const matchSubject = useMemo(() => [currentStudent], [currentStudent]);
  const matchList = useMemo(() => (project ? [project] : []), [project]);
  const { getScore, status: semanticStatus } = useSemanticMatches(matchSubject, matchList);

  if (!project) return null;
  if (typeof document === 'undefined') return null;

  const aiScore = getScore(currentStudent, project);
  const matchScore = aiScore ?? project.match;
  const aiPowered = aiScore !== undefined;

  const currentStudentId = Number(currentStudent.id || 1);

  // Проверка: уже подавал ли текущий студент заявку на этот проект (UNIQUE(student_id, project_id))
  const applyCheck = canStudentApplyToProject(currentStudentId, project.id, applications);
  const alreadyAppliedByMe = !applyCheck.allowed;

  const toggleFriend = (friendId: number) => {
    // Нельзя выбрать друга, если он уже участвует в заявке на этот проект
    const memberCheck = canAddMemberToProjectApplication(friendId, project.id, applications);
    if (!memberCheck.allowed) return;

    setSelectedFriendIds((prev) =>
      prev.includes(friendId) ? prev.filter((id) => id !== friendId) : [...prev, friendId]
    );
  };

  const handleRunLlmEvaluation = async () => {
    if (!project) return;
    setIsLoadingLlm(true);
    setLlmError(null);
    try {
      const result = await evaluateCompetenciesWithLlmApi({
        studentSkills: currentStudent.skills,
        projectTitle: project.title,
        projectDescription: project.desc,
        projectRequirements:
          project.requiredSkills && project.requiredSkills.length > 0
            ? project.requiredSkills
            : project.tags,
        studentBio: currentStudent.bio,
        matchScore,
      });
      setLlmEvaluation(result);
    } catch (err: unknown) {
      const error = err as Error;
      setLlmError(error.message || 'Не удалось получить оценку компетенций от модели');
    } finally {
      setIsLoadingLlm(false);
    }
  };

  const handleApplyTipToCoverLetter = () => {
    if (!llmEvaluation?.coverLetterTip) return;
    setCoverLetter((prev) => {
      const tip = llmEvaluation.coverLetterTip!;
      if (!prev.trim()) {
        return tip;
      }
      return `${prev}\n\n${tip}`;
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (alreadyAppliedByMe) return;

    onSubmit({
      projectId: project.id,
      coverLetter,
      isTeam,
      memberStudentIds: isTeam ? selectedFriendIds : [],
    });
    setCoverLetter('');
    setIsTeam(false);
    setSelectedFriendIds([]);
  };

  const skillsToDisplay =
    project.requiredSkills && project.requiredSkills.length > 0
      ? project.requiredSkills
      : project.tags.map((t) => ({ name: t, level: 'INTERMEDIATE' as const }));

  return createPortal(
    <div
      className="fixed inset-0 z-50 bg-ink/75 backdrop-blur-md modal-backdrop-animate flex justify-center items-center overflow-y-auto p-3 sm:p-5"
      onClick={onClose}
    >
      <div
        className="relative bg-paper-card dark:bg-paper-darkCard border-2 border-ink dark:border-paper-darkBorder max-w-xl w-full modal-content-animate flex flex-col max-h-[calc(100vh-2rem)] sm:max-h-[calc(100vh-3.5rem)] my-auto overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header — зафиксирован */}
        <div className="shrink-0 flex items-start justify-between gap-4 border-b border-paper-border dark:border-paper-darkBorder px-5 sm:px-7 py-4 bg-paper-card dark:bg-paper-darkCard">
          <div className="space-y-1.5 pr-2">
            <div className="flex flex-wrap items-center gap-2">
              <span
                id="modal-company"
                className="text-[11px] font-mono uppercase tracking-widest text-oxblood dark:text-oxblood-light font-medium flex items-center gap-1.5 flex-wrap"
              >
                <span>{project.index} •</span>
                {onViewCompany && project.companyId ? (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onViewCompany(project.companyId!, project.company);
                    }}
                    className="flex items-center gap-1.5 hover:underline cursor-pointer group"
                    title={`Посмотреть профиль компании «${project.company}»`}
                  >
                    <span className="w-4 h-4 border border-oxblood/40 dark:border-oxblood-light/40 group-hover:border-oxblood flex items-center justify-center text-[9px] font-bold bg-paper-muted dark:bg-paper-dark">
                      {project.company.slice(0, 1)}
                    </span>
                    <span>{project.company}</span>
                  </button>
                ) : (
                  <span>{project.company}</span>
                )}
                <span>• {project.type}</span>
              </span>
              <SemanticMatchBadge
                score={matchScore}
                size="sm"
                aiPowered={aiPowered}
                pending={semanticStatus === 'loading' && !aiPowered}
              />
              {llmEvaluation && (
                <span
                  className={`text-[10px] font-mono px-2 py-0.5 border flex items-center gap-1 font-semibold ${
                    llmEvaluation.verdict === 'RECOMMENDED'
                      ? 'border-emerald-600 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300'
                      : llmEvaluation.verdict === 'CONSIDER'
                      ? 'border-amber-600 bg-amber-500/10 text-amber-800 dark:text-amber-300'
                      : 'border-red-600 bg-red-500/10 text-red-800 dark:text-red-300'
                  }`}
                  title={llmEvaluation.verdictTitle}
                >
                  <Sparkles className="w-3 h-3" />
                  <span>
                    LLM:{' '}
                    {llmEvaluation.verdict === 'RECOMMENDED'
                      ? 'Стоит подавать'
                      : llmEvaluation.verdict === 'CONSIDER'
                      ? 'Есть нюансы'
                      : 'Не рекомендуется'}
                  </span>
                </span>
              )}
            </div>
            <h3
              id="modal-title"
              className="text-xl sm:text-2xl font-semibold leading-snug text-ink dark:text-ink-light"
            >
              {project.title}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-ink-muted hover:text-ink dark:hover:text-white transition-colors cursor-pointer shrink-0"
            title="Закрыть"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body & Form */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0 overflow-hidden">
          <div className="flex-1 overflow-y-auto px-5 sm:px-7 py-5 space-y-5 text-sm overscroll-contain">
            {/* Ограничение: если уже подана заявка */}
            {alreadyAppliedByMe && (
              <div className="p-3.5 bg-oxblood/10 border border-oxblood text-oxblood dark:text-oxblood-light flex items-center gap-2.5 text-xs font-mono">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>
                  Вы (или ваша команда) уже подали заявку на этот проект. По правилам базы данных
                  (UNIQUE: student_id + project_id) повторный отклик не допускается.
                </span>
              </div>
            )}

            {/* Description */}
            <p
              id="modal-desc"
              className="text-sm text-ink-muted dark:text-stone-300 leading-relaxed font-normal"
            >
              {project.desc}
            </p>

            {/* Required skills with levels */}
            <div>
              <div className="text-[10px] font-mono uppercase tracking-widest text-ink-muted dark:text-stone-400 mb-2">
                Требуемый технологический стек и уровень компетенций:
              </div>
              <div id="modal-tags" className="flex flex-wrap gap-2">
                {skillsToDisplay.map((skill) => (
                  <SkillBadge key={typeof skill === 'string' ? skill : skill.name} skill={skill} />
                ))}
              </div>
            </div>

            {/* ИИ-экспертиза компетенций (LLM GigaChat): Что хорошо, что плохо, стоит ли отправлять */}
            <div className="border border-paper-border dark:border-paper-darkBorder bg-paper-light/50 dark:bg-stone-900/60 p-4 space-y-3.5 transition-all">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-full bg-oxblood/10 dark:bg-oxblood-light/10 text-oxblood dark:text-oxblood-light flex items-center justify-center font-bold shrink-0">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-mono uppercase tracking-wider font-bold text-ink dark:text-ink-light flex items-center gap-2">
                      <span>Сравнение компетенций через ИИ (LLM GigaChat)</span>
                    </h4>
                    <p className="text-[10px] text-ink-muted dark:text-stone-400">
                      Качественная экспертиза: сильные стороны, зоны риска и вердикт модели о подаче заявки
                    </p>
                  </div>
                </div>

                {/* Кнопка запуска или повтора */}
                {!llmEvaluation && !isLoadingLlm && (
                  <button
                    type="button"
                    onClick={handleRunLlmEvaluation}
                    className="btn-editorial px-3.5 py-1.5 text-[11px] font-mono uppercase tracking-wider bg-oxblood text-white hover:bg-oxblood/90 flex items-center gap-1.5 transition cursor-pointer shadow-xs ml-auto"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Сравнить через ИИ</span>
                  </button>
                )}

                {llmEvaluation && !isLoadingLlm && (
                  <button
                    type="button"
                    onClick={handleRunLlmEvaluation}
                    className="px-2.5 py-1 text-[10px] font-mono uppercase tracking-wider text-ink-muted hover:text-ink dark:hover:text-white flex items-center gap-1 transition cursor-pointer ml-auto border border-paper-border dark:border-paper-darkBorder hover:border-ink"
                    title="Запустить повторный анализ LLM"
                  >
                    <RotateCw className="w-3 h-3" />
                    <span>Перепроверить</span>
                  </button>
                )}
              </div>

              {/* Состояние загрузки */}
              {isLoadingLlm && (
                <div className="p-4 border border-dashed border-oxblood/40 bg-oxblood/5 flex items-center gap-3 text-xs font-mono animate-pulse text-ink dark:text-stone-300">
                  <RotateCw className="w-4 h-4 text-oxblood animate-spin shrink-0" />
                  <div>
                    <p className="font-semibold text-oxblood dark:text-oxblood-light">
                      LLM-модель сопоставляет ваш профиль компетенций с проектом...
                    </p>
                    <p className="text-[10px] text-ink-muted dark:text-stone-400 mt-0.5">
                      Анализируем совпадение стека, уровень подготовки, зоны риска и формулируем вердикт
                    </p>
                  </div>
                </div>
              )}

              {/* Ошибка */}
              {llmError && (
                <div className="p-3 bg-red-500/10 border border-red-500 text-red-700 dark:text-red-400 text-xs font-mono flex items-center justify-between">
                  <span>{llmError}</span>
                  <button type="button" onClick={handleRunLlmEvaluation} className="underline font-bold ml-2 cursor-pointer">
                    Повторить
                  </button>
                </div>
              )}

              {/* Начальное состояние: подсказка до клика */}
              {!llmEvaluation && !isLoadingLlm && !llmError && (
                <div className="p-3 bg-paper-card dark:bg-stone-900 border border-paper-border/70 dark:border-paper-darkBorder/70 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="text-[11px] text-ink-muted dark:text-stone-400 font-mono leading-relaxed">
                    Векторный поиск (MiniLM-L12-v2) рассчитал балл соответствия: <strong>{matchScore}%</strong>.
                    Запустите LLM-анализ, чтобы модель оценила <strong>что хорошо</strong>, <strong>что плохо</strong> и <strong>стоит ли отправлять заявку</strong> на этот проект.
                  </div>
                  <button
                    type="button"
                    onClick={handleRunLlmEvaluation}
                    className="shrink-0 btn-editorial px-3 py-1.5 text-[10px] font-mono uppercase tracking-wider border border-ink dark:border-paper-light text-ink dark:text-ink-light hover:bg-ink hover:text-white transition cursor-pointer self-start sm:self-auto"
                  >
                    Запустить анализ →
                  </button>
                </div>
              )}

              {/* Результат LLM анализа */}
              {llmEvaluation && !isLoadingLlm && (
                <div className="space-y-3.5 pt-1">
                  {/* 1. Блок вердикта: Стоит ли отправлять заявку */}
                  <div
                    className={`p-3.5 border flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 ${
                      llmEvaluation.verdict === 'RECOMMENDED'
                        ? 'bg-emerald-500/10 border-emerald-600 text-emerald-900 dark:text-emerald-300'
                        : llmEvaluation.verdict === 'CONSIDER'
                        ? 'bg-amber-500/10 border-amber-600 text-amber-900 dark:text-amber-300'
                        : 'bg-red-500/10 border-red-600 text-red-900 dark:text-red-300'
                    }`}
                  >
                    <div className="flex items-start sm:items-center gap-2.5">
                      {llmEvaluation.verdict === 'RECOMMENDED' ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5 sm:mt-0" />
                      ) : llmEvaluation.verdict === 'CONSIDER' ? (
                        <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5 sm:mt-0" />
                      ) : (
                        <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5 sm:mt-0" />
                      )}
                      <div>
                        <div className="text-[10px] font-mono uppercase tracking-widest opacity-80">
                          Вердикт ИИ: Стоит ли отправлять заявку
                        </div>
                        <div className="text-sm font-bold tracking-tight">
                          {llmEvaluation.verdictTitle}
                        </div>
                      </div>
                    </div>

                    <div className="text-[11px] font-mono px-2.5 py-1 bg-white/70 dark:bg-black/40 border border-current/20 shrink-0 self-start sm:self-auto flex items-center gap-1.5">
                      <span>Индекс соответствия:</span>
                      <strong className="font-bold">{llmEvaluation.matchScore}%</strong>
                    </div>
                  </div>

                  {/* 2. Общее резюме от LLM */}
                  <p className="text-xs text-ink-muted dark:text-stone-300 leading-relaxed font-normal bg-paper-card dark:bg-stone-900 p-3 border border-paper-border dark:border-paper-darkBorder">
                    {llmEvaluation.summary}
                  </p>

                  {/* 3. Двухколоночный блок: ЧТО ХОРОШО vs ЧТО ПЛОХО */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    {/* ЧТО ХОРОШО (Плюсы) */}
                    <div className="p-3 bg-emerald-500/5 dark:bg-emerald-950/20 border border-emerald-600/30 space-y-2">
                      <div className="text-[10px] font-mono uppercase tracking-wider font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Что хорошо (сильные стороны):</span>
                      </div>
                      <ul className="space-y-1.5 text-ink dark:text-stone-300 text-[11px]">
                        {llmEvaluation.pros.map((pro, idx) => (
                          <li key={idx} className="flex items-start gap-1.5 leading-snug">
                            <span className="text-emerald-600 font-bold shrink-0">✓</span>
                            <span>{pro}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* ЧТО ПЛОХО (Минусы / Риски) */}
                    <div className="p-3 bg-oxblood/5 dark:bg-oxblood/10 border border-oxblood/30 space-y-2">
                      <div className="text-[10px] font-mono uppercase tracking-wider font-bold text-oxblood dark:text-oxblood-light flex items-center gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        <span>Что плохо (пробелы и риски):</span>
                      </div>
                      <ul className="space-y-1.5 text-ink dark:text-stone-300 text-[11px]">
                        {llmEvaluation.cons.map((con, idx) => (
                          <li key={idx} className="flex items-start gap-1.5 leading-snug">
                            <span className="text-oxblood font-bold shrink-0">✕</span>
                            <span>{con}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Рекомендации от LLM */}
                  {llmEvaluation.recommendations?.length > 0 && (
                    <div className="p-3 bg-paper-card dark:bg-stone-900 border border-paper-border dark:border-paper-darkBorder space-y-1.5">
                      <div className="text-[10px] font-mono uppercase tracking-widest text-ink-muted dark:text-stone-400">
                        Рекомендации LLM-модели перед интервью:
                      </div>
                      <ul className="space-y-1 text-xs text-ink dark:text-stone-300">
                        {llmEvaluation.recommendations.map((rec, idx) => (
                          <li key={idx} className="flex items-start gap-1.5 text-[11px]">
                            <span className="text-oxblood font-semibold">•</span>
                            <span>{rec}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* 4. Совет для сопроводительного письма */}
                  {llmEvaluation.coverLetterTip && (
                    <div className="p-3 bg-paper-card dark:bg-stone-900 border border-paper-border dark:border-paper-darkBorder flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
                      <div className="flex items-start gap-2">
                        <Lightbulb className="w-4 h-4 text-brass shrink-0 mt-0.5" />
                        <div>
                          <span className="text-[10px] font-mono uppercase tracking-widest text-ink-muted dark:text-stone-400 block">
                            Совет от LLM для мотивационного письма:
                          </span>
                          <span className="text-[11px] text-ink dark:text-stone-200">
                            {llmEvaluation.coverLetterTip}
                          </span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={handleApplyTipToCoverLetter}
                        className="shrink-0 text-[10px] font-mono uppercase tracking-wider px-2.5 py-1.5 border border-oxblood text-oxblood dark:text-oxblood-light hover:bg-oxblood hover:text-white transition cursor-pointer font-semibold"
                        title="Добавить эту рекомендацию в текст сопроводительного письма ниже"
                      >
                        + Вставить в письмо
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Параметры проекта по БД */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 p-3 bg-paper-light/60 dark:bg-paper-dark border border-paper-border dark:border-paper-darkBorder text-xs font-mono">
              <div>
                <span className="text-[10px] text-ink-muted dark:text-stone-400 uppercase tracking-widest block">
                  Команда (team_size):
                </span>
                <span className="font-semibold text-ink dark:text-ink-light">{project.teamSize}</span>
              </div>
              <div>
                <span className="text-[10px] text-ink-muted dark:text-stone-400 uppercase tracking-widest block">
                  Формат работы:
                </span>
                <span className="font-semibold text-ink dark:text-ink-light">
                  {project.isRemote ? 'Удалённо / Гибрид' : 'Офис (' + (project.city || 'Кемерово') + ')'}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-ink-muted dark:text-stone-400 uppercase tracking-widest block">
                  Сложность:
                </span>
                <span className="font-semibold text-oxblood dark:text-oxblood-light">
                  {project.difficulty || 'MIDDLE'}
                </span>
              </div>
            </div>

            {/* ЗАДАЧА 4: Опция командного отклика */}
            <div className="border border-paper-border dark:border-paper-darkBorder bg-paper-muted/30 dark:bg-paper-dark p-4 space-y-3">
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={isTeam}
                    onChange={(e) => setIsTeam(e.target.checked)}
                    className="w-4 h-4 accent-oxblood cursor-pointer"
                  />
                  <span className="text-xs font-mono uppercase tracking-wider font-semibold text-ink dark:text-ink-light flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-oxblood dark:text-oxblood-light" />
                    Подать заявку командой (is_team)
                  </span>
                </label>
                <span className="text-[10px] font-mono text-ink-muted">
                  Рекомендуемый состав: {project.teamSize}
                </span>
              </div>

              {isTeam && (
                <div className="pt-2 border-t border-paper-border/60 dark:border-paper-darkBorder/60 space-y-3 fade-in">
                  <div className="p-2.5 bg-paper-light dark:bg-stone-900 border border-paper-border dark:border-paper-darkBorder flex items-center gap-2 text-xs font-mono">
                    <Crown className="w-4 h-4 text-brass shrink-0" />
                    <div>
                      <span className="font-semibold text-ink dark:text-ink-light">
                        {currentStudent.name}
                      </span>{' '}
                      <span className="text-[10px] px-1.5 py-0.5 bg-oxblood text-white uppercase tracking-wider">
                        LEAD (Инициатор)
                      </span>
                    </div>
                  </div>

                  <div>
                    <div className="text-[10px] font-mono uppercase tracking-widest text-ink-muted dark:text-stone-400 mb-2">
                      Выберите участников команды из ваших подтвержденных напарников:
                    </div>

                    {friends.length === 0 ? (
                      <div className="p-3 text-center text-xs font-mono text-ink-muted dark:text-stone-400 bg-paper-light dark:bg-paper-dark border border-dashed border-paper-border">
                        У вас пока нет подтвержденных напарников. Вы можете подать заявку индивидуально или добавить друзей во вкладке «Мой профиль и ИИ».
                      </div>
                    ) : (
                      <div className="space-y-1.5 max-h-40 overflow-y-auto">
                        {friends.map((friend) => {
                          const fId = Number(friend.id);
                          const isSelected = selectedFriendIds.includes(fId);
                          const memberCheck = canAddMemberToProjectApplication(fId, project.id, applications);
                          const isBlocked = !memberCheck.allowed;

                          return (
                            <div
                              key={fId}
                              onClick={() => !isBlocked && toggleFriend(fId)}
                              title={isBlocked ? memberCheck.reason : undefined}
                              className={`p-2.5 border flex items-center justify-between text-xs font-mono ${
                                isBlocked
                                  ? 'opacity-40 border-dashed border-stone-400 bg-stone-100 dark:bg-stone-900 cursor-not-allowed'
                                  : isSelected
                                  ? 'border-oxblood bg-oxblood/10 text-ink dark:text-ink-light font-semibold cursor-pointer'
                                  : 'border-paper-border dark:border-paper-darkBorder bg-paper-light dark:bg-paper-dark hover:border-ink/50 cursor-pointer'
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                <div
                                  className={`w-4 h-4 border flex items-center justify-center ${
                                    isBlocked
                                      ? 'border-stone-400 bg-stone-200 dark:bg-stone-800'
                                      : isSelected
                                      ? 'border-oxblood bg-oxblood text-white'
                                      : 'border-paper-border'
                                  }`}
                                >
                                  {isSelected && <Check className="w-3 h-3" />}
                                </div>
                                <span className={isBlocked ? 'line-through text-ink-muted' : ''}>
                                  {friend.name}
                                </span>
                                <span className="text-[10px] text-ink-muted">
                                  ({friend.group} • {formatYearDisplay(friend.year)})
                                </span>
                              </div>

                              {isBlocked ? (
                                <span className="text-[9px] font-mono uppercase tracking-wider text-oxblood dark:text-oxblood-light font-bold">
                                  Уже в заявке (UNIQUE)
                                </span>
                              ) : (
                                <span className="text-[10px] text-oxblood dark:text-oxblood-light">
                                  {friend.specialization}
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Form with textarea */}
            <div className="border-t border-paper-border dark:border-paper-darkBorder pt-4 space-y-2">
              <label
                htmlFor="modal-cover-letter"
                className="block text-[10px] font-mono uppercase tracking-widest text-ink-muted dark:text-stone-400"
              >
                Сопроводительное письмо / Мотивация {isTeam && 'команды'}:
              </label>
              <textarea
                id="modal-cover-letter"
                rows={3}
                value={coverLetter}
                onChange={(e) => setCoverLetter(e.target.value)}
                placeholder="Здравствуйте! Наша команда хотела бы взять этот проект в разработку..."
                className="w-full p-3 text-sm bg-paper-light dark:bg-paper-dark border border-paper-border dark:border-paper-darkBorder focus:outline-none focus:border-ink dark:focus:border-ink-light placeholder:text-ink-muted/60 text-ink dark:text-ink-light leading-relaxed min-h-[80px] max-h-[160px] resize-y"
              />
            </div>
          </div>

          {/* Footer — зафиксирован */}
          <div className="shrink-0 flex items-center justify-end gap-3 px-5 sm:px-7 py-3.5 border-t border-paper-border dark:border-paper-darkBorder bg-paper-card/95 dark:bg-paper-darkCard/95 backdrop-blur-xs">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-mono uppercase tracking-widest text-ink-muted hover:text-ink dark:hover:text-white transition-colors cursor-pointer"
            >
              Отмена
            </button>
            <button
              type="submit"
              disabled={alreadyAppliedByMe}
              className="btn-editorial px-6 py-2.5 text-xs font-mono uppercase tracking-widest bg-ink text-paper-light dark:bg-paper-light dark:text-ink disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer flex items-center gap-1.5 border border-ink dark:border-paper-light"
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>{isTeam ? 'Отправить командную заявку' : 'Отправить заявку'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};
