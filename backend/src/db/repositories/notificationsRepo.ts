import { and, desc, eq, sql } from 'drizzle-orm'
import { db } from '../index.js'
import { notifications } from '../schema.js'
import type { Tx } from '../transaction.js'
import { AppError } from '../../errors/AppError.js'
import { mustOne } from '../mustOne.js'
import type { NewNotification } from '../schema.js'
import type { NotificationListFilters, PaginationParams } from '../../types/query.js'

export type DbOrTx = typeof db | Tx

export interface NotificationPage {
    items: (typeof notifications.$inferSelect)[]
    page: number
    limit: number
    total: number
    unreadCount: number
}

export const notificationsRepo = {
    async create(data: NewNotification, executor: DbOrTx = db) {
        return mustOne(await executor.insert(notifications).values(data).returning(), 'Уведомление')
    },

    async createMany(items: NewNotification[], executor: DbOrTx = db) {
        if (!items.length) return []
        return executor.insert(notifications).values(items).returning()
    },

    async list(
        filters: NotificationListFilters,
        pagination: PaginationParams,
        executor: DbOrTx = db,
    ): Promise<NotificationPage> {
        const conditions = []
        if (filters.userId) conditions.push(eq(notifications.userId, filters.userId))
        if (filters.unread) conditions.push(eq(notifications.isRead, false))
        const where = conditions.length ? and(...conditions) : undefined

        const [countRow] = await executor
            .select({ total: sql<number>`count(*)::int` })
            .from(notifications)
            .where(where)

        const [unreadRow] = await executor
            .select({ total: sql<number>`count(*)::int` })
            .from(notifications)
            .where(
                filters.userId
                    ? and(eq(notifications.userId, filters.userId), eq(notifications.isRead, false))
                    : eq(notifications.isRead, false),
            )

        const items = await executor
            .select()
            .from(notifications)
            .where(where)
            .orderBy(desc(notifications.createdAt))
            .limit(pagination.limit)
            .offset(pagination.offset)

        return {
            items,
            page: pagination.page,
            limit: pagination.limit,
            total: countRow?.total ?? 0,
            unreadCount: unreadRow?.total ?? 0,
        }
    },

    async markRead(id: string, userId: string, executor: DbOrTx = db) {
        const rows = await executor
            .update(notifications)
            .set({ isRead: true })
            .where(and(eq(notifications.id, id), eq(notifications.userId, userId)))
            .returning()
        return rows[0] ?? null
    },

    async markAllRead(userId: string, executor: DbOrTx = db) {
        const rows = await executor
            .update(notifications)
            .set({ isRead: true })
            .where(and(eq(notifications.userId, userId), eq(notifications.isRead, false)))
            .returning()
        return rows.length
    },

    async requireById(id: string, executor: DbOrTx = db) {
        const rows = await executor
            .select()
            .from(notifications)
            .where(eq(notifications.id, id))
            .limit(1)
        const row = rows[0]
        if (!row) throw AppError.notFound('Уведомление не найдено')
        return row
    },
}
