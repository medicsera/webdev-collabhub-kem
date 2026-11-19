import type { Request, Response } from 'express'
import { AppError } from '../errors/AppError.js'
import { asyncHandler } from '../middleware/errorHandler.js'
import { withTransaction } from '../db/transaction.js'
import {
    portfolioRepo,
    resumesRepo,
    skillsRepo,
    studentsRepo,
} from '../db/repositories/index.js'
import { aiService } from '../services/aiService.js'
import { compact, paramId, queryStr } from '../utils/request.js'
import type { NewPortfolioItem, NewResume, NewStudent } from '../db/schema.js'

async function getOwnStudent(req: Request) {
    if (!req.user?.userId) {
        throw AppError.unauthorized()
    }
    const student = await studentsRepo.findByUserId(req.user.userId)
    if (!student) {
        throw AppError.notFound('Профиль студента не найден')
    }
    return student
}

/** GET /api/v1/students/me */
export const getMyProfile = asyncHandler(async (req: Request, res: Response) => {
    const student = await getOwnStudent(req)
    const skills = await studentsRepo.getSkills(student.id)
    const resumes = await resumesRepo.listByStudent(student.id)
    const portfolio = await portfolioRepo.listByStudent(student.id)

    res.json({ ...student, skills, resumes, portfolio })
})

/** PATCH /api/v1/students/me */
export const updateMyProfile = asyncHandler(async (req: Request, res: Response) => {
    const student = await getOwnStudent(req)

    const body = req.body as Partial<NewStudent>
    const allowed: (keyof NewStudent)[] = [
        'firstName',
        'lastName',
        'universityGroup',
        'year',
        'university',
        'specialization',
        'telegram',
        'city',
        'phone',
        'status',
        'bio',
        'avatarUrl',
    ]

    const patch: Partial<NewStudent> = {}
    for (const key of allowed) {
        if (body[key] !== undefined) {
            ;(patch as Record<string, unknown>)[key] = body[key]
        }
    }

    if (!Object.keys(patch).length) {
        throw AppError.badRequest('Нет полей для обновления')
    }

    const updated = await studentsRepo.update(student.id, patch)
    res.json(updated)
})

/** GET /api/v1/students/:id — публичный профиль */
export const getStudentById = asyncHandler(async (req: Request, res: Response) => {
    const student = await studentsRepo.requireById(paramId(req))
    const skills = await studentsRepo.getSkills(student.id)
    const portfolio = await portfolioRepo.listByStudent(student.id)

    const { embedding: _emb, aiFeedback: _fb, ...publicProfile } = student

    res.json({ ...publicProfile, skills, portfolio })
})

/** GET /api/v1/students */
export const listStudents = asyncHandler(async (req: Request, res: Response) => {
    const page = Number(queryStr(req, 'page')) || 1
    const limit = Number(queryStr(req, 'limit')) || 20

    const result = await studentsRepo.list(
        compact({
            search: queryStr(req, 'search'),
            specialization: queryStr(req, 'specialization'),
            universityGroup: queryStr(req, 'universityGroup'),
        }),
        { page, limit, offset: (page - 1) * limit },
    )
    res.json(result)
})

/** PUT /api/v1/students/me/skills — полная замена */
export const replaceMySkills = asyncHandler(async (req: Request, res: Response) => {
    const student = await getOwnStudent(req)
    const { skills } = req.body as {
        skills?: { skillId: string; proficiencyLevel?: 'BASIC' | 'INTERMEDIATE' | 'ADVANCED' }[]
    }

    if (!Array.isArray(skills)) {
        throw AppError.badRequest('body.skills должен быть массивом')
    }

    for (const item of skills) {
        if (!item?.skillId) {
            throw AppError.badRequest('У каждого навыка обязателен skillId')
        }
        await skillsRepo.requireById(item.skillId)
    }

    await withTransaction(async (tx) => {
        await studentsRepo.replaceSkills(
            student.id,
            skills.map((s) => ({
                skillId: s.skillId,
                proficiencyLevel: s.proficiencyLevel ?? 'INTERMEDIATE',
            })),
            tx,
        )
    })

    const updated = await studentsRepo.getSkills(student.id)
    res.json({ skills: updated })
})

// === Резюме ===

/** GET /api/v1/students/me/resumes */
export const listMyResumes = asyncHandler(async (req: Request, res: Response) => {
    const student = await getOwnStudent(req)
    res.json({ items: await resumesRepo.listByStudent(student.id) })
})

