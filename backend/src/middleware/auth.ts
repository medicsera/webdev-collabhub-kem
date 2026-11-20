import type { NextFunction, Request, Response } from 'express'
import { AppError } from '../errors/AppError.js'
import { verifyToken, type JwtPayload, type Role } from '../services/authService.js'
import { usersRepo } from '../db/repositories/index.js'

declare global {
    // eslint-disable-next-line @typescript-eslint/no-namespace
    namespace Express {
        interface Request {
            user?: JwtPayload
        }
    }
}

function extractToken(req: Request): string {
    const header = req.headers.authorization
    if (!header?.startsWith('Bearer ')) {
        throw AppError.unauthorized('Требуется Authorization: Bearer <token>')
    }
    return header.slice('Bearer '.length).trim()
}

/** Только авторизованные (НФР-06/07) */
export function authRequired(req: Request, _res: Response, next: NextFunction) {
    try {
        const token = extractToken(req)
        req.user = verifyToken(token)
        next()
    } catch (error) {
        next(error)
    }
}

/** Ролевая модель (НФР-07) */
export function requireRole(...roles: Role[]) {
    return (req: Request, _res: Response, next: NextFunction) => {
        if (!req.user) {
            next(AppError.unauthorized())
            return
        }
        if (!roles.includes(req.user.role)) {
            next(AppError.forbidden(`Требуется роль: ${roles.join(' | ')}`))
            return
        }
        next()
    }
}

/** Заблокированные пользователи не проходят (УР-11) */
export async function requireNotBlocked(req: Request, _res: Response, next: NextFunction) {
    try {
        if (!req.user) {
            throw AppError.unauthorized()
        }
        const user = await usersRepo.findById(req.user.userId)
        if (!user) {
            throw AppError.unauthorized('Пользователь не найден')
        }
        if (user.isBlocked) {
            throw AppError.forbidden('Учётная запись заблокирована')
        }
        next()
    } catch (error) {
        next(error)
    }
}

/** Удобная цепочка: токен + роль + не заблокирован */
export function requireAuth(...roles: Role[]) {
    const chain = [authRequired, requireNotBlocked]
    if (roles.length) {
        chain.push(requireRole(...roles))
    }
    return chain
}
