import { and, eq, ilike, sql } from 'drizzle-orm'
import { db } from '../index.js'
import { organizations } from '../schema.js'
import type { Tx } from '../transaction.js'
import { AppError } from '../../errors/AppError.js'
import type { NewOrganization } from '../schema.js'
import type { PagedResult, PaginationParams } from '../../types/query.js'

export type DbOrTx = typeof db | Tx

export const organizationsRepo = {
    async findById(id: string, executor: DbOrTx = db) {
        const rows = await executor
            .select()
            .from(organizations)
            .where(eq(organizations.id, id))
            .limit(1)
        return rows[0] ?? null
    },

    async findByUserId(userId: string, executor: DbOrTx = db) {
        const rows = await executor
            .select()
            .from(organizations)
            .where(eq(organizations.userId, userId))
            .limit(1)
        return rows[0] ?? null
    },

    async create(data: NewOrganization, executor: DbOrTx = db) {
        const [row] = await executor.insert(organizations).values(data).returning()
        return row
    },

    async update(id: string, data: Partial<NewOrganization>, executor: DbOrTx = db) {
        const [row] = await executor
            .update(organizations)
            .set({ ...data, updatedAt: new Date() })
            .where(eq(organizations.id, id))
            .returning()
        return row ?? null
    },

    async verify(
        id: string,
        status: 'PENDING' | 'VERIFIED' | 'REJECTED',
        note?: string,
        executor: DbOrTx = db,
    ) {
        const [row] = await executor
            .update(organizations)
            .set({
                verificationStatus: status,
                verificationNote: note,
                verifiedAt: status === 'VERIFIED' ? new Date() : null,
                updatedAt: new Date(),
            })
            .where(eq(organizations.id, id))
            .returning()
        return row ?? null
    },

    async list(
        filters: { verificationStatus?: string | undefined; search?: string | undefined },
        pagination: PaginationParams,
        executor: DbOrTx = db,
    ): Promise<PagedResult<typeof organizations.$inferSelect>> {
        const conditions = []
        if (filters.verificationStatus) {
            conditions.push(
                eq(
                    organizations.verificationStatus,
                    filters.verificationStatus as typeof organizations.verificationStatus.enumValues[number],
                ),
            )
        }
        if (filters.search) {
            conditions.push(ilike(organizations.companyName, `%${filters.search}%`))
        }
        const where = conditions.length ? and(...conditions) : undefined

        const [countRow] = await executor
            .select({ total: sql<number>`count(*)::int` })
            .from(organizations)
            .where(where)
        const items = await executor
            .select()
            .from(organizations)
            .where(where)
            .limit(pagination.limit)
            .offset(pagination.offset)

        return { items, page: pagination.page, limit: pagination.limit, total: countRow?.total ?? 0 }
    },

    async requireById(id: string, executor: DbOrTx = db) {
        const org = await this.findById(id, executor)
        if (!org) throw AppError.notFound('Организация не найдена')
        return org
    },
}
