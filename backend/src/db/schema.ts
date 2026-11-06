import {
    pgTable,
    text,
    varchar,
    timestamp,
    pgEnum,
    jsonb,
    real,
    boolean,
    uuid,
    uniqueIndex,
    index,
    date,
    customType,
    check,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

/**
 * Вектор pgvector (хранилище эмбеддингов MiniLM-L12-v2, dim=384).
 * Значение приходит строкой вида "[0.1,0.2,...]" от AI-сервиса.
 */
export const vector384 = customType<{ data: string; driverData: string }>({
    dataType: () => 'vector(384)',
});

// === ENUMS ===

export const proficiencyLevelEnum = pgEnum('proficiency_level', [
    'BASIC',
    'INTERMEDIATE',
    'ADVANCED',
]);

export const roleEnum = pgEnum('role', [
    'STUDENT',
    'COMPANY',
    'ADMIN',
]);

/** Статус отклика: включает приглашение на интервью (УР-06) */
export const applicationStatusEnum = pgEnum('application_status', [
    'PENDING',
    'REVIEWING',
    'INTERVIEW',
    'ACCEPTED',
    'REJECTED',
]);

/** Статус проекта: черновик / активный / закрытый / архив (ФР-06) */
export const projectStatusEnum = pgEnum('project_status', [
    'DRAFT',
    'ACTIVE',
    'CLOSED',
    'ARCHIVED',
]);

/** Тип проектной инициативы (УР-05/08, ФР-03) */
export const projectTypeEnum = pgEnum('project_type', [
    'INTERNSHIP',
    'VKR',
    'COURSE_PROJECT',
    'COMMERCIAL',
    'OPEN_SOURCE',
]);

export const difficultyLevelEnum = pgEnum('difficulty_level', [
    'JUNIOR',
    'MIDDLE',
    'SENIOR',
]);

export const employmentTypeEnum = pgEnum('employment_type', [
    'FULL_TIME',
    'PART_TIME',
    'PROJECT',
    'VOLUNTEER',
    'UNPAID_INTERNSHIP',
]);

/** Важность навыка в проекте (ER: importance_level) */
export const importanceLevelEnum = pgEnum('importance_level', [
    'CRITICAL',
    'IMPORTANT',
    'OPTIONAL',
]);

/** Верификация организации администратором (УР-11) */
export const companyVerificationEnum = pgEnum('company_verification', [
    'PENDING',
    'VERIFIED',
    'REJECTED',
]);

export const notificationTypeEnum = pgEnum('notification_type', [
    'APPLICATION_STATUS_CHANGED',
    'NEW_APPLICATION',
    'INTERVIEW_INVITE',
    'FRIEND_REQUEST',
    'FRIEND_ACCEPTED',
    'SYSTEM',
]);

export const skillCategoryEnum = pgEnum('skill_category', [
    'HARD',
    'SOFT',
    'LANGUAGE',
    'TOOL',
]);

/** Заявка на связь «друг/напарник» между студентами */
export const connectionRequestStatusEnum = pgEnum('connection_request_status', [
    'PENDING',
    'ACCEPTED',
    'REJECTED',
    'CANCELLED',
]);

/** Роль в командном отклике */
export const applicationMemberRoleEnum = pgEnum('application_member_role', [
    'LEAD',
    'MEMBER',
]);

// === CORE: AUTH ===

/** Пользователи: auth + RBAC (НФР-06/07, ФР-01) */
export const users = pgTable(
    'users',
    {
        id: uuid('id').primaryKey().defaultRandom(),
        email: varchar('email', { length: 255 }).notNull(),
        passwordHash: varchar('password_hash', { length: 255 }).notNull(),
        role: roleEnum('role').default('STUDENT').notNull(),
        /** Блокировка админом (УР-11, ФР-08) */
        isBlocked: boolean('is_blocked').default(false).notNull(),
        createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
        updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
    },
    (t) => [uniqueIndex('users_email_idx').on(t.email)],
);

// === PROFILES 1:1 с users ===

/** Профиль студента (УР-03, УР-04) */
export const students = pgTable(
    'students',
    {
        id: uuid('id').primaryKey().defaultRandom(),
        userId: uuid('user_id')
            .notNull()
            .references(() => users.id, { onDelete: 'cascade' }),
        firstName: varchar('first_name', { length: 100 }).notNull(),
        lastName: varchar('last_name', { length: 100 }).notNull(),
        /** Академическая группа (УР-03) */
        universityGroup: varchar('university_group', { length: 100 }).notNull(),
        /** Курс / год обучения */
        year: varchar('year', { length: 50 }).notNull(),
        university: varchar('university', { length: 255 }).default('КемГУ').notNull(),
        /** Направление подготовки (УР-03) */
        specialization: varchar('specialization', { length: 255 }),
        telegram: varchar('telegram', { length: 100 }),
        city: varchar('city', { length: 100 }).default('Кемерово'),
        phone: varchar('phone', { length: 30 }),
        /** Статус готовности к практике / поиску */
        status: varchar('status', { length: 100 }).default('Готов к практике'),
        bio: text('bio'),
        avatarUrl: varchar('avatar_url', { length: 500 }),
        /** Эмбеддинг профиля для векторного поиска (НФР-12, ФР-04/07) */
        embedding: vector384('embedding'),
        createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
        updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
    },
    (t) => [
        uniqueIndex('students_user_id_idx').on(t.userId),
        index('students_specialization_idx').on(t.specialization),
    ],
);

/** Корпоративный профиль (УР-07, ФР-05) */
export const organizations = pgTable(
    'organizations',
    {
        id: uuid('id').primaryKey().defaultRandom(),
        userId: uuid('user_id')
            .notNull()
            .references(() => users.id, { onDelete: 'cascade' }),
        companyName: varchar('company_name', { length: 255 }).notNull(),
        /** Сфера деятельности (УР-07) */
        industry: varchar('industry', { length: 255 }),
        description: text('description'),
        website: varchar('website', { length: 255 }),
        city: varchar('city', { length: 100 }).default('Кемерово'),
        address: text('address'),
        contactPerson: varchar('contact_person', { length: 255 }),
        contactRole: varchar('contact_role', { length: 255 }),
        contactEmail: varchar('contact_email', { length: 255 }),
        contactTelegram: varchar('contact_telegram', { length: 100 }),
        avatarUrl: varchar('avatar_url', { length: 500 }),
        /** Модерация организации (УР-11, ФР-08) */
        verificationStatus: companyVerificationEnum('verification_status')
            .default('PENDING')
            .notNull(),
        verificationNote: text('verification_note'),
        verifiedAt: timestamp('verified_at', { withTimezone: true }),
        createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
        updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
    },
    (t) => [
        uniqueIndex('organizations_user_id_idx').on(t.userId),
        index('organizations_verification_idx').on(t.verificationStatus),
    ],
);

// === СПРАВОЧНИКИ (УР-12, ФР-09) ===

/** Категории проектов */
export const projectCategories = pgTable('project_categories', {
    id: uuid('id').primaryKey().defaultRandom(),
    name: varchar('name', { length: 100 }).notNull(),
    slug: varchar('slug', { length: 100 }).notNull(),
    description: text('description'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

/** Классификатор навыков / техностека (УР-12) */
export const skills = pgTable(
    'skills',
    {
        id: uuid('id').primaryKey().defaultRandom(),
        name: varchar('name', { length: 100 }).notNull(),
        slug: varchar('slug', { length: 100 }).notNull(),
        category: skillCategoryEnum('category').default('HARD').notNull(),
        description: text('description'),
        isActive: boolean('is_active').default(true).notNull(),
        createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    },
    (t) => [
        uniqueIndex('skills_name_idx').on(t.name),
        uniqueIndex('skills_slug_idx').on(t.slug),
    ],
);

// === НАВЫКИ ===

/** Навыки студента (УР-04) */
export const studentSkills = pgTable(
    'student_skills',
    {
        studentId: uuid('student_id')
            .notNull()
            .references(() => students.id, { onDelete: 'cascade' }),
        skillId: uuid('skill_id')
            .notNull()
            .references(() => skills.id, { onDelete: 'cascade' }),
        proficiencyLevel: proficiencyLevelEnum('proficiency_level')
            .default('INTERMEDIATE')
            .notNull(),
    },
    (t) => [uniqueIndex('student_skills_pk').on(t.studentId, t.skillId)],
);

/** Требуемые навыки проекта + важность (ER: Project_Skills / importance_level) */
export const projectSkills = pgTable(
    'project_skills',
    {
        projectId: uuid('project_id')
            .notNull()
            .references(() => projects.id, { onDelete: 'cascade' }),
        skillId: uuid('skill_id')
            .notNull()
            .references(() => skills.id, { onDelete: 'cascade' }),
        importanceLevel: importanceLevelEnum('importance_level').default('IMPORTANT').notNull(),
        /** Желаемый минимум уровня владения */
        minProficiencyLevel: proficiencyLevelEnum('min_proficiency_level')
            .default('BASIC')
            .notNull(),
    },
    (t) => [uniqueIndex('project_skills_pk').on(t.projectId, t.skillId)],
);

// === РЕЗЮМЕ / ПОРТФОЛИО (УР-04, ФР-02) ===

/** Загруженное резюме + результат ИИ-парсинга */
export const resumes = pgTable(
    'resumes',
    {
        id: uuid('id').primaryKey().defaultRandom(),
        studentId: uuid('student_id')
            .notNull()
            .references(() => students.id, { onDelete: 'cascade' }),
        fileName: varchar('file_name', { length: 255 }).notNull(),
        fileUrl: varchar('file_url', { length: 500 }).notNull(),
        mimeType: varchar('mime_type', { length: 100 }).notNull(),
        /** Извлечённый текст после парсинга */
        parsedText: text('parsed_text'),
        /** Структурированный результат ИИ-разбора (JSON) */
        aiParsedData: jsonb('ai_parsed_data'),
        isPrimary: boolean('is_primary').default(false).notNull(),
        createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    },
    (t) => [index('resumes_student_idx').on(t.studentId)],
);

/** Опыт / выполненные проекты студента (УР-04) */
export const portfolioItems = pgTable(
    'portfolio_items',
    {
        id: uuid('id').primaryKey().defaultRandom(),
        studentId: uuid('student_id')
            .notNull()
            .references(() => students.id, { onDelete: 'cascade' }),
        title: varchar('title', { length: 255 }).notNull(),
        description: text('description'),
        role: varchar('role', { length: 100 }),
        technologies: jsonb('technologies').$type<string[]>().default([]),
        url: varchar('url', { length: 500 }),
        startedAt: date('started_at'),
        finishedAt: date('finished_at'),
        createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    },
    (t) => [index('portfolio_student_idx').on(t.studentId)],
);

// === ДРУЗЬЯ / НАПАРНИКИ (командный отклик) ===

/**
 * Связь «друг / напарник» между студентами.
 * После ACCEPTED пара может подаваться на проект вместе.
 * Хранится одна строка на ненаправленную пару: studentId < partnerId.
 */
export const studentConnections = pgTable(
    'student_connections',
    {
        id: uuid('id').primaryKey().defaultRandom(),
        /** Меньший id из пары (нормализация, чтобы пара не дублировалась) */
        studentId: uuid('student_id')
            .notNull()
            .references(() => students.id, { onDelete: 'cascade' }),
        /** Больший id из пары */
        partnerId: uuid('partner_id')
            .notNull()
            .references(() => students.id, { onDelete: 'cascade' }),
        status: connectionRequestStatusEnum('status').default('PENDING').notNull(),
        /** Кто инициировал запрос */
        requestedBy: uuid('requested_by')
            .notNull()
            .references(() => students.id, { onDelete: 'cascade' }),
        respondedAt: timestamp('responded_at', { withTimezone: true }),
        createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
        updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
    },
    (t) => [
        uniqueIndex('student_connections_pair_idx').on(t.studentId, t.partnerId),
        index('student_connections_student_idx').on(t.studentId, t.status),
        index('student_connections_partner_idx').on(t.partnerId, t.status),
        // Запрет «себе себе» и обратного дубля пары на уровне БД
        check('student_connections_pair_check', sql`student_id < partner_id`),
    ],
);

// === ПРОЕКТЫ (УР-05/08, ФР-03/06) ===

export const projects = pgTable(
    'projects',
    {
        id: uuid('id').primaryKey().defaultRandom(),
        organizationId: uuid('organization_id')
            .notNull()
            .references(() => organizations.id, { onDelete: 'cascade' }),
        categoryId: uuid('category_id').references(() => projectCategories.id, {
            onDelete: 'set null',
        }),
        title: varchar('title', { length: 255 }).notNull(),
        description: text('description').notNull(),
        /** Ожидаемые результаты (УР-08) */
        expectedResults: text('expected_results'),
        /** Условия сотрудничества (УР-08) */
        conditions: text('conditions'),
        type: projectTypeEnum('type').default('INTERNSHIP').notNull(),
        difficulty: difficultyLevelEnum('difficulty').default('JUNIOR').notNull(),
        employmentType: employmentTypeEnum('employment_type').default('PROJECT').notNull(),
        status: projectStatusEnum('status').default('DRAFT').notNull(),
        teamSize: varchar('team_size', { length: 100 }).default('1–3 студента'),
        city: varchar('city', { length: 100 }),
        isRemote: boolean('is_remote').default(true).notNull(),
        deadline: timestamp('deadline', { withTimezone: true }),
        /** Эмбеддинг требований для векторного поиска (НФР-12) */
        embedding: vector384('embedding'),
        createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
        updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
    },
    (t) => [
        index('projects_org_idx').on(t.organizationId),
        index('projects_status_idx').on(t.status),
        index('projects_type_idx').on(t.type),
        index('projects_difficulty_idx').on(t.difficulty),
        index('projects_employment_idx').on(t.employmentType),
        index('projects_category_idx').on(t.categoryId),
    ],
);

// === ОТКЛИКИ (УР-06/10, ФР-05/07) + КОМАНДНЫЕ ЗАЯВКИ ===

/**
 * Отклик на проект.
 * studentId — инициатор (LEAD). Состав команды — в application_members.
 * Соло-заявка: только lead. Команда: lead + partners (напарники).
 */
export const applications = pgTable(
    'applications',
    {
        id: uuid('id').primaryKey().defaultRandom(),
        projectId: uuid('project_id')
            .notNull()
            .references(() => projects.id, { onDelete: 'cascade' }),
        /** Инициатор отклика (всегда входит в состав команды как LEAD) */
        studentId: uuid('student_id')
            .notNull()
            .references(() => students.id, { onDelete: 'cascade' }),
        /** true, если подаются вдвоём/командой */
        isTeam: boolean('is_team').default(false).notNull(),
        status: applicationStatusEnum('status').default('PENDING').notNull(),
        /** Комментарий при смене статуса (для компании/админа) */
        statusComment: text('status_comment'),
        statusChangedAt: timestamp('status_changed_at', { withTimezone: true }),
        statusChangedBy: uuid('status_changed_by').references(() => users.id, {
            onDelete: 'set null',
        }),
        /** Результаты ИИ-пайплайна (ФР-04/07) — по каждому участнику или агрегат */
        aiMatchScore: real('ai_match_score'),
        aiFeedback: jsonb('ai_feedback'),
        coverLetter: text('cover_letter'),
        createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
        updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
    },
    (t) => [
        uniqueIndex('applications_lead_unique_idx').on(t.projectId, t.studentId),
        index('applications_student_idx').on(t.studentId),
        index('applications_project_status_idx').on(t.projectId, t.status),
    ],
);

/**
 * Состав команды отклика: кто именно подаётся (lead + напарники).
 * project_id денормализован, чтобы unique(student_id, project_id)
 * запрещал вторую заявку того же студента на тот же проект.
 */
export const applicationMembers = pgTable(
    'application_members',
    {
        applicationId: uuid('application_id')
            .notNull()
            .references(() => applications.id, { onDelete: 'cascade' }),
        studentId: uuid('student_id')
            .notNull()
            .references(() => students.id, { onDelete: 'cascade' }),
        projectId: uuid('project_id')
            .notNull()
            .references(() => projects.id, { onDelete: 'cascade' }),
        role: applicationMemberRoleEnum('role').default('MEMBER').notNull(),
        /** Индивидуальная ИИ-оценка участника (для команды) */
        aiMatchScore: real('ai_match_score'),
        joinedAt: timestamp('joined_at', { withTimezone: true }).defaultNow().notNull(),
    },
    (t) => [
        uniqueIndex('application_members_app_student_idx').on(t.applicationId, t.studentId),
        uniqueIndex('application_members_student_project_idx').on(t.studentId, t.projectId),
        index('application_members_project_idx').on(t.projectId),
    ],
);

// === ЧАТ ===

export const chats = pgTable(
    'chats',
    {
        id: uuid('id').primaryKey().defaultRandom(),
        applicationId: uuid('application_id')
            .notNull()
            .references(() => applications.id, { onDelete: 'cascade' }),
        createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
        updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
    },
    (t) => [uniqueIndex('chats_application_idx').on(t.applicationId)],
);

export const messages = pgTable(
    'messages',
    {
        id: uuid('id').primaryKey().defaultRandom(),
        chatId: uuid('chat_id')
            .notNull()
            .references(() => chats.id, { onDelete: 'cascade' }),
        senderId: uuid('sender_id')
            .notNull()
            .references(() => users.id, { onDelete: 'cascade' }),
        content: text('content').notNull(),
        isRead: boolean('is_read').default(false).notNull(),
        createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    },
    (t) => [
        index('messages_chat_idx').on(t.chatId, t.createdAt),
        index('messages_sender_idx').on(t.senderId),
    ],
);

// === УВЕДОМЛЕНИЯ (ФР-05) ===

export const notifications = pgTable(
    'notifications',
    {
        id: uuid('id').primaryKey().defaultRandom(),
        userId: uuid('user_id')
            .notNull()
            .references(() => users.id, { onDelete: 'cascade' }),
        type: notificationTypeEnum('type').notNull(),
        title: varchar('title', { length: 255 }).notNull(),
        body: text('body'),
        /** Ссылка на сущность (application id, project id и т.п.) */
        link: varchar('link', { length: 500 }),
        isRead: boolean('is_read').default(false).notNull(),
        createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    },
    (t) => [
        index('notifications_user_read_idx').on(t.userId, t.isRead),
    ],
);

// === СИСТЕМНЫЕ ЛОГИ (ФР-09, НФР-02) ===

export const systemLogs = pgTable(
    'system_logs',
    {
        id: uuid('id').primaryKey().defaultRandom(),
        level: varchar('level', { length: 20 }).notNull(), // info | warn | error
        source: varchar('source', { length: 100 }).notNull(), // backend | ai-service | admin
        message: text('message').notNull(),
        context: jsonb('context'),
        userId: uuid('user_id').references(() => users.id, { onDelete: 'set null' }),
        createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    },
    (t) => [
        index('system_logs_level_idx').on(t.level),
        index('system_logs_created_idx').on(t.createdAt),
    ],
);

// Типы для удобства в controllers/services
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Student = typeof students.$inferSelect;
export type NewStudent = typeof students.$inferInsert;
export type Organization = typeof organizations.$inferSelect;
export type NewOrganization = typeof organizations.$inferInsert;
export type Project = typeof projects.$inferSelect;
export type NewProject = typeof projects.$inferInsert;
export type Application = typeof applications.$inferSelect;
export type NewApplication = typeof applications.$inferInsert;
export type ApplicationMember = typeof applicationMembers.$inferSelect;
export type NewApplicationMember = typeof applicationMembers.$inferInsert;
export type StudentConnection = typeof studentConnections.$inferSelect;
export type NewStudentConnection = typeof studentConnections.$inferInsert;
