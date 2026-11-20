import { AppError } from '../errors/AppError.js'

/**
 * `.returning()[0]` в strict-mode даёт `T | undefined`.
 * Хелпер гарантирует, что INSERT/UPDATE вернул строку.
 */
export function mustOne<T>(rows: T | T[] | undefined, entity = 'Запись'): T {
    const row = Array.isArray(rows) ? rows[0] : rows
    if (row === undefined || row === null) {
        throw AppError.internal(`${entity}: операция не вернула результат`)
    }
    return row
}

export function mustSome<T>(rows: T[] | undefined, entity = 'Записи'): T[] {
    return rows ?? []
}
