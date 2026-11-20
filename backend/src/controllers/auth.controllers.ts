import type { Request, Response } from 'express'
import { AppError } from '../errors/AppError.js'
import { asyncHandler } from '../middleware/errorHandler.js'
import { withTransaction } from '../db/transaction.js'
import { mustOne } from '../db/mustOne.js'
import {
    organizationsRepo,
    studentsRepo,
    usersRepo,
} from '../db/repositories/index.js'
import {
    hashPassword,
    signToken,
    verifyPassword,
    type Role,
} from '../services/authService.js'

interface RegisterBody {
    email?: string
    password?: string
    role?: Role
    // student
    firstName?: string
    lastName?: string
    universityGroup?: string
    year?: string
    university?: string
    specialization?: string
    telegram?: string
    city?: string
    phone?: string
    bio?: string
    // company
    companyName?: string
    industry?: string
    description?: string
    website?: string
    contactEmail?: string
    contactPerson?: string
}

/**
 * POST /api/v1/auth/register
 * Регистрация + создание профиля student/organization (УР-03, УР-07, ФР-01)
 */
export const register = asyncHandler(async (req: Request, res: Response) => {
    const body = req.body as RegisterBody
    const email = body.email?.trim().toLowerCase()
    const password = body.password
    const role: Role = body.role ?? 'STUDENT'

    if (!email || !password) {
        throw AppError.badRequest('email и password обязательны')
    }
    if (password.length < 6) {
        throw AppError.badRequest('Пароль должен быть не короче 6 символов')
    }
    if (!['STUDENT', 'COMPANY', 'ADMIN'].includes(role)) {
        throw AppError.badRequest('Недопустимая роль')
    }

    const existing = await usersRepo.findByEmail(email)
    if (existing) {
        throw AppError.conflict('Пользователь с таким email уже существует')
    }

    if (role === 'STUDENT') {
        if (!body.firstName || !body.lastName || !body.universityGroup || !body.year) {
            throw AppError.badRequest(
                'Для студента обязательны firstName, lastName, universityGroup, year',
            )
        }
    }
    if (role === 'COMPANY') {
        if (!body.companyName) {
            throw AppError.badRequest('Для компании обязательно companyName')
        }
    }

    const passwordHash = await hashPassword(password)

    const result = await withTransaction(async (tx) => {
        const user = mustOne(
            await usersRepo.create(
                {
                    email,
                    passwordHash,
                    role,
                    isBlocked: false,
                },
                tx,
            ),
            'Пользователь',
        )

        let studentId: string | null = null
        let organizationId: string | null = null

        if (role === 'STUDENT') {
            const student = mustOne(
                await studentsRepo.create(
                    {
                        userId: user.id,
                        firstName: body.firstName!,
                        lastName: body.lastName!,
                        universityGroup: body.universityGroup!,
                        year: body.year!,
                        university: body.university ?? 'КемГУ',
                        specialization: body.specialization,
                        telegram: body.telegram,
                        city: body.city ?? 'Кемерово',
                        phone: body.phone,
                        bio: body.bio,
                    },
                    tx,
                ),
                'Профиль студента',
            )
            studentId = student.id
        }

        if (role === 'COMPANY') {
            const org = mustOne(
                await organizationsRepo.create(
                    {
                        userId: user.id,
                        companyName: body.companyName!,
                        industry: body.industry,
                        description: body.description,
                        website: body.website,
                        contactEmail: body.contactEmail ?? email,
                        contactPerson: body.contactPerson,
                        city: body.city ?? 'Кемерово',
                        verificationStatus: 'PENDING',
                    },
                    tx,
                ),
                'Профиль организации',
            )
            organizationId = org.id
        }

        return { user, studentId, organizationId }
    })

    const token = signToken({
        userId: result.user.id,
        email: result.user.email,
        role: result.user.role as Role,
    })

    res.status(201).json({
        id: result.user.id,
        email: result.user.email,
        role: result.user.role,
        studentId: result.studentId,
        organizationId: result.organizationId,
        token,
    })
})

/**
 * POST /api/v1/auth/login
 */
export const login = asyncHandler(async (req: Request, res: Response) => {
    const { email, password } = req.body as { email?: string; password?: string }

    if (!email || !password) {
        throw AppError.badRequest('email и password обязательны')
    }

    const user = await usersRepo.findByEmail(email.trim().toLowerCase())
    if (!user) {
        throw AppError.unauthorized('Неверный email или пароль')
    }
    if (user.isBlocked) {
        throw AppError.forbidden('Учётная запись заблокирована')
    }

    const ok = await verifyPassword(password, user.passwordHash)
    if (!ok) {
        throw AppError.unauthorized('Неверный email или пароль')
    }

    const token = signToken({
        userId: user.id,
        email: user.email,
        role: user.role as Role,
    })

    res.json({
        token,
        role: user.role,
        id: user.id,
    })
})

/**
 * GET /api/v1/auth/me
 */
export const me = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) {
        throw AppError.unauthorized()
    }

    const user = await usersRepo.findById(req.user.userId)
    if (!user) {
        throw AppError.unauthorized('Пользователь не найден')
    }

    const student = await studentsRepo.findByUserId(user.id)
    const organization = await organizationsRepo.findByUserId(user.id)

    res.json({
        id: user.id,
        email: user.email,
        role: user.role,
        isBlocked: user.isBlocked,
        createdAt: user.createdAt,
        student,
        organization,
    })
})
