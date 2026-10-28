import { pgTable, serial, text, varchar, timestamp, pgEnum, integer, jsonb, real, boolean } from 'drizzle-orm/pg-core';

// === ENUMS ===
export const proficiencyLevelEnum = pgEnum('proficiency_level', [
    'BASIC',
    'INTERMEDIATE',
    'ADVANCED',
]);

export const roleEnum = pgEnum('role', [
    'STUDENT',
    'COMPANY',
    'ADMIN'
]);

export const applicationStatusEnum = pgEnum('application_status', [
    'PENDING',
    'REVIEWING',
    'ACCEPTED',
    'REJECTED'
]);

// === CORE TABLES ===

// Единая таблица пользователей для авторизации
export const users = pgTable('users', {
    id: serial('id').primaryKey(),
    email: varchar('email', { length: 255 }).notNull().unique(),
    passwordHash: varchar('password_hash', { length: 255 }).notNull(),
    role: roleEnum('role').default('STUDENT').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const companies = pgTable('companies', {
    id: serial('id').primaryKey(),
    userId: integer('user_id').references(() => users.id), // Привязка к аккаунту
    name: varchar('name', { length: 255 }).notNull(),
    department: varchar('department', { length: 255 }),
    industry: varchar('industry', { length: 255 }),
    city: varchar('city', { length: 100 }).default('г. Кемерово'),
    address: text('address'),
    website: varchar('website', { length: 255 }),
    contactPerson: varchar('contact_person', { length: 255 }),
    contactRole: varchar('contact_role', { length: 255 }),
    contactTelegram: varchar('contact_telegram', { length: 100 }),
    contactEmail: varchar('contact_email', { length: 255 }),
    description: text('description'),
    avatarUrl: varchar('avatar_url', { length: 255 }),
    createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const students = pgTable('students', {
    id: serial('id').primaryKey(),
    userId: integer('user_id').references(() => users.id), // Привязка к аккаунту
    name: varchar('name', { length: 255 }).notNull(),
    group: varchar('group', { length: 100 }).notNull(),
    year: varchar('year', { length: 50 }).notNull(),
    university: varchar('university', { length: 255 }).default('КемГУ'),
    specialization: varchar('specialization', { length: 255 }),
    telegram: varchar('telegram', { length: 100 }),
    city: varchar('city', { length: 100 }).default('Кемерово'),
    status: varchar('status', { length: 100 }).default('Готов к практике'),
    bio: text('bio'),
    avatarUrl: varchar('avatar_url', { length: 255 }),
    embedding: jsonb('embedding'), // Хранение векторного представления профиля
    createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const projects = pgTable('projects', {
    id: serial('id').primaryKey(),
    companyId: integer('company_id').references(() => companies.id),
    title: varchar('title', { length: 255 }).notNull(),
    company: varchar('company', { length: 255 }).notNull(),
    department: varchar('department', { length: 255 }),
    type: varchar('type', { length: 100 }).notNull().default('ВКР / Диплом'),
    teamSize: varchar('team_size', { length: 100 }).default('2–3 студента'),
    description: text('description').notNull(),
    embedding: jsonb('embedding'), // Хранение векторного представления требований
    createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const skills = pgTable('skills', {
    id: serial('id').primaryKey(),
    name: varchar('name', { length: 100 }).notNull().unique(),
    category: varchar('category', { length: 50 }).default('hard'),
});

export const projectRequiredSkills = pgTable('project_required_skills', {
    id: serial('id').primaryKey(),
    projectId: integer('project_id').notNull().references(() => projects.id),
    skillId: integer('skill_id').notNull().references(() => skills.id),
    minProficiencyLevel: proficiencyLevelEnum('min_proficiency_level').notNull().default('BASIC'),
});

export const studentSkills = pgTable('student_skills', {
    id: serial('id').primaryKey(),
    studentId: integer('student_id').notNull().references(() => students.id),
    skillId: integer('skill_id').notNull().references(() => skills.id),
    proficiencyLevel: proficiencyLevelEnum('proficiency_level').notNull().default('INTERMEDIATE'),
});

// === AI & BUSINESS LOGIC TABLES ===

// Отклики на проекты
export const applications = pgTable('applications', {
    id: serial('id').primaryKey(),
    projectId: integer('project_id').notNull().references(() => projects.id),
    studentId: integer('student_id').notNull().references(() => students.id),
    status: applicationStatusEnum('status').notNull().default('PENDING'),

    // Результаты ИИ-пайплайна
    aiMatchScore: real('ai_match_score'),
    aiFeedback: jsonb('ai_feedback'),

    coverLetter: text('cover_letter'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Чаты привязанные к конкретному отклику
export const chats = pgTable('chats', {
    id: serial('id').primaryKey(),
    applicationId: integer('application_id').notNull().references(() => applications.id),
    createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Сообщения внутри чата
export const messages = pgTable('messages', {
    id: serial('id').primaryKey(),
    chatId: integer('chat_id').notNull().references(() => chats.id),
    senderId: integer('sender_id').notNull().references(() => users.id),
    content: text('content').notNull(),
    isRead: boolean('is_read').default(false).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
});