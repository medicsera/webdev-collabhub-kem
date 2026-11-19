/** Базовая пагинация list-эндпоинтов */
export interface PaginationQuery {
    page?: number | string
    limit?: number | string
    sort?: string
}

export interface PaginationParams {
    page: number
    limit: number
    offset: number
    sort?: string | undefined
}

export interface PagedResult<T> {
    items: T[]
    page: number
    limit: number
    total: number
}

export const DEFAULT_PAGE = 1
export const DEFAULT_LIMIT = 20
export const MAX_LIMIT = 100

export function normalizePagination(query: PaginationQuery = {}): PaginationParams {
    const page = Math.max(1, Number(query.page) || DEFAULT_PAGE)
    const limit = Math.min(MAX_LIMIT, Math.max(1, Number(query.limit) || DEFAULT_LIMIT))
    const sort = typeof query.sort === 'string' && query.sort ? query.sort : undefined
    return {
        page,
        limit,
        offset: (page - 1) * limit,
        sort,
    }
}

/** Фильтры каталога проектов (ФР-03) */
export interface ProjectListFilters {
    search?: string | undefined
    type?: string | undefined
    difficulty?: string | undefined
    employmentType?: string | undefined
    skillId?: string | undefined
    categoryId?: string | undefined
    organizationId?: string | undefined
    status?: string | undefined
}

export interface StudentListFilters {
    search?: string | undefined
    specialization?: string | undefined
    universityGroup?: string | undefined
}

export interface ApplicationListFilters {
    projectId?: string | undefined
    studentId?: string | undefined
    status?: string | undefined
}

export interface ConnectionListFilters {
    studentId?: string | undefined
    status?: string | undefined
}

export interface NotificationListFilters {
    userId?: string | undefined
    unread?: boolean | undefined
}

export interface SystemLogFilters {
    level?: string | undefined
    source?: string | undefined
}