/**
 * POST /api/v1/students/me/resumes
 * JSON (упрощённо): { fileName, fileUrl, mimeType, parsedText?, aiParsedData?, isPrimary? }
 */
export const createResume = asyncHandler(async (req: Request, res: Response) => {
    const student = await getOwnStudent(req)
    const body = req.body as Partial<NewResume> & { text?: string }

    if (!body.fileName || !body.fileUrl || !body.mimeType) {
        throw AppError.badRequest('fileName, fileUrl, mimeType обязательны')
    }

    let parsedText = body.parsedText ?? null
    let aiParsedData = body.aiParsedData ?? null

    if (!aiParsedData && (body.text || parsedText)) {
        const text = body.text || parsedText || ''
        const embedding = await aiService.embed(text)
        aiParsedData = {
            embeddingPreview: embedding ? embedding.slice(0, 80) : null,
            textLength: text.length,
        }
        parsedText = parsedText ?? text
    }

    const resume = await resumesRepo.create({
        studentId: student.id,
        fileName: body.fileName,
        fileUrl: body.fileUrl,
        mimeType: body.mimeType,
        parsedText,
        aiParsedData: aiParsedData as Record<string, unknown> | undefined,
        isPrimary: body.isPrimary ?? false,
    })

    res.status(201).json(resume)
})

/** DELETE /api/v1/students/me/resumes/:id */
export const deleteMyResume = asyncHandler(async (req: Request, res: Response) => {
    const student = await getOwnStudent(req)
    const id = paramId(req)
    await resumesRepo.requireOwned(id, student.id)
    await resumesRepo.remove(id)
    res.status(204).send()
})

/** POST /api/v1/students/me/resumes/:id/analyze */
export const analyzeMyResume = asyncHandler(async (req: Request, res: Response) => {
    const student = await getOwnStudent(req)
    const id = paramId(req)
    const resume = await resumesRepo.requireOwned(id, student.id)

    const text = resume.parsedText || resume.fileName
    const embedding = await aiService.embed(text)

    const aiParsedData = {
        ...(resume.aiParsedData as Record<string, unknown> | undefined),
        embeddingSaved: Boolean(embedding),
        analyzedAt: new Date().toISOString(),
    }

    const updated = await resumesRepo.update(resume.id, { aiParsedData })

    if (embedding) {
        await studentsRepo.setEmbedding(student.id, embedding)
    }

    res.json(updated)
})

// === Портфолио ===

/** GET /api/v1/students/me/portfolio */
export const listMyPortfolio = asyncHandler(async (req: Request, res: Response) => {
    const student = await getOwnStudent(req)
    res.json({ items: await portfolioRepo.listByStudent(student.id) })
})

/** POST /api/v1/students/me/portfolio */
export const createPortfolioItem = asyncHandler(async (req: Request, res: Response) => {
    const student = await getOwnStudent(req)
    const body = req.body as Partial<NewPortfolioItem>

    if (!body.title) {
        throw AppError.badRequest('title обязателен')
    }

    const item = await portfolioRepo.create({
        studentId: student.id,
        title: body.title,
        description: body.description,
        role: body.role,
        technologies: body.technologies ?? [],
        url: body.url,
        startedAt: body.startedAt,
        finishedAt: body.finishedAt,
    })

    res.status(201).json(item)
})

/** PATCH /api/v1/students/me/portfolio/:id */
export const updatePortfolioItem = asyncHandler(async (req: Request, res: Response) => {
    const student = await getOwnStudent(req)
    const id = paramId(req)
    await portfolioRepo.requireOwned(id, student.id)

    const body = req.body as Partial<NewPortfolioItem>
    const allowed: (keyof NewPortfolioItem)[] = [
        'title',
        'description',
        'role',
        'technologies',
        'url',
        'startedAt',
        'finishedAt',
    ]
    const patch: Partial<NewPortfolioItem> = {}
    for (const key of allowed) {
        if (body[key] !== undefined) {
            ;(patch as Record<string, unknown>)[key] = body[key]
        }
    }

    const item = await portfolioRepo.update(id, patch)
    res.json(item)
})

/** DELETE /api/v1/students/me/portfolio/:id */
export const deletePortfolioItem = asyncHandler(async (req: Request, res: Response) => {
    const student = await getOwnStudent(req)
    const id = paramId(req)
    await portfolioRepo.requireOwned(id, student.id)
    await portfolioRepo.remove(id)
    res.status(204).send()
})
