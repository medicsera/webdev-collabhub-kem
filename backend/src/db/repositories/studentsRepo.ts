import { and, eq, ilike, or, sql } from 'drizzle-orm'
import { db } from '../index.js'
import { students, studentSkills, skills } from '../schema.js'
import type { Tx } from '../transaction.js'
import { AppError } from '../../errors/AppError.js'
import type { NewStudent } from '../schema.js'
import type { PagedResult, PaginationParams, StudentListFilters } from '../../types/query.js'

export type DbOrTx = typeof db | Tx

export const studentsRepo = {
    async findById(id: string, executor: DbOrTx = db) {
        const rows = await executor.select().from(students).where(eq(students.id, id)).limit(1)
        return rows[0] ?? null
    },

    async findByUserId(userId: string, executor: DbOrTx = db) {
        const rows = await executor.select().from(students).where(eq(students.userId, userId)).limit(1)
        return rows[0] ?? null
    },

    async create(data: NewStudent, executor: DbOrTx = db) {
        const [row] = await executor.insert(students).values(data).returning()
        return row
    },

    async update(id: string, data: Partial<NewStudent>, executor: DbOrTx = db) {
        const [row] = await executor
            .update(students)
            .set({ ...data, updatedAt: new Date() })
            .where(eq(students.id, id))
            .returning()
        return row ?? null
    },

    async setEmbedding(id: string, embedding: string, executor: DbOrTx = db) {
        const [row] = await executor
            .update(students)
            .set({ embedding, updatedAt: new Date() })
            .where(eq(students.id, id))
            .returning()
        return row ?? null
    },

    async getSkills(studentId: string, executor: DbOrTx = db) {
        return executor
            .select({
                skillId: skills.id,
                name: skills.name,
                slug: skills.slug,
                category: skills.category,
                proficiencyLevel: studentSkills.proficiencyLevel,
            })
            .from(studentSkills)
            .innerJoin(skills, eq(studentSkills.skillId, skills.id))
            .where(eq(studentSkills.studentId, studentId))
    },

    /** Полная замена списка навыков студента (в транзакции вызывать снаружи) */
    async replaceSkills(
        studentId: string,
        items: { skillId: string; proficiencyLevel: 'BASIC' | 'INTERMEDIATE' | 'ADVANCED' }[],
        executor: DbOrTx = db,
    ) {
        await executor.delete(studentSkills).where(eq(studentSkills.studentId, studentId))
        if (items.length) {
            await executor.insert(studentSkills).values(
                items.map((s) => ({ studentId, skillId: s.skillId, proficiencyLevel: s.proficiencyLevel })),
            )
        }
    },

    async list(
        filters: StudentListFilters,
        pagination: PaginationParams,
        executor: DbOrTx = db,
    ): Promise<PagedResult<typeof students.$inferSelect>> {
        const conditions = []
        if (filters.specialization) {
            conditions.push(ilike(students.specialization, `%${filters.specialization}%`))
        }
        if (filters.universityGroup) {
            conditions.push(eq(students.universityGroup, filters.universityGroup))
        }
        if (filters.search) {
            const term = `%${filters.search}%`
            conditions.push(
                or(
                    ilike(students.firstName, term),
                    ilike(students.lastName, term),
                    ilike(students.specialization, term),
                )!,
            )
        }
        const where = conditions.length ? and(...conditions) : undefined

        const [countRow] = await executor
            .select({ total: sql<number>`count(*)::int` })
            .from(students)
            .where(where)
        const items = await executor
            .select()
            .from(students)
            .where(where)
            .limit(pagination.limit)
            .offset(pagination.offset)

        return { items, page: pagination.page, limit: pagination.limit, total: countRow?.total ?? 0 }
    },

    async requireById(id: string, executor: DbOrTx = db) {
        const student = await this.findById(id, executor)
        if (!student) throw AppError.notFound('Студент не найден')
        return student
    },
}
