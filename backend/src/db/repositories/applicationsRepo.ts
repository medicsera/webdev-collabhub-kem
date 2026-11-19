import { and, desc, eq, sql } from 'drizzle-orm'
import { db } from '../index.js'
import { applications, applicationMembers, projects, students, users } from '../schema.js'
import type { Tx } from '../transaction.js'
import { AppError } from '../../errors/AppError.js'
import type { NewApplication, NewApplicationMember } from '../schema.js'
import type { ApplicationListFilters, PagedResult, PaginationParams } from '../../types/query.js'

export type DbOrTx = typeof db | Tx

export const applicationsRepo = {
    async findById(id: string, executor: DbOrTx = db) {
        const rows = await executor
            .select()
            .from(applications)
            .where(eq(applications.id, id))
            .limit(1)
        return rows[0] ?? null
    },

    async findByProjectAndLead(projectId: string, studentId: string, executor: DbOrTx = db) {
        const rows = await executor
            .select()
            .from(applications)
            .where(and(eq(applications.projectId, projectId), eq(applications.studentId, studentId)))
            .limit(1)
        return rows[0] ?? null
    },

    async create(data: NewApplication, executor: DbOrTx = db) {
        const [row] = await executor.insert(applications).values(data).returning()
        return row
    },

    async addMembers(items: NewApplicationMember[], executor: DbOrTx = db) {
        if (!items.length) return []
        return executor.insert(applicationMembers).values(items).returning()
    },

    async getMembers(applicationId: string, executor: DbOrTx = db) {
        return executor
            .select({
                applicationId: applicationMembers.applicationId,
                studentId: applicationMembers.studentId,
                projectId: applicationMembers.projectId,
                role: applicationMembers.role,
                aiMatchScore: applicationMembers.aiMatchScore,
                joinedAt: applicationMembers.joinedAt,
                firstName: students.firstName,
                lastName: students.lastName,
            })
            .from(applicationMembers)
            .innerJoin(students, eq(applicationMembers.studentId, students.id))
            .where(eq(applicationMembers.applicationId, applicationId))
    },

    async updateStatus(
        id: string,
        status: 'PENDING' | 'REVIEWING' | 'INTERVIEW' | 'ACCEPTED' | 'REJECTED',
        options: { comment?: string; changedBy?: string } = {},
        executor: DbOrTx = db,
    ) {
        const [row] = await executor
            .update(applications)
            .set({
                status,
                statusComment: options.comment,
                statusChangedAt: new Date(),
                statusChangedBy: options.changedBy,
                updatedAt: new Date(),
            })
            .where(eq(applications.id, id))
            .returning()
        return row ?? null
    },

    async list(
        filters: ApplicationListFilters,
        pagination: PaginationParams,
        executor: DbOrTx = db,
    ) {
        const conditions = []
        if (filters.projectId) conditions.push(eq(applications.projectId, filters.projectId))
        if (filters.studentId) conditions.push(eq(applications.studentId, filters.studentId))
        if (filters.status) {
            conditions.push(
                eq(applications.status, filters.status as typeof applications.status.enumValues[number]),
            )
        }
        const where = conditions.length ? and(...conditions) : undefined

        const [countRow] = await executor
            .select({ total: sql<number>`count(*)::int` })
            .from(applications)
            .where(where)

        const rows = await executor
            .select({
                application: applications,
                project: projects,
                leadStudent: students,
                leadUser: users,
            })
            .from(applications)
            .innerJoin(projects, eq(applications.projectId, projects.id))
            .innerJoin(students, eq(applications.studentId, students.id))
            .leftJoin(users, eq(students.userId, users.id))
            .where(where)
            .orderBy(desc(applications.createdAt))
            .limit(pagination.limit)
            .offset(pagination.offset)

        const items = await Promise.all(
            rows.map(async (r) => ({
                ...r.application,
                project: {
                    id: r.project.id,
                    title: r.project.title,
                    status: r.project.status,
                },
                lead: {
                    id: r.leadStudent.id,
                    firstName: r.leadStudent.firstName,
                    lastName: r.leadStudent.lastName,
                    email: r.leadUser?.email,
                },
                members: await this.getMembers(r.application.id, executor),
            })),
        )

        return {
            items,
            page: pagination.page,
            limit: pagination.limit,
            total: countRow?.total ?? 0,
        } satisfies PagedResult<(typeof items)[number]>
    },

    async requireById(id: string, executor: DbOrTx = db) {
        const application = await this.findById(id, executor)
        if (!application) throw AppError.notFound('Отклик не найден')
        return application
    },
}
