import type { NextFunction, Request, Response } from 'express'
import { AppError } from '../errors/AppError.js'
import { db } from '../db/index.js'
import { systemLogs } from '../db/schema.js'

/** Лог критической ошибки в system_logs (НФР-02, ФР-09) */
export async function logSystemError(
    message: string,
    context?: Record<string, unknown>,
    userId?: string,
): Promise<void> {
    try {
        await db.insert(systemLogs).values({
            level: 'error',
            source: 'backend',
            message,
            context: context ?? {},
            ...(userId ? { userId } : {}),
        })
    } catch (error) {
        console.error('Failed to write system_logs:', error)
    }
}

/** 404 для неизвестных маршрутов */
export function notFoundHandler(req: Request, res: Response) {
    res.status(404).json({
        error: 'Маршрут не найден',
        code: 'NOT_FOUND',
        path: req.originalUrl,
    })
}

/** Глобальный обработчик ошибок Express */
export function errorHandler(err: unknown, req: Request, res: Response, _next: NextFunction) {
    if (err instanceof AppError) {
        res.status(err.statusCode).json({
            error: err.message,
            code: err.code,
            ...(err.details !== undefined ? { details: err.details } : {}),
        })
        return
    }

    // Ошибки валидации/парсинга body
    if (err instanceof SyntaxError && 'body' in err) {
        res.status(400).json({ error: 'Некорректный JSON в теле запроса', code: 'BAD_JSON' })
        return
    }

    const message = err instanceof Error ? err.message : String(err)
    const stack = err instanceof Error ? err.stack : undefined

    console.error('Unhandled error:', message, stack)
    void logSystemError(message, {
        method: req.method,
        path: req.originalUrl,
        stack,
    })

    res.status(500).json({
        error: 'Внутренняя ошибка сервера',
        code: 'INTERNAL',
    })
}

/** Обёртка async-контроллеров: пробрасывает ошибки в errorHandler */
export function asyncHandler<
    T extends (req: Request, res: Response, next: NextFunction) => Promise<unknown>,
>(fn: T) {
    return (req: Request, res: Response, next: NextFunction) => {
        Promise.resolve(fn(req, res, next)).catch(next)
    }
}
