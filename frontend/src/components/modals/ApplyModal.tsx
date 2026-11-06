import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Users, UserCheck, AlertTriangle, Crown, Check } from 'lucide-react';
import type { Project, StudentProfile, ProjectApplication } from '../../types';
import { SkillBadge } from '../SkillBadge';
import { SemanticMatchBadge } from '../SemanticMatchBadge';
import { formatYearDisplay } from '../../utils/dbValidation';
import { canStudentApplyToProject, canAddMemberToProjectApplication } from '../../utils/dbValidation';

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

  if (!project) return null;
  if (typeof document === 'undefined') return null;

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
      className="fixed inset-0 z-50 bg-ink/75 backdrop-blur-xs flex justify-center items-center overflow-y-auto p-3 sm:p-5"
      onClick={onClose}
    >
      <div
        className="relative bg-paper-card dark:bg-paper-darkCard border-2 border-ink dark:border-stone-600 max-w-xl w-full shadow-2xl fade-in flex flex-col max-h-[calc(100vh-2rem)] sm:max-h-[calc(100vh-3.5rem)] my-auto overflow-hidden"
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
              <SemanticMatchBadge score={project.match} size="sm" />
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
              className="px-6 py-2.5 text-xs font-mono uppercase tracking-widest bg-oxblood hover:bg-oxblood-hover disabled:opacity-40 disabled:cursor-not-allowed text-paper-light transition cursor-pointer shadow-xs flex items-center gap-1.5"
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
