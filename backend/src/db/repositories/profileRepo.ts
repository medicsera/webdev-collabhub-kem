import { desc, eq } from 'drizzle-orm'
import { db } from '../index.js'
import { portfolioItems, resumes } from '../schema.js'
import type { Tx } from '../transaction.js'
import { AppError } from '../../errors/AppError.js'
import { mustOne } from '../mustOne.js'
import type { NewPortfolioItem, NewResume } from '../schema.js'

export type DbOrTx = typeof db | Tx

export const resumesRepo = {
    async listByStudent(studentId: string, executor: DbOrTx = db) {
        return executor
            .select()
            .from(resumes)
            .where(eq(resumes.studentId, studentId))
            .orderBy(desc(resumes.createdAt))
    },

    async findById(id: string, executor: DbOrTx = db) {
        const rows = await executor.select().from(resumes).where(eq(resumes.id, id)).limit(1)
        return rows[0] ?? null
    },

    async create(data: NewResume, executor: DbOrTx = db) {
        return mustOne(await executor.insert(resumes).values(data).returning(), 'Резюме')
    },

    async update(id: string, data: Partial<NewResume>, executor: DbOrTx = db) {
        const rows = await executor
            .update(resumes)
            .set(data)
            .where(eq(resumes.id, id))
            .returning()
        return rows[0] ?? null
    },

    async remove(id: string, executor: DbOrTx = db) {
        await executor.delete(resumes).where(eq(resumes.id, id))
    },

    async requireOwned(id: string, studentId: string, executor: DbOrTx = db) {
        const resume = await this.findById(id, executor)
        if (!resume || resume.studentId !== studentId) {
            throw AppError.notFound('Резюме не найдено')
        }
        return resume
    },
}

export const portfolioRepo = {
    async listByStudent(studentId: string, executor: DbOrTx = db) {
        return executor
            .select()
            .from(portfolioItems)
            .where(eq(portfolioItems.studentId, studentId))
            .orderBy(desc(portfolioItems.createdAt))
    },

    async findById(id: string, executor: DbOrTx = db) {
        const rows = await executor
            .select()
            .from(portfolioItems)
            .where(eq(portfolioItems.id, id))
            .limit(1)
        return rows[0] ?? null
    },

    async create(data: NewPortfolioItem, executor: DbOrTx = db) {
        return mustOne(
            await executor.insert(portfolioItems).values(data).returning(),
            'Портфолио',
        )
    },

    async update(id: string, data: Partial<NewPortfolioItem>, executor: DbOrTx = db) {
        const rows = await executor
            .update(portfolioItems)
            .set(data)
            .where(eq(portfolioItems.id, id))
            .returning()
        return rows[0] ?? null
    },

    async remove(id: string, executor: DbOrTx = db) {
        await executor.delete(portfolioItems).where(eq(portfolioItems.id, id))
    },

    async requireOwned(id: string, studentId: string, executor: DbOrTx = db) {
        const item = await this.findById(id, executor)
        if (!item || item.studentId !== studentId) {
            throw AppError.notFound('Запись портфолио не найдена')
        }
        return item
    },
}
