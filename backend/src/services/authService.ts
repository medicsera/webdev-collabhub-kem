import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { AppError } from '../errors/AppError.js'

const JWT_SECRET = process.env.JWT_SECRET || 'collabhub-dev-jwt-secret-change-me'
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d'

export type Role = 'STUDENT' | 'COMPANY' | 'ADMIN'

export interface JwtPayload {
    userId: string
    email: string
    role: Role
}

export async function hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 10)
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash)
}

export function signToken(payload: JwtPayload): string {
    const options: jwt.SignOptions = {
        expiresIn: JWT_EXPIRES_IN as NonNullable<jwt.SignOptions['expiresIn']>,
    }
    return jwt.sign(payload, JWT_SECRET, options)
}

export function verifyToken(token: string): JwtPayload {
    try {
        return jwt.verify(token, JWT_SECRET) as JwtPayload
    } catch {
        throw AppError.unauthorized('Недействительный или истёкший токен')
    }
}
