import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  clampYear,
  parseYearToNumber,
  formatYearDisplay,
  orderConnectionPair,
  isStudentInProjectApplication,
  canStudentApplyToProject,
  canAddMemberToProjectApplication,
  canUserAccessApplicationChat,
  calculateStudentProjectMatch,
  getBestProjectMatchForStudent,
} from './dbValidation';
import type { ProjectApplication, StudentProfile, Project } from '../types';

describe('DB Validation & Business Rules Audit', () => {
  // ==========================================
  // 1. Тестирование поля «Курс» (year: 1..6)
  // ==========================================
  describe('Rule 1: Student Year Stepper & Clamping (1..6, VARCHAR(50))', () => {
    it('clampYear: should normalize 0 and negative numbers to 1', () => {
      assert.equal(clampYear(0), 1);
      assert.equal(clampYear(-1), 1);
      assert.equal(clampYear(-99), 1);
      assert.equal(clampYear('-5'), 1);
    });

    it('clampYear: should normalize numbers > 6 to 6', () => {
      assert.equal(clampYear(7), 6);
      assert.equal(clampYear(10), 6);
      assert.equal(clampYear(999), 6);
      assert.equal(clampYear('12'), 6);
    });

    it('clampYear: should preserve valid course numbers 1..6', () => {
      for (let y = 1; y <= 6; y++) {
        assert.equal(clampYear(y), y);
        assert.equal(clampYear(String(y)), y);
      }
    });

    it('clampYear: should fallback to 1 for undefined/null/empty', () => {
      assert.equal(clampYear(undefined), 1);
      assert.equal(clampYear(''), 1);
    });

    it('parseYearToNumber: should parse Roman numerals (I - VI)', () => {
      assert.equal(parseYearToNumber('I'), 1);
      assert.equal(parseYearToNumber('II'), 2);
      assert.equal(parseYearToNumber('III курс'), 3);
      assert.equal(parseYearToNumber('IV Курс'), 4);
      assert.equal(parseYearToNumber('V курс'), 5);
      assert.equal(parseYearToNumber('VI'), 6);
    });

    it('parseYearToNumber: should extract digit from descriptive strings', () => {
      assert.equal(parseYearToNumber('4 курс (Бакалавриат)'), 4);
      assert.equal(parseYearToNumber('3'), 3);
      assert.equal(parseYearToNumber(''), 1);
    });

    it('formatYearDisplay: should format neatly as "{n} курс"', () => {
      assert.equal(formatYearDisplay('IV'), '4 курс');
      assert.equal(formatYearDisplay('2'), '2 курс');
      assert.equal(formatYearDisplay(undefined), '1 курс');
    });
  });

  // ==========================================
  // 2. Тестирование сортировки ID в student_connections (CHECK student_id < partner_id)
  // ==========================================
  describe('Rule 2: student_connections pair ordering CHECK(student_id < partner_id)', () => {
    it('orderConnectionPair: should keep ordered pair (1, 5) as studentId=1, partnerId=5', () => {
      const res = orderConnectionPair(1, 5);
      assert.equal(res.studentId, 1);
      assert.equal(res.partnerId, 5);
      assert.ok(Number(res.studentId) < Number(res.partnerId));
    });

    it('orderConnectionPair: should flip inverted pair (5, 1) to studentId=1, partnerId=5', () => {
      const res = orderConnectionPair(5, 1);
      assert.equal(res.studentId, 1);
      assert.equal(res.partnerId, 5);
      assert.ok(Number(res.studentId) < Number(res.partnerId));
    });

    it('orderConnectionPair: should support string UUIDs with lexicographical sorting', () => {
      const uuidA = '11111111-0000-0000-0000-000000000000';
      const uuidB = '99999999-0000-0000-0000-000000000000';

      const res1 = orderConnectionPair(uuidA, uuidB);
      assert.equal(res1.studentId, uuidA);
      assert.equal(res1.partnerId, uuidB);

      const res2 = orderConnectionPair(uuidB, uuidA);
      assert.equal(res2.studentId, uuidA);
      assert.equal(res2.partnerId, uuidB);
      assert.ok(String(res2.studentId) < String(res2.partnerId));
    });

    it('orderConnectionPair: should throw an error if studentId equals partnerId', () => {
      assert.throws(() => {
        orderConnectionPair(2, 2);
      }, /Студент не может добавить в напарники самого себя/);
    });
  });

  // ==========================================
  // 3. Тестирование защиты от дублей UNIQUE(student_id, project_id)
  // ==========================================
  describe('Rule 3: Duplicate protection UNIQUE(student_id, project_id) for solo and team', () => {
    const mockApplications: ProjectApplication[] = [
      {
        id: 'app-101',
        projectId: 1,
        projectTitle: 'AI-ассистент',
        companyId: 1,
        companyName: 'ПАО Кокс',
        studentId: 1, // LEAD
        studentName: 'Алексей Смирнов',
        status: 'PENDING',
        appliedAt: '2026-03-01T10:00:00Z',
        isTeam: true,
        teamSize: 2,
        members: [
          {
            studentId: 1,
            studentName: 'Алексей Смирнов',
            role: 'LEAD',
            joinedAt: '2026-03-01T10:00:00Z',
          },
          {
            studentId: 2, // MEMBER
            studentName: 'Екатерина Морозова',
            role: 'MEMBER',
            joinedAt: '2026-03-01T10:00:00Z',
          },
        ],
      },
      {
        id: 'app-102',
        projectId: 2,
        projectTitle: 'Веб-портал',
        companyId: 2,
        companyName: 'Кузбасс-Информ',
        studentId: 3, // Solo LEAD
        studentName: 'Дмитрий Волков',
        status: 'ACCEPTED',
        appliedAt: '2026-03-02T12:00:00Z',
        isTeam: false,
      },
    ];

    it('isStudentInProjectApplication: detects LEAD and MEMBER participation', () => {
      assert.equal(isStudentInProjectApplication(1, 1, mockApplications), true); // LEAD in project 1
      assert.equal(isStudentInProjectApplication(2, 1, mockApplications), true); // MEMBER in project 1
      assert.equal(isStudentInProjectApplication(3, 1, mockApplications), false); // not in project 1
      assert.equal(isStudentInProjectApplication(3, 2, mockApplications), true); // in project 2
    });

    it('canStudentApplyToProject: blocks duplicate submission if user is already LEAD or MEMBER', () => {
      const checkLead = canStudentApplyToProject(1, 1, mockApplications);
      assert.equal(checkLead.allowed, false);
      assert.match(checkLead.reason || '', /UNIQUE\(student_id, project_id\)/);

      const checkMember = canStudentApplyToProject(2, 1, mockApplications);
      assert.equal(checkMember.allowed, false);

      const checkNew = canStudentApplyToProject(4, 1, mockApplications);
      assert.equal(checkNew.allowed, true);
    });

    it('canAddMemberToProjectApplication: blocks adding a friend who is already in a project application', () => {
      const checkAlreadyMember = canAddMemberToProjectApplication(2, 1, mockApplications);
      assert.equal(checkAlreadyMember.allowed, false);
      assert.match(checkAlreadyMember.reason || '', /UNIQUE\(student_id, project_id\)/);

      const checkFreeFriend = canAddMemberToProjectApplication(4, 1, mockApplications);
      assert.equal(checkFreeFriend.allowed, true);
    });

    it('allows same student to apply to a different project', () => {
      // Студент 1 уже в проекте 1, но может податься на проект 2
      const checkOtherProject = canStudentApplyToProject(1, 2, mockApplications);
      assert.equal(checkOtherProject.allowed, true);
    });
  });

  // ==========================================
  // 4. Тестирование доступа к чату (chats + messages)
  // ==========================================
  describe('Rule 4: Chat access permissions (HR, LEAD, and team MEMBER)', () => {
    const teamApp: ProjectApplication = {
      id: 'app-201',
      projectId: 5,
      projectTitle: 'Smart Factory',
      companyId: 3,
      companyName: 'СДС Холдинг',
      studentId: 10, // LEAD
      studentName: 'Иван Лидер',
      status: 'INTERVIEW',
      appliedAt: '2026-03-01T10:00:00Z',
      isTeam: true,
      teamSize: 2,
      members: [
        {
          studentId: 10,
          studentName: 'Иван Лидер',
          role: 'LEAD',
          joinedAt: '2026-03-01T10:00:00Z',
        },
        {
          studentId: 20,
          studentName: 'Ольга Участник',
          role: 'MEMBER',
          joinedAt: '2026-03-01T10:00:00Z',
        },
      ],
    };

    it('canUserAccessApplicationChat: allows HR company access', () => {
      assert.equal(canUserAccessApplicationChat('hr-user', 'hr', teamApp), true);
    });

    it('canUserAccessApplicationChat: allows LEAD student access', () => {
      assert.equal(canUserAccessApplicationChat(10, 'student', teamApp), true);
      assert.equal(canUserAccessApplicationChat('10', 'student', teamApp), true);
    });

    it('canUserAccessApplicationChat: allows team MEMBER student access', () => {
      assert.equal(canUserAccessApplicationChat(20, 'student', teamApp), true);
      assert.equal(canUserAccessApplicationChat('20', 'student', teamApp), true);
    });

    it('canUserAccessApplicationChat: denies access to unrelated third-party student', () => {
      assert.equal(canUserAccessApplicationChat(99, 'student', teamApp), false);
      assert.equal(canUserAccessApplicationChat('99', 'student', teamApp), false);
    });
  });

  // ==========================================
  // 5. Тестирование расчета семантического матчинга (GET /api/organizations/projects/:id/matches)
  // ==========================================
  describe('Rule 5: Semantic Match per project and best-project calculation', () => {
    const student: StudentProfile = {
      id: 1,
      name: 'Сергиенко Александр Сергеевич',
      group: 'ФИТ-231',
      year: '4',
      university: 'КемГУ',
      specialization: 'Fullstack / Team Lead',
      telegram: '@SERK4S',
      city: 'Кемерово',
      status: 'Готов к практике',
      skills: [
        { name: 'React', level: 'ADVANCED' },
        { name: 'TypeScript', level: 'ADVANCED' },
        { name: 'FastAPI', level: 'INTERMEDIATE' },
        { name: 'PostgreSQL', level: 'ADVANCED' },
      ],
      portfolio: [],
      resumes: [],
      bio: 'Fullstack разработчик',
      aiMatch: 95,
      aiFeedback: 'Отличный профиль',
    };

    const projectWeb: Project = {
      id: 1,
      index: '№ 01',
      title: 'Интеллектуальная система',
      company: 'Софт Инжиниринг',
      department: 'Отдел веб-разработки',
      type: 'ВКР / Диплом',
      match: 96,
      teamSize: '2–3 студента',
      desc: 'Проект на React и FastAPI',
      tags: ['React', 'TypeScript', 'FastAPI', 'PostgreSQL', 'Docker'],
      requiredSkills: [
        { name: 'React', level: 'ADVANCED' },
        { name: 'TypeScript', level: 'INTERMEDIATE' },
        { name: 'FastAPI', level: 'INTERMEDIATE' },
        { name: 'PostgreSQL', level: 'BASIC' },
        { name: 'Docker', level: 'BASIC' },
      ],
      applied: false,
    };

    const projectMobile: Project = {
      id: 2,
      index: '№ 02',
      title: 'Мобильное приложение Kotlin',
      company: 'Софт Инжиниринг',
      department: 'Мобильный отдел',
      type: 'Стажировка',
      match: 50,
      teamSize: '1–2',
      desc: 'Разработка на Kotlin и Swift',
      tags: ['Kotlin', 'Swift'],
      requiredSkills: [
        { name: 'Kotlin', level: 'ADVANCED' },
        { name: 'Swift', level: 'ADVANCED' },
      ],
      applied: false,
    };

    it('calculateStudentProjectMatch: correctly calculates high score, matched skills and missing skills', () => {
      const res = calculateStudentProjectMatch(student, projectWeb);
      assert.equal(res.projectId, 1);
      assert.ok(res.matchScore >= 80, `Expected score >= 80, got ${res.matchScore}`);
      assert.equal(res.matchedSkills.length, 4); // React, TypeScript, FastAPI, PostgreSQL
      assert.deepEqual(res.missingSkills, ['Docker']);
    });

    it('calculateStudentProjectMatch: returns lower score and all missing skills for non-matching project', () => {
      const res = calculateStudentProjectMatch(student, projectMobile);
      assert.equal(res.projectId, 2);
      assert.equal(res.matchedSkills.length, 0);
      assert.equal(res.missingSkills.length, 2);
      assert.equal(res.matchScore, 50);
    });

    it('getBestProjectMatchForStudent: finds the project with maximum matchScore', () => {
      const best = getBestProjectMatchForStudent(student, [projectMobile, projectWeb]);
      assert.ok(best !== null);
      assert.equal(best?.projectId, 1);
      assert.equal(best?.projectTitle, 'Интеллектуальная система');
    });

    it('getBestProjectMatchForStudent: returns null when projects list is empty', () => {
      const best = getBestProjectMatchForStudent(student, []);
      assert.equal(best, null);
    });
  });
});
