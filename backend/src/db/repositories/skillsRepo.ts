import { and, eq, inArray } from 'drizzle-orm'
import { db } from '../index.js'
import { skills, studentSkills, projectSkills } from '../schema.js'
import type { Tx } from '../transaction.js'
import { AppError } from '../../errors/AppError.js'
import type { NewSkill } from '../schema.js'

export type DbOrTx = typeof db | Tx

export const skillsRepo = {
    async findById(id: string, executor: DbOrTx = db) {
        const rows = await executor.select().from(skills).where(eq(skills.id, id)).limit(1)
        return rows[0] ?? null
    },

    async findByName(name: string, executor: DbOrTx = db) {
        const rows = await executor.select().from(skills).where(eq(skills.name, name)).limit(1)
        return rows[0] ?? null
    },

    async create(data: NewSkill, executor: DbOrTx = db) {
        const [row] = await executor.insert(skills).values(data).returning()
        return row
    },

    async update(id: string, data: Partial<NewSkill>, executor: DbOrTx = db) {
        const [row] = await executor.update(skills).set(data).where(eq(skills.id, id)).returning()
        return row ?? null
    },

    async remove(id: string, executor: DbOrTx = db) {
        await executor.delete(skills).where(eq(skills.id, id))
    },

    async listActive(executor: DbOrTx = db) {
        return executor.select().from(skills).where(eq(skills.isActive, true))
    },

    async listAll(executor: DbOrTx = db) {
        return executor.select().from(skills)
    },

    async findByIds(ids: string[], executor: DbOrTx = db) {
        if (!ids.length) return []
        return executor.select().from(skills).where(inArray(skills.id, ids))
    },

    /** Навыки проекта (важность + уровень) */
    async getProjectSkills(projectId: string, executor: DbOrTx = db) {
        return executor
            .select({
                skillId: skills.id,
                name: skills.name,
                slug: skills.slug,
                category: skills.category,
                importanceLevel: projectSkills.importanceLevel,
                minProficiencyLevel: projectSkills.minProficiencyLevel,
            })
            .from(projectSkills)
            .innerJoin(skills, eq(projectSkills.skillId, skills.id))
            .where(eq(projectSkills.projectId, projectId))
    },

    /** Полная замена требований проекта (вызывать внутри транзакции) */
    async replaceProjectSkills(
        projectId: string,
        items: {
            skillId: string
            importanceLevel?: 'CRITICAL' | 'IMPORTANT' | 'OPTIONAL'
            minProficiencyLevel?: 'BASIC' | 'INTERMEDIATE' | 'ADVANCED'
        }[],
        executor: DbOrTx = db,
    ) {
        await executor.delete(projectSkills).where(eq(projectSkills.projectId, projectId))
        if (items.length) {
            await executor.insert(projectSkills).values(
                items.map((s) => ({
                    projectId,
                    skillId: s.skillId,
                    importanceLevel: s.importanceLevel ?? 'IMPORTANT',
                    minProficiencyLevel: s.minProficiencyLevel ?? 'BASIC',
                })),
            )
        }
    },

    /** Названия навыков студента — для AI-пайплайна */
    async getStudentSkillNames(studentId: string, executor: DbOrTx = db): Promise<string[]> {
        const rows = await executor
            .select({ name: skills.name })
            .from(studentSkills)
            .innerJoin(skills, eq(studentSkills.skillId, skills.id))
            .where(eq(studentSkills.studentId, studentId))
        return rows.map((r) => r.name)
    },

    async getProjectSkillNames(projectId: string, executor: DbOrTx = db): Promise<string[]> {
        const rows = await executor
            .select({ name: skills.name })
            .from(projectSkills)
            .innerJoin(skills, eq(projectSkills.skillId, skills.id))
            .where(eq(projectSkills.projectId, projectId))
        return rows.map((r) => r.name)
    },

    async requireById(id: string, executor: DbOrTx = db) {
        const skill = await this.findById(id, executor)
        if (!skill) throw AppError.notFound(`Навык не найден: ${id}`)
        return skill
    },
}
