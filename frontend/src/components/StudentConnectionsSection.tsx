import React, { useState, useMemo } from 'react';
import {
  Users,
  UserPlus,
  UserCheck,
  Clock,
  Check,
  X,
  Search,
  ExternalLink,
  Shield,
  Send,
} from 'lucide-react';
import type { StudentConnection, StudentProfile } from '../types';
import { SkillBadge } from './SkillBadge';
import { formatYearDisplay } from '../utils/dbValidation';
import { EmptyState } from './EmptyState';

interface StudentConnectionsSectionProps {
  currentStudent: StudentProfile;
  connections: StudentConnection[];
  allStudents: StudentProfile[];
  onSendFriendRequest: (targetStudentId: number) => void;
  onAcceptFriendRequest: (connectionId: string) => void;
  onRejectFriendRequest: (connectionId: string) => void;
  onCancelFriendRequest: (connectionId: string) => void;
  onViewStudent?: (studentId: number) => void;
}

export const StudentConnectionsSection: React.FC<StudentConnectionsSectionProps> = ({
  currentStudent,
  connections,
  allStudents,
  onSendFriendRequest,
  onAcceptFriendRequest,
  onRejectFriendRequest,
  onCancelFriendRequest,
  onViewStudent,
}) => {
  const currentStudentId = Number(currentStudent.id || 1);
  const [activeSubTab, setActiveSubTab] = useState<'friends' | 'incoming' | 'outgoing' | 'search'>('friends');
  const [searchQuery, setSearchQuery] = useState('');

  // 1. Подтвержденные друзья (ACCEPTED)
  const acceptedConnections = useMemo(() => {
    return connections.filter(
      (c) =>
        c.status === 'ACCEPTED' &&
        (Number(c.studentId) === currentStudentId || Number(c.partnerId) === currentStudentId)
    );
  }, [connections, currentStudentId]);

  const friendsList = useMemo(() => {
    return acceptedConnections.map((conn) => {
      const partnerId =
        Number(conn.studentId) === currentStudentId ? Number(conn.partnerId) : Number(conn.studentId);
      const student = allStudents.find((s) => Number(s.id) === partnerId);
      return {
        connection: conn,
        partnerId,
        student,
      };
    }).filter((item) => item.student !== undefined) as {
      connection: StudentConnection;
      partnerId: number;
      student: StudentProfile;
    }[];
  }, [acceptedConnections, currentStudentId, allStudents]);

  // 2. Входящие заявки (PENDING, где requestedBy !== currentStudentId)
  const incomingRequests = useMemo(() => {
    return connections
      .filter(
        (c) =>
          c.status === 'PENDING' &&
          (Number(c.studentId) === currentStudentId || Number(c.partnerId) === currentStudentId) &&
          Number(c.requestedBy) !== currentStudentId
      )
      .map((conn) => {
        const senderId = Number(conn.requestedBy);
        const sender = allStudents.find((s) => Number(s.id) === senderId);
        return {
          connection: conn,
          senderId,
          sender,
        };
      })
      .filter((item) => item.sender !== undefined) as {
        connection: StudentConnection;
        senderId: number;
        sender: StudentProfile;
      }[];
  }, [connections, currentStudentId, allStudents]);

  // 3. Исходящие заявки (PENDING, где requestedBy === currentStudentId)
  const outgoingRequests = useMemo(() => {
    return connections
      .filter(
        (c) =>
          c.status === 'PENDING' &&
          (Number(c.studentId) === currentStudentId || Number(c.partnerId) === currentStudentId) &&
          Number(c.requestedBy) === currentStudentId
      )
      .map((conn) => {
        const targetId =
          Number(conn.studentId) === currentStudentId ? Number(conn.partnerId) : Number(conn.studentId);
        const target = allStudents.find((s) => Number(s.id) === targetId);
        return {
          connection: conn,
          targetId,
          target,
        };
      })
      .filter((item) => item.target !== undefined) as {
        connection: StudentConnection;
        targetId: number;
        target: StudentProfile;
      }[];
  }, [connections, currentStudentId, allStudents]);

  // Хелпер: проверить статус связи с конкретным студентом
  const getConnectionWith = (otherStudentId: number): StudentConnection | undefined => {
    return connections.find(
      (c) =>
        (Number(c.studentId) === currentStudentId && Number(c.partnerId) === otherStudentId) ||
        (Number(c.partnerId) === currentStudentId && Number(c.studentId) === otherStudentId)
    );
  };

  // 4. Поиск других студентов (исключая себя)
  const searchableStudents = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return allStudents.filter((s) => {
      const sId = Number(s.id);
      if (sId === currentStudentId) return false;
      if (!q) return true;
      const matchesName = s.name.toLowerCase().includes(q);
      const matchesSpec = s.specialization.toLowerCase().includes(q);
      const matchesGroup = s.group.toLowerCase().includes(q);
      const matchesSkill = s.skills.some((sk) => sk.name.toLowerCase().includes(q));
      return matchesName || matchesSpec || matchesGroup || matchesSkill;
    });
  }, [allStudents, currentStudentId, searchQuery]);

  return (
    <div className="border border-paper-border dark:border-paper-darkBorder bg-paper-card dark:bg-paper-darkCard p-6 sm:p-8 space-y-6 transition-colors">
      {/* Шапка блока */}
      <div className="border-b border-paper-border dark:border-paper-darkBorder pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="text-[10px] font-mono uppercase tracking-widest text-oxblood dark:text-oxblood-light flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5" /> Система напарников (student_connections)
          </div>
          <h3 className="text-2xl font-semibold mt-0.5 text-ink dark:text-ink-light">
            Мои напарники и команды для проектов
          </h3>
          <p className="text-xs text-ink-muted dark:text-stone-300 mt-1">
            Объединяйтесь в команды со студентами КемГУ для совместного отклика на проекты и стажировки.
          </p>
        </div>

        {/* Навигация по подвкладкам */}
        <div className="flex flex-wrap gap-1.5 self-start sm:self-center bg-paper-light dark:bg-paper-dark p-1 border border-paper-border dark:border-paper-darkBorder rounded-xs">
          <button
            type="button"
            onClick={() => setActiveSubTab('friends')}
            className={`min-h-[38px] px-3.5 py-2 text-xs font-mono uppercase tracking-wider transition inline-flex items-center gap-1.5 cursor-pointer rounded-xs ${
              activeSubTab === 'friends'
                ? 'bg-oxblood text-white font-semibold shadow-2xs'
                : 'text-ink-muted hover:text-ink dark:hover:text-white'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5" />
            <span>Напарники ({friendsList.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('incoming')}
            className={`min-h-[38px] px-3.5 py-2 text-xs font-mono uppercase tracking-wider transition inline-flex items-center gap-1.5 cursor-pointer relative rounded-xs ${
              activeSubTab === 'incoming'
                ? 'bg-oxblood text-white font-semibold shadow-2xs'
                : 'text-ink-muted hover:text-ink dark:hover:text-white'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Входящие</span>
            {incomingRequests.length > 0 && (
              <span className="w-4 h-4 rounded-full bg-hunter text-white text-[9px] font-bold flex items-center justify-center">
                {incomingRequests.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('outgoing')}
            className={`min-h-[38px] px-3.5 py-2 text-xs font-mono uppercase tracking-wider transition inline-flex items-center gap-1.5 cursor-pointer rounded-xs ${
              activeSubTab === 'outgoing'
                ? 'bg-oxblood text-white font-semibold shadow-2xs'
                : 'text-ink-muted hover:text-ink dark:hover:text-white'
            }`}
          >
            <span>Исходящие ({outgoingRequests.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('search')}
            className={`min-h-[38px] px-3.5 py-2 text-xs font-mono uppercase tracking-wider transition inline-flex items-center gap-1.5 cursor-pointer rounded-xs ${
              activeSubTab === 'search'
                ? 'bg-oxblood text-white font-semibold shadow-2xs'
                : 'text-ink-muted hover:text-ink dark:hover:text-white'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Найти студента</span>
          </button>
        </div>
      </div>

      {/* Контент подвкладок */}

      {/* 1. ПОДТВЕРЖДЕННЫЕ НАПАРНИКИ */}
      {activeSubTab === 'friends' && (
        <div className="space-y-4">
          {friendsList.length === 0 ? (
            <EmptyState
              icon={Users}
              title="У вас пока нет подтвержденных напарников"
              description="Объединяйтесь в команды со студентами КемГУ для совместного отклика на проекты, ВКР и стажировки."
              actionText="Найти напарника"
              onAction={() => setActiveSubTab('search')}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {friendsList.map(({ partnerId, student }) => (
                <div
                  key={partnerId}
                  className="p-4 border border-paper-border dark:border-paper-darkBorder bg-paper-light/50 dark:bg-paper-dark space-y-3 hover:border-oxblood/40 transition-colors"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 border border-ink dark:border-stone-500 bg-paper-muted dark:bg-stone-800 flex items-center justify-center font-bold text-sm text-oxblood dark:text-oxblood-light shrink-0">
                        {student.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-semibold text-sm text-ink dark:text-ink-light flex items-center gap-1.5">
                          <span>{student.name}</span>
                          <span className="text-[10px] text-hunter dark:text-emerald-400 font-mono flex items-center gap-0.5">
                            <Shield className="w-3 h-3" /> Напарник
                          </span>
                        </div>
                        <div className="text-[11px] font-mono text-ink-muted dark:text-stone-400">
                          {student.group} • {formatYearDisplay(student.year)} • {student.specialization}
                        </div>
                      </div>
                    </div>

                    {onViewStudent && (
                      <button
                        type="button"
                        onClick={() => onViewStudent(partnerId)}
                        className="px-2 py-1 text-[10px] font-mono uppercase tracking-wider border border-paper-border dark:border-paper-darkBorder hover:border-oxblood text-oxblood dark:text-oxblood-light transition flex items-center gap-1 cursor-pointer shrink-0"
                        title="Просмотреть портфолио и резюме"
                      >
                        <ExternalLink className="w-3 h-3" /> Профиль
                      </button>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-1 pt-1">
                    {student.skills.slice(0, 4).map((sk) => (
                      <SkillBadge key={typeof sk === 'string' ? sk : sk.name} skill={sk} size="sm" />
                    ))}
                    {student.skills.length > 4 && (
                      <span className="text-[10px] font-mono text-ink-muted self-center">
                        +{student.skills.length - 4} ещё
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 2. ВХОДЯЩИЕ ЗАЯВКИ */}
      {activeSubTab === 'incoming' && (
        <div className="space-y-3">
          {incomingRequests.length === 0 ? (
            <EmptyState
              icon={Clock}
              title="Нет входящих заявок"
              description="Когда другой студент отправит вам приглашение объединиться в команду, заявка появится здесь."
            />
          ) : (
            incomingRequests.map(({ connection, senderId, sender }) => (
              <div
                key={connection.id}
                className="p-4 border border-hunter/30 bg-hunter/5 dark:bg-emerald-950/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 border border-hunter bg-paper-muted dark:bg-stone-800 flex items-center justify-center font-bold text-sm text-hunter shrink-0">
                    {sender.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <div className="font-semibold text-sm text-ink dark:text-ink-light flex items-center gap-2">
                      <span>{sender.name}</span>
                      <span className="text-[10px] font-mono px-2 py-0.5 bg-hunter text-white uppercase tracking-widest">
                        Хочет стать напарником
                      </span>
                    </div>
                    <div className="text-xs font-mono text-ink-muted dark:text-stone-400 mt-0.5">
                      {sender.group} • {formatYearDisplay(sender.year)} • {sender.specialization}
                    </div>
                    <div className="text-[10px] font-mono text-oxblood dark:text-oxblood-light mt-0.5">
                      Telegram: {sender.telegram}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                  {onViewStudent && (
                    <button
                      type="button"
                      onClick={() => onViewStudent(senderId)}
                      className="px-2.5 py-1.5 text-xs font-mono uppercase tracking-wider border border-paper-border hover:border-ink transition text-ink dark:text-ink-light cursor-pointer"
                    >
                      Анкета
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => onRejectFriendRequest(connection.id)}
                    className="px-3 py-1.5 text-xs font-mono uppercase tracking-wider border border-paper-border hover:bg-stone-200 dark:hover:bg-stone-800 text-ink-muted transition cursor-pointer flex items-center gap-1"
                  >
                    <X className="w-3.5 h-3.5" /> Отклонить
                  </button>
                  <button
                    type="button"
                    onClick={() => onAcceptFriendRequest(connection.id)}
                    className="px-4 py-1.5 text-xs font-mono uppercase tracking-wider bg-hunter hover:bg-emerald-700 text-white transition cursor-pointer flex items-center gap-1 shadow-xs"
                  >
                    <Check className="w-3.5 h-3.5" /> Принять
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* 3. ИСХОДЯЩИЕ ЗАЯВКИ */}
      {activeSubTab === 'outgoing' && (
        <div className="space-y-3">
          {outgoingRequests.length === 0 ? (
            <EmptyState
              icon={Send}
              title="Нет исходящих заявок"
              description="Вы пока не отправляли заявок на совместную работу. Перейдите во вкладку поиска, чтобы выбрать напарника."
              actionText="Найти студента"
              onAction={() => setActiveSubTab('search')}
            />
          ) : (
            outgoingRequests.map(({ connection, targetId, target }) => (
              <div
                key={connection.id}
                className="p-4 border border-paper-border dark:border-paper-darkBorder bg-paper-light/40 dark:bg-paper-dark flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 border border-paper-border bg-paper-muted dark:bg-stone-800 flex items-center justify-center font-bold text-sm text-ink-muted shrink-0">
                    {target.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <div className="font-semibold text-sm text-ink dark:text-ink-light">
                      {target.name}
                    </div>
                    <div className="text-xs font-mono text-ink-muted dark:text-stone-400 mt-0.5">
                      {target.group} • {formatYearDisplay(target.year)} • {target.specialization}
                    </div>
                    <div className="text-[10px] font-mono text-brass mt-0.5 flex items-center gap-1">
                      <Clock className="w-3 h-3" /> Ожидает подтверждения студентом
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                  {onViewStudent && (
                    <button
                      type="button"
                      onClick={() => onViewStudent(targetId)}
                      className="px-2.5 py-1.5 text-xs font-mono uppercase tracking-wider border border-paper-border hover:border-ink transition text-ink dark:text-ink-light cursor-pointer"
                    >
                      Профиль
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => onCancelFriendRequest(connection.id)}
                    className="px-3 py-1.5 text-xs font-mono uppercase tracking-wider border border-oxblood/40 hover:bg-oxblood/10 text-oxblood dark:text-oxblood-light transition cursor-pointer"
                  >
                    Отменить запрос
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* 4. ПОИСК СТУДЕНТА И ПРЕДЛОЖЕНИЕ ПАРТНЕРСТВА */}
      {activeSubTab === 'search' && (
        <div className="space-y-4">
          <div className="relative">
            <Search className="w-4 h-4 text-ink-muted absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Поиск студентов по имени, группе (ФИТ-231), стеку (React, Docker, Python)..."
              className="w-full pl-9 pr-4 py-2 text-xs font-mono bg-paper-light dark:bg-paper-dark border border-paper-border dark:border-paper-darkBorder focus:outline-none focus:border-oxblood text-ink dark:text-ink-light"
            />
          </div>

          {searchableStudents.length === 0 ? (
            <EmptyState
              icon={Search}
              title="Студенты не найдены"
              description="По вашему запросу не найдено студентов. Попробуйте изменить поисковую строку по имени, группе или стеку."
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {searchableStudents.map((stud) => {
              const studId = Number(stud.id);
              const conn = getConnectionWith(studId);

              const isFriend = conn?.status === 'ACCEPTED';
              const isOutgoing = conn?.status === 'PENDING' && Number(conn.requestedBy) === currentStudentId;
              const isIncoming = conn?.status === 'PENDING' && Number(conn.requestedBy) !== currentStudentId;

              return (
                <div
                  key={studId}
                  className="p-3.5 border border-paper-border dark:border-paper-darkBorder bg-paper-light/40 dark:bg-paper-dark flex flex-col justify-between space-y-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="font-semibold text-sm text-ink dark:text-ink-light">
                        {stud.name}
                      </div>
                      <div className="text-[11px] font-mono text-ink-muted dark:text-stone-400">
                        {stud.university} • {stud.group} • {formatYearDisplay(stud.year)}
                      </div>
                      <div className="text-[11px] font-mono text-oxblood dark:text-oxblood-light font-medium">
                        {stud.specialization}
                      </div>
                    </div>

                    {onViewStudent && (
                      <button
                        type="button"
                        onClick={() => onViewStudent(studId)}
                        className="p-1 text-ink-muted hover:text-ink dark:hover:text-white transition cursor-pointer shrink-0"
                        title="Открыть профиль"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-1">
                    {stud.skills.slice(0, 3).map((sk) => (
                      <SkillBadge key={typeof sk === 'string' ? sk : sk.name} skill={sk} size="sm" />
                    ))}
                  </div>

                  {/* Кнопки статуса взаимодействия */}
                  <div className="pt-2 border-t border-paper-border/60 dark:border-paper-darkBorder/60 flex items-center justify-between">
                    <span className="text-[10px] font-mono text-ink-muted dark:text-stone-400">
                      {stud.city}
                    </span>

                    {isFriend ? (
                      <span className="text-[10px] font-mono text-hunter dark:text-emerald-400 font-semibold flex items-center gap-1">
                        <Check className="w-3 h-3" /> Напарник
                      </span>
                    ) : isOutgoing ? (
                      <button
                        type="button"
                        onClick={() => conn && onCancelFriendRequest(conn.id)}
                        className="px-2 py-1 text-[10px] font-mono uppercase tracking-wider border border-paper-border text-ink-muted hover:text-oxblood transition cursor-pointer"
                      >
                        Запрос отправлен (Отмена)
                      </button>
                    ) : isIncoming ? (
                      <button
                        type="button"
                        onClick={() => conn && onAcceptFriendRequest(conn.id)}
                        className="px-2.5 py-1 text-[10px] font-mono uppercase tracking-wider bg-hunter text-white transition cursor-pointer flex items-center gap-1"
                      >
                        <Check className="w-3 h-3" /> Принять заявку
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => onSendFriendRequest(studId)}
                        className="px-3 py-1 text-[10px] font-mono uppercase tracking-wider bg-ink text-paper-light dark:bg-stone-200 dark:text-stone-900 hover:bg-oxblood dark:hover:bg-oxblood dark:hover:text-white transition flex items-center gap-1 cursor-pointer"
                      >
                        <UserPlus className="w-3 h-3" /> Добавить в напарники
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          )}
        </div>
      )}
    </div>
  );
};
