import { and, desc, eq, sql } from 'drizzle-orm'
import { db } from '../index.js'
import { chats, messages, applications, users } from '../schema.js'
import type { Tx } from '../transaction.js'
import { AppError } from '../../errors/AppError.js'
import type { NewChat, NewMessage } from '../schema.js'
import type { PagedResult, PaginationParams } from '../../types/query.js'

export type DbOrTx = typeof db | Tx

export const chatsRepo = {
    async findById(id: string, executor: DbOrTx = db) {
        const rows = await executor.select().from(chats).where(eq(chats.id, id)).limit(1)
        return rows[0] ?? null
    },

    async findByApplicationId(applicationId: string, executor: DbOrTx = db) {
        const rows = await executor
            .select()
            .from(chats)
            .where(eq(chats.applicationId, applicationId))
            .limit(1)
        return rows[0] ?? null
    },

    async create(data: NewChat, executor: DbOrTx = db) {
        const [row] = await executor.insert(chats).values(data).returning()
        return row
    },

    /** Чаты, где пользователь участвует (через отклики студента или org user) */
    async listForUser(userId: string, executor: DbOrTx = db) {
        const rows = await executor
            .select({
                chat: chats,
                application: applications,
            })
            .from(chats)
            .innerJoin(applications, eq(chats.applicationId, applications.id))
            .orderBy(desc(chats.updatedAt))
        return rows
    },

    async addMessage(data: NewMessage, executor: DbOrTx = db) {
        const [row] = await executor.insert(messages).values(data).returning()
        await executor
            .update(chats)
            .set({ updatedAt: new Date() })
            .where(eq(chats.id, data.chatId))
        return row
    },

    async listMessages(
        chatId: string,
        pagination: PaginationParams,
        executor: DbOrTx = db,
    ): Promise<PagedResult<typeof messages.$inferSelect>> {
        const where = eq(messages.chatId, chatId)
        const [countRow] = await executor
            .select({ total: sql<number>`count(*)::int` })
            .from(messages)
            .where(where)
        const items = await executor
            .select()
            .from(messages)
            .where(where)
            .orderBy(desc(messages.createdAt))
            .limit(pagination.limit)
            .offset(pagination.offset)

        return {
            items,
            page: pagination.page,
            limit: pagination.limit,
            total: countRow?.total ?? 0,
        }
    },

    async markRead(chatId: string, senderId: string, executor: DbOrTx = db) {
        await executor
            .update(messages)
            .set({ status: 'read' })
            .where(and(eq(messages.chatId, chatId), eq(messages.senderId, senderId)))
    },

    async requireById(id: string, executor: DbOrTx = db) {
        const chat = await this.findById(id, executor)
        if (!chat) throw AppError.notFound('Чат не найден')
        return chat
    },
}
