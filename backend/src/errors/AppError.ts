/** HTTP-ошибка с кодом и понятным сообщением для клиента */
export class AppError extends Error {
    readonly statusCode: number
    readonly code: string
    readonly details?: unknown

    constructor(statusCode: number, message: string, code = 'ERROR', details?: unknown) {
        super(message)
        this.name = 'AppError'
        this.statusCode = statusCode
        this.code = code
        this.details = details
    }

    static badRequest(message = 'Некорректный запрос', details?: unknown) {
        return new AppError(400, message, 'BAD_REQUEST', details)
    }

    static unauthorized(message = 'Требуется авторизация') {
        return new AppError(401, message, 'UNAUTHORIZED')
    }

    static forbidden(message = 'Недостаточно прав') {
        return new AppError(403, message, 'FORBIDDEN')
    }

    static notFound(message = 'Ресурс не найден') {
        return new AppError(404, message, 'NOT_FOUND')
    }

    static conflict(message = 'Конфликт данных', details?: unknown) {
        return new AppError(409, message, 'CONFLICT', details)
    }

    static internal(message = 'Внутренняя ошибка сервера', details?: unknown) {
        return new AppError(500, message, 'INTERNAL', details)
    }
}
