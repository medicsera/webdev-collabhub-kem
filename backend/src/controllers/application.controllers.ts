import type { Request, Response } from 'express'
import { withTransaction } from '../db/transaction.js'
import { mustOne } from '../db/mustOne.js'
import {
    applicationsRepo,
    connectionsRepo,
    notificationsRepo,
    projectsRepo,
    skillsRepo,
    studentsRepo,
} from '../db/repositories/index.js'
import { AppError } from '../errors/AppError.js'
import { asyncHandler } from '../middleware/errorHandler.js'
import { aiService } from '../services/aiService.js'

/**
 * POST /api/application
 * Подача отклика (соло или командой) + AI-пайплайн + сохранение эмбеддингов.
 */
export const applyForProject = asyncHandler(async (req: Request, res: Response) => {
    const body = req.body as {
        studentId?: string
        projectId?: string
        coverLetter?: string
        partnerIds?: string[]
    }

    // studentId берём из токена (НФР-06/07); body.studentId — fallback
    let studentId = body.studentId
    if (req.user?.userId) {
        const own = await studentsRepo.findByUserId(req.user.userId)
        if (own) {
            studentId = own.id
        }
    }

    const { projectId, coverLetter, partnerIds } = body

    if (!studentId || !projectId) {
        throw AppError.badRequest('studentId (или auth STUDENT) и projectId обязательны')
    }

    const project = await projectsRepo.requireById(projectId)
    const student = await studentsRepo.requireById(studentId)

    const studentSkillsArr = await skillsRepo.getStudentSkillNames(studentId)
    const projectReqsArr = await skillsRepo.getProjectSkillNames(projectId)

    const partners = partnerIds ?? []
    for (const pid of partners) {
        const ok = await connectionsRepo.arePartners(studentId, pid)
        if (!ok) {
            throw AppError.badRequest(`Студент ${pid} не является подтверждённым напарником`)
        }
    }

    const existing = await applicationsRepo.findByProjectAndLead(projectId, studentId)
    if (existing) {
        throw AppError.conflict('Вы уже откликнулись на этот проект')
    }

    let aiMatchScore: number | null = null
    let aiFeedback: unknown = null
    let studentEmbedding: string | null = null
    let projectEmbedding: string | null = null

    try {
        const aiResult = await aiService.runPipeline(
            studentSkillsArr,
            project.title,
            project.description,
            projectReqsArr,
        )
        aiMatchScore = aiResult.aiMatchScore
        aiFeedback = aiResult.aiFeedback
        studentEmbedding = aiResult.studentEmbedding
        projectEmbedding = aiResult.projectEmbedding
    } catch (error) {
        console.error('AI pipeline failed, continue without score:', error)
    }

    if (!studentEmbedding) {
        const profileText = [
            `${student.firstName} ${student.lastName}`,
            student.specialization ?? '',
            student.bio ?? '',
            studentSkillsArr.join(', '),
        ]
            .filter(Boolean)
            .join('. ')
        studentEmbedding = await aiService.embed(profileText)
    }

    if (!projectEmbedding && !project.embedding) {
        projectEmbedding = await aiService.embed(
            `${project.title}. ${project.description}. ${projectReqsArr.join(', ')}`,
        )
    }

    const result = await withTransaction(async (tx) => {
        const application = mustOne(
            await applicationsRepo.create(
                {
                    projectId,
                    studentId,
                    isTeam: partners.length > 0,
                    coverLetter,
                    aiMatchScore: aiMatchScore ?? undefined,
                    aiFeedback: (aiFeedback as Record<string, unknown>) ?? undefined,
                    status: 'PENDING',
                },
                tx,
            ),
            'Отклик',
        )

        const members = [
            {
                applicationId: application.id,
                studentId,
                projectId,
                role: 'LEAD' as const,
                aiMatchScore,
            },
            ...partners.map((pid) => ({
                applicationId: application.id,
                studentId: pid,
                projectId,
                role: 'MEMBER' as const,
                aiMatchScore: null,
            })),
        ]
        await applicationsRepo.addMembers(members, tx)

        if (studentEmbedding) {
            await studentsRepo.setEmbedding(studentId, studentEmbedding, tx)
        }
        const embeddingToSave = projectEmbedding ?? project.embedding
        if (embeddingToSave && embeddingToSave !== project.embedding) {
            await projectsRepo.setEmbedding(projectId, embeddingToSave, tx)
        }

        if (partners.length) {
            const notifs = []
            for (const pid of partners) {
                const partner = await studentsRepo.findById(pid, tx)
                if (partner?.userId) {
                    notifs.push({
                        userId: partner.userId,
                        type: 'SYSTEM' as const,
                        title: 'Вас добавили в командный отклик',
                        body: `Приглашение на проект «${project.title}»`,
                        link: `/applications/${application.id}`,
                    })
                }
            }
            await notificationsRepo.createMany(notifs, tx)
        }

        return { application, members }
    })

    res.status(201).json({
        ...result.application,
        members: result.members,
        embeddingsSaved: {
            student: Boolean(studentEmbedding),
            project: Boolean(projectEmbedding),
        },
    })
})
