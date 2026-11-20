import type { Request } from 'express'
import { AppError } from '../errors/AppError.js'

/** Безопасный id из path params (Express 5 типизирует как string | string[]) */
export function paramId(req: Request, name = 'id'): string {
    const raw = req.params[name]
    const value = Array.isArray(raw) ? raw[0] : raw
    if (!value) {
        throw AppError.badRequest(`Параметр :${name} обязателен`)
    }
    return value
}

/** Строковый query-параметр без массивов */
export function queryStr(req: Request, name: string): string | undefined {
    const raw = req.query[name]
    if (typeof raw === 'string' && raw.trim()) {
        return raw.trim()
    }
    return undefined
}

/** Убрать undefined-ключи (для exactOptionalPropertyTypes) */
export function compact<T extends Record<string, unknown>>(obj: T): Partial<T> {
    const out: Record<string, unknown> = {}
    for (const [k, v] of Object.entries(obj)) {
        if (v !== undefined) {
            out[k] = v
        }
    }
    return out as Partial<T>
}
