import express, { type Request, type Response } from 'express';
import { eq } from 'drizzle-orm';
import { db } from '../db';
import {
    applications,
    applicationMembers,
    projects,
    skills,
    studentSkills,
    projectSkills,
    students,
} from '../db/schema.js';
import { aiService } from '../services/aiService.js';

export const applyForProject = async (req: Request, res: Response) => {
    try {
        const { studentId, projectId, coverLetter, partnerIds } = req.body as {
            studentId: string
            projectId: string
            coverLetter?: string
            partnerIds?: string[]
        }

        if (!studentId || !projectId) {
            return res.status(400).json({ error: 'studentId и projectId обязательны' })
        }

        const [projectInfo] = await db
            .select({
                title: projects.title,
                description: projects.description,
                embedding: projects.embedding,
            })
            .from(projects)
            .where(eq(projects.id, projectId))

        if (!projectInfo) {
            return res.status(404).json({ error: 'Проект не найден' })
        }

        const [studentInfo] = await db
            .select({
                firstName: students.firstName,
                lastName: students.lastName,
                bio: students.bio,
                specialization: students.specialization,
                embedding: students.embedding,
            })
            .from(students)
            .where(eq(students.id, studentId))

        if (!studentInfo) {
            return res.status(404).json({ error: 'Студент не найден' })
        }

        const studentSkillData = await db
            .select({ name: skills.name })
            .from(studentSkills)
            .innerJoin(skills, eq(studentSkills.skillId, skills.id))
            .where(eq(studentSkills.studentId, studentId))

        const studentSkillsArr = studentSkillData.map((s) => s.name)

        const projectReqsData = await db
            .select({ name: skills.name })
            .from(projectSkills)
            .innerJoin(skills, eq(projectSkills.skillId, skills.id))
            .where(eq(projectSkills.projectId, projectId))

        const projectReqsArr = projectReqsData.map((r) => r.name)

        // ИИ-пайплайн: match score + Gap Analysis + эмбеддинги для pgvector
        const aiResult = await aiService.runPipeline(
            studentSkillsArr,
            projectInfo.title,
            projectInfo.description,
            projectReqsArr,
        )

        // Фолбэк-векторизация, если pipeline не вернул эмбеддинги
        let studentEmbedding = aiResult.studentEmbedding
        let projectEmbedding = aiResult.projectEmbedding

        if (!studentEmbedding) {
            const profileText = [
                `${studentInfo.firstName} ${studentInfo.lastName}`,
                studentInfo.specialization ?? '',
                studentInfo.bio ?? '',
                studentSkillsArr.join(', '),
            ]
                .filter(Boolean)
                .join('. ')
            studentEmbedding = await aiService.embed(profileText)
        }

        if (!projectEmbedding && !projectInfo.embedding) {
            projectEmbedding = await aiService.embed(
                `${projectInfo.title}. ${projectInfo.description}. ${projectReqsArr.join(', ')}`,
            )
        }

        // Сохраняем эмбеддинги в БД (для векторного поиска)
        if (studentEmbedding) {
            await db
                .update(students)
                .set({ embedding: studentEmbedding, updatedAt: new Date() })
                .where(eq(students.id, studentId))
        }

        const embeddingToSave = projectEmbedding ?? projectInfo.embedding
        if (embeddingToSave && embeddingToSave !== projectInfo.embedding) {
            await db
                .update(projects)
                .set({ embedding: embeddingToSave, updatedAt: new Date() })
                .where(eq(projects.id, projectId))
        }

        const [newApplication] = await db
            .insert(applications)
            .values({
                studentId,
                projectId,
                isTeam: Boolean(partnerIds?.length),
                coverLetter,
                aiMatchScore: aiResult.aiMatchScore,
                aiFeedback: aiResult.aiFeedback as Record<string, unknown>,
                status: 'PENDING',
            })
            .returning()

        // Состав команды: LEAD + напарники
        const members = [
            {
                applicationId: newApplication.id,
                studentId,
                projectId,
                role: 'LEAD' as const,
                aiMatchScore: aiResult.aiMatchScore,
            },
            ...(partnerIds ?? []).map((pid) => ({
                applicationId: newApplication.id,
                studentId: pid,
                projectId,
                role: 'MEMBER' as const,
                aiMatchScore: null,
            })),
        ]

        await db.insert(applicationMembers).values(members)

        res.status(201).json({
            ...newApplication,
            members,
            embeddingsSaved: {
                student: Boolean(studentEmbedding),
                project: Boolean(embeddingToSave),
            },
        })
    } catch (error) {
        console.error('Ошибка при подаче заявки:', error)
        res.status(500).json({ error: 'Не удалось обработать заявку на проект' })
    }
}
