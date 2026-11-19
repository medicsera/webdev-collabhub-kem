import type { Request, Response } from 'express'
import { AppError } from '../errors/AppError.js'
import { asyncHandler } from '../middleware/errorHandler.js'
import { organizationsRepo, projectsRepo } from '../db/repositories/index.js'
import { compact, paramId, queryStr } from '../utils/request.js'
import type { NewOrganization } from '../db/schema.js'

async function getOwnOrganization(req: Request) {
    if (!req.user?.userId) {
        throw AppError.unauthorized()
    }
    const org = await organizationsRepo.findByUserId(req.user.userId)
    if (!org) {
        throw AppError.notFound('Профиль организации не найден')
    }
    return org
}

/** GET /api/v1/organizations/me */
export const getMyOrganization = asyncHandler(async (req: Request, res: Response) => {
    const org = await getOwnOrganization(req)
    res.json(org)
})

/** PATCH /api/v1/organizations/me */
export const updateMyOrganization = asyncHandler(async (req: Request, res: Response) => {
    const org = await getOwnOrganization(req)

    const body = req.body as Partial<NewOrganization>
    const allowed: (keyof NewOrganization)[] = [
        'companyName',
        'industry',
        'description',
        'website',
        'city',
        'address',
        'contactPerson',
        'contactRole',
        'contactEmail',
        'contactTelegram',
        'avatarUrl',
    ]

    const patch: Partial<NewOrganization> = {}
    for (const key of allowed) {
        if (body[key] !== undefined) {
            ;(patch as Record<string, unknown>)[key] = body[key]
        }
    }

    if (!Object.keys(patch).length) {
        throw AppError.badRequest('Нет полей для обновления')
    }

    const updated = await organizationsRepo.update(org.id, patch)
    res.json(updated)
})

/** GET /api/v1/organizations/:id — публичный профиль */
export const getOrganizationById = asyncHandler(async (req: Request, res: Response) => {
    const org = await organizationsRepo.requireById(paramId(req))
    const projects = await projectsRepo.list(
        { organizationId: org.id, status: 'ACTIVE' },
        { page: 1, limit: 20, offset: 0 },
    )

    const { verificationNote: _note, ...publicOrg } = org

    res.json({
        ...publicOrg,
        projects: projects.items.map((p) => ({
            id: p.id,
            title: p.title,
            type: p.type,
            difficulty: p.difficulty,
            status: p.status,
        })),
    })
})

/** GET /api/v1/organizations */
export const listOrganizations = asyncHandler(async (req: Request, res: Response) => {
    const page = Number(queryStr(req, 'page')) || 1
    const limit = Number(queryStr(req, 'limit')) || 20

    const result = await organizationsRepo.list(
        compact({
            search: queryStr(req, 'search'),
            verificationStatus: queryStr(req, 'verificationStatus'),
        }),
        { page, limit, offset: (page - 1) * limit },
    )

    res.json(result)
})
