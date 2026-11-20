import { and, eq, ilike, or, sql } from 'drizzle-orm'
import { db } from '../index.js'
import { users } from '../schema.js'
import type { Tx } from '../transaction.js'
import { AppError } from '../../errors/AppError.js'
import type { PagedResult, PaginationParams } from '../../types/query.js'
import type { NewUser } from '../schema.js'

export type DbOrTx = typeof db | Tx

export const usersRepo = {
    async findByEmail(email: string, executor: DbOrTx = db) {
        const rows = await executor.select().from(users).where(eq(users.email, email)).limit(1)
        return rows[0] ?? null
    },

    async findById(id: string, executor: DbOrTx = db) {
        const rows = await executor.select().from(users).where(eq(users.id, id)).limit(1)
        return rows[0] ?? null
    },

    async create(data: NewUser, executor: DbOrTx = db) {
        const [row] = await executor.insert(users).values(data).returning()
        return row
    },

    async update(id: string, data: Partial<NewUser>, executor: DbOrTx = db) {
        const [row] = await executor
            .update(users)
            .set({ ...data, updatedAt: new Date() })
            .where(eq(users.id, id))
            .returning()
        return row ?? null
    },

    async list(
        filters: { role?: string; isBlocked?: boolean; search?: string },
        pagination: PaginationParams,
        executor: DbOrTx = db,
    ): Promise<PagedResult<typeof users.$inferSelect>> {
        const conditions = []
        if (filters.role) conditions.push(eq(users.role, filters.role as typeof users.role.enumValues[number]))
        if (filters.isBlocked !== undefined) conditions.push(eq(users.isBlocked, filters.isBlocked))
        if (filters.search) {
            conditions.push(or(ilike(users.email, `%${filters.search}%`))!)
        }
        const where = conditions.length ? and(...conditions) : undefined

        const [countRow] = await executor
            .select({ total: sql<number>`count(*)::int` })
            .from(users)
            .where(where)
        const items = await executor
            .select()
            .from(users)
            .where(where)
            .limit(pagination.limit)
            .offset(pagination.offset)

        return { items, page: pagination.page, limit: pagination.limit, total: countRow?.total ?? 0 }
    },

    async requireById(id: string, executor: DbOrTx = db) {
        const user = await this.findById(id, executor)
        if (!user) throw AppError.notFound('Пользователь не найден')
        return user
    },
}
