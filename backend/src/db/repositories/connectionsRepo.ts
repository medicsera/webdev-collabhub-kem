import { and, eq, or, sql } from 'drizzle-orm'
import { db } from '../index.js'
import { studentConnections, students } from '../schema.js'
import type { Tx } from '../transaction.js'
import { AppError } from '../../errors/AppError.js'
import type { NewStudentConnection } from '../schema.js'
import type { ConnectionListFilters, PagedResult, PaginationParams } from '../../types/query.js'

export type DbOrTx = typeof db | Tx

/** Нормализация ненаправленной пары: studentId < partnerId */
export function normalizePair(studentId: string, partnerId: string) {
    return studentId < partnerId
        ? { studentId, partnerId }
        : { studentId: partnerId, partnerId: studentId }
}

export const connectionsRepo = {
    async findById(id: string, executor: DbOrTx = db) {
        const rows = await executor
            .select()
            .from(studentConnections)
            .where(eq(studentConnections.id, id))
            .limit(1)
        return rows[0] ?? null
    },

    async findPair(a: string, b: string, executor: DbOrTx = db) {
        const pair = normalizePair(a, b)
        const rows = await executor
            .select()
            .from(studentConnections)
            .where(
                and(
                    eq(studentConnections.studentId, pair.studentId),
                    eq(studentConnections.partnerId, pair.partnerId),
                ),
            )
            .limit(1)
        return rows[0] ?? null
    },

    async create(
        data: { requesterStudentId: string; partnerStudentId: string },
        executor: DbOrTx = db,
    ) {
        if (data.requesterStudentId === data.partnerStudentId) {
            throw AppError.badRequest('Нельзя добавить себя в напарники')
        }
        const pair = normalizePair(data.requesterStudentId, data.partnerStudentId)
        const existing = await this.findPair(data.requesterStudentId, data.partnerStudentId, executor)
        if (existing) {
            throw AppError.conflict('Связь между студентами уже существует', {
                status: existing.status,
            })
        }

        const values: NewStudentConnection = {
            ...pair,
            status: 'PENDING',
            requestedBy: data.requesterStudentId,
        }
        const [row] = await executor.insert(studentConnections).values(values).returning()
        return row
    },

    async updateStatus(
        id: string,
        status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'CANCELLED',
        executor: DbOrTx = db,
    ) {
        const [row] = await executor
            .update(studentConnections)
            .set({
                status,
                respondedAt: status !== 'PENDING' ? new Date() : null,
                updatedAt: new Date(),
            })
            .where(eq(studentConnections.id, id))
            .returning()
        return row ?? null
    },

    async remove(id: string, executor: DbOrTx = db) {
        await executor.delete(studentConnections).where(eq(studentConnections.id, id))
    },

    /** Список связей студента (в обе стороны пары) */
    async listForStudent(
        studentId: string,
        filters: ConnectionListFilters,
        pagination: PaginationParams,
        executor: DbOrTx = db,
    ) {
        const pairCond = or(
            eq(studentConnections.studentId, studentId),
            eq(studentConnections.partnerId, studentId),
        )!
        const conditions = [pairCond]
        if (filters.status) {
            conditions.push(
                eq(
                    studentConnections.status,
                    filters.status as typeof studentConnections.status.enumValues[number],
                ),
            )
        }
        const where = and(...conditions)

        const [countRow] = await executor
            .select({ total: sql<number>`count(*)::int` })
            .from(studentConnections)
            .where(where)

        const rows = await executor
            .select({
                connection: studentConnections,
                studentA: students,
            })
            .from(studentConnections)
            .innerJoin(students, eq(studentConnections.studentId, students.id))
            .where(where)
            .limit(pagination.limit)
            .offset(pagination.offset)

        // Догружаем вторую сторону пары
        const items = await Promise.all(
            rows.map(async (r) => {
                const partnerId =
                    r.connection.studentId === studentId
                        ? r.connection.partnerId
                        : r.connection.studentId
                const [partner] = await executor
                    .select()
                    .from(students)
                    .where(eq(students.id, partnerId))
                    .limit(1)

                return {
                    ...r.connection,
                    partner: partner
                        ? {
                              id: partner.id,
                              firstName: partner.firstName,
                              lastName: partner.lastName,
                              avatarUrl: partner.avatarUrl,
                          }
                        : null,
                }
            }),
        )

        return {
            items,
            page: pagination.page,
            limit: pagination.limit,
            total: countRow?.total ?? 0,
        }
    },

    /** ID всех ACCEPTED-напарников студента */
    async acceptedPartnerIds(studentId: string, executor: DbOrTx = db): Promise<string[]> {
        const rows = await executor
            .select()
            .from(studentConnections)
            .where(
                and(
                    or(
                        eq(studentConnections.studentId, studentId),
                        eq(studentConnections.partnerId, studentId),
                    )!,
                    eq(studentConnections.status, 'ACCEPTED'),
                ),
            )
        return rows.map((r) =>
            r.studentId === studentId ? r.partnerId : r.studentId,
        )
    },

    async arePartners(a: string, b: string, executor: DbOrTx = db): Promise<boolean> {
        const pair = normalizePair(a, b)
        const rows = await executor
            .select()
            .from(studentConnections)
            .where(
                and(
                    eq(studentConnections.studentId, pair.studentId),
                    eq(studentConnections.partnerId, pair.partnerId),
                    eq(studentConnections.status, 'ACCEPTED'),
                ),
            )
            .limit(1)
        return rows.length > 0
    },

    async requireById(id: string, executor: DbOrTx = db) {
        const connection = await this.findById(id, executor)
        if (!connection) throw AppError.notFound('Связь не найдена')
        return connection
    },
}
