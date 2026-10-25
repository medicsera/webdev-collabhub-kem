import { pgTable, serial, text, varchar, timestamp, pgEnum, integer } from 'drizzle-orm/pg-core';

// Уровни владения навыками согласно бенчмарку и требованиям платформы
export const proficiencyLevelEnum = pgEnum('proficiency_level', [
    'BASIC',        // Базовый уровень
    'INTERMEDIATE', // Уверенный / Средний уровень
    'ADVANCED',     // Продвинутый уровень
]);

export const companies = pgTable('companies', {
    id: serial('id').primaryKey(),
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
    createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const skills = pgTable('skills', {
    id: serial('id').primaryKey(),
    name: varchar('name', { length: 100 }).notNull().unique(),
    category: varchar('category', { length: 50 }).default('hard'), // hard / soft
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
    createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Требуемый уровень владения навыками для проекта
export const projectRequiredSkills = pgTable('project_required_skills', {
    id: serial('id').primaryKey(),
    projectId: integer('project_id').notNull().references(() => projects.id),
    skillId: integer('skill_id').notNull().references(() => skills.id),
    minProficiencyLevel: proficiencyLevelEnum('min_proficiency_level').notNull().default('BASIC'),
});

export const students = pgTable('students', {
    id: serial('id').primaryKey(),
    name: varchar('name', { length: 255 }).notNull(),
    group: varchar('group', { length: 100 }).notNull(),
    year: varchar('year', { length: 50 }).notNull(),
    university: varchar('university', { length: 255 }).default('КемГУ'),
    specialization: varchar('specialization', { length: 255 }),
    telegram: varchar('telegram', { length: 100 }),
    city: varchar('city', { length: 100 }).default('Кемерово'),
    status: varchar('status', { length: 100 }).default('Готов к практике'),
    bio: text('bio'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Уровень владения навыками у конкретного студента
export const studentSkills = pgTable('student_skills', {
    id: serial('id').primaryKey(),
    studentId: integer('student_id').notNull().references(() => students.id),
    skillId: integer('skill_id').notNull().references(() => skills.id),
    proficiencyLevel: proficiencyLevelEnum('proficiency_level').notNull().default('INTERMEDIATE'),
});