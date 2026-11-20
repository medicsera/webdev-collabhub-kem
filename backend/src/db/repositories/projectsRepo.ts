import { and, desc, eq, ilike, inArray, sql, type SQL } from 'drizzle-orm'
import { db } from '../index.js'
import { projects, organizations, projectCategories, projectSkills, skills } from '../schema.js'
import type { Tx } from '../transaction.js'
import { AppError } from '../../errors/AppError.js'
import type { NewProject } from '../schema.js'
import type { PagedResult, PaginationParams, ProjectListFilters } from '../../types/query.js'

export type DbOrTx = typeof db | Tx

function buildProjectWhere(filters: ProjectListFilters): SQL | undefined {
    const conditions: SQL[] = []
    if (filters.status) {
        conditions.push(
            eq(projects.status, filters.status as typeof projects.status.enumValues[number]),
        )
    }
    if (filters.type) {
        conditions.push(eq(projects.type, filters.type as typeof projects.type.enumValues[number]))
    }
    if (filters.difficulty) {
        conditions.push(
            eq(projects.difficulty, filters.difficulty as typeof projects.difficulty.enumValues[number]),
        )
    }
    if (filters.employmentType) {
        conditions.push(
            eq(
                projects.employmentType,
                filters.employmentType as typeof projects.employmentType.enumValues[number],
            ),
        )
    }
    if (filters.categoryId) {
        conditions.push(eq(projects.categoryId, filters.categoryId))
    }
    if (filters.organizationId) {
        conditions.push(eq(projects.organizationId, filters.organizationId))
    }
    if (filters.search) {
        const term = `%${filters.search}%`
        conditions.push(ilike(projects.title, term))
    }
    return conditions.length ? and(...conditions) : undefined
}

export const projectsRepo = {
    async findById(id: string, executor: DbOrTx = db) {
        const rows = await executor.select().from(projects).where(eq(projects.id, id)).limit(1)
        return rows[0] ?? null
    },

    async create(data: NewProject, executor: DbOrTx = db) {
        const [row] = await executor.insert(projects).values(data).returning()
        return row
    },

    async update(id: string, data: Partial<NewProject>, executor: DbOrTx = db) {
        const [row] = await executor
            .update(projects)
            .set({ ...data, updatedAt: new Date() })
            .where(eq(projects.id, id))
            .returning()
        return row ?? null
    },

    async setStatus(
        id: string,
        status: 'DRAFT' | 'ACTIVE' | 'CLOSED' | 'ARCHIVED',
        executor: DbOrTx = db,
    ) {
        return this.update(id, { status }, executor)
    },

    async setEmbedding(id: string, embedding: string, executor: DbOrTx = db) {
        return this.update(id, { embedding }, executor)
    },

    async remove(id: string, executor: DbOrTx = db) {
        await executor.delete(projects).where(eq(projects.id, id))
    },

    /** Каталог с фильтрами (ФР-03) */
    async list(
        filters: ProjectListFilters,
        pagination: PaginationParams,
        executor: DbOrTx = db,
    ): Promise<PagedResult<typeof projects.$inferSelect & { organization: unknown; skills: unknown[] }>> {
        let where = buildProjectWhere(filters)

        // Фильтр по навыку через project_skills
        if (filters.skillId) {
            const skillProjects = executor
                .select({ id: projectSkills.projectId })
                .from(projectSkills)
                .where(eq(projectSkills.skillId, filters.skillId))
            const skillFilter = inArray(projects.id, skillProjects)
            where = where ? and(where, skillFilter) : skillFilter
        }

        const [countRow] = await executor
            .select({ total: sql<number>`count(*)::int` })
            .from(projects)
            .where(where)

        const rows = await executor
            .select({
                project: projects,
                organization: organizations,
                category: projectCategories,
            })
            .from(projects)
            .leftJoin(organizations, eq(projects.organizationId, organizations.id))
            .leftJoin(projectCategories, eq(projects.categoryId, projectCategories.id))
            .where(where)
            .orderBy(desc(projects.createdAt))
            .limit(pagination.limit)
            .offset(pagination.offset)

        const items = await Promise.all(
            rows.map(async (r) => ({
                ...r.project,
                organization: r.organization
                    ? {
                          id: r.organization.id,
                          companyName: r.organization.companyName,
                          avatarUrl: r.organization.avatarUrl,
                          city: r.organization.city,
                      }
                    : null,
                category: r.category,
                skills: await executor
                    .select({
                        skillId: skills.id,
                        name: skills.name,
                        importanceLevel: projectSkills.importanceLevel,
                    })
                    .from(projectSkills)
                    .innerJoin(skills, eq(projectSkills.skillId, skills.id))
                    .where(eq(projectSkills.projectId, r.project.id)),
            })),
        )

        return {
            items,
            page: pagination.page,
            limit: pagination.limit,
            total: countRow?.total ?? 0,
        }
    },

    async requireById(id: string, executor: DbOrTx = db) {
        const project = await this.findById(id, executor)
        if (!project) throw AppError.notFound('Проект не найден')
        return project
    },
}
