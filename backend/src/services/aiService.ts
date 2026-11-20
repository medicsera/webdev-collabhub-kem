export class AiService {
    private readonly baseUrl = process.env.AI_SERVICE_URL ?? 'http://localhost:8001'

    async runPipeline(
        studentSkills: string[],
        projectTitle: string,
        projectDescription: string,
        projectRequirements: string[],
    ): Promise<{
        aiMatchScore: number
        aiFeedback: unknown
        studentEmbedding: string | null
        projectEmbedding: string | null
    }> {
        const response = await fetch(`${this.baseUrl}/api/v1/pipeline`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                student_skills: studentSkills,
                project_title: projectTitle,
                project_description: projectDescription,
                project_requirements: projectRequirements,
            }),
        })

        if (!response.ok) {
            const errorDetails = await response.text()
            console.error('FastAPI Error Details:', errorDetails)
            throw new Error(`AI service Error ${response.status}`)
        }

        const data = await response.json()
        return {
            aiMatchScore: data.match_score,
            aiFeedback: data.analysis,
            studentEmbedding: data.student_embedding ?? null,
            projectEmbedding: data.project_embedding ?? null,
        }
    }

    /** Семантический матч навыков студента и требований проекта (эмбеддинги MiniLM, 0-100) */
    async match(
        studentSkills: Array<{ name: string; proficiency_level?: string }> | string[],
        projectRequirements: Array<{ name: string; importance_level?: string }> | string[],
    ): Promise<number> {
        const response = await fetch(`${this.baseUrl}/api/v1/match`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                student_skills: studentSkills,
                project_requirements: projectRequirements,
            }),
        })

        if (!response.ok) {
            const errorDetails = await response.text()
            console.error('Match error:', errorDetails)
            throw new Error(`AI service match error ${response.status}`)
        }

        const data = await response.json()
        return data.match_score
    }

    /** Векторизация произвольного текста → строка для pgvector */
    async embed(text: string): Promise<string | null> {
        try {
            const response = await fetch(`${this.baseUrl}/api/v1/embed`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text }),
            })
            if (!response.ok) {
                console.error('Embed error:', await response.text())
                return null
            }
            const data = await response.json()
            return data.embeddings?.[0] ?? null
        } catch (error) {
            console.error('Embed failed:', error)
            return null
        }
    }

    /** GigaChat-разбор пробелов (без эмбеддингов) — для блока рекомендаций */
    async analyze(
        studentSkills: string[],
        projectTitle: string,
        projectDescription: string,
        projectRequirements: string[],
        extra?: { studentBio?: string | undefined; matchScore?: number | undefined },
    ): Promise<{
        summary: string
        matching_skills: string[]
        missing_skills: string[]
        recommendations: string[]
    }> {
        const response = await fetch(`${this.baseUrl}/api/v1/analyze`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                student_skills: studentSkills,
                project_title: projectTitle,
                project_description: projectDescription,
                project_requirements: projectRequirements,
                student_bio: extra?.studentBio,
                match_score: extra?.matchScore,
            }),
        })
        if (!response.ok) {
            const errorDetails = await response.text()
            console.error('Analyze error:', errorDetails)
            throw new Error(`AI service analyze error ${response.status}`)
        }
        return response.json()
    }

    /**
     * Комплексная оценка соответствия LLM (GigaChat):
     * Что хорошо, что плохо, стоит ли отправлять заявку, и персональные советы.
     */
    async evaluateCompetencies(
        studentSkills: string[],
        projectTitle: string,
        projectDescription: string,
        projectRequirements: string[],
        extra?: { studentBio?: string | undefined; matchScore?: number | undefined },
    ): Promise<CompetenceEvaluationResult> {
        try {
            const response = await fetch(`${this.baseUrl}/api/v1/evaluate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    student_skills: studentSkills,
                    project_title: projectTitle,
                    project_description: projectDescription,
                    project_requirements: projectRequirements,
                    student_bio: extra?.studentBio,
                    match_score: extra?.matchScore,
                }),
            })
            if (response.ok) {
                const data = await response.json()
                return {
                    verdict: data.verdict,
                    verdictTitle: data.verdict_title,
                    pros: data.pros ?? [],
                    cons: data.cons ?? [],
                    summary: data.summary,
                    recommendations: data.recommendations ?? [],
                    coverLetterTip: data.cover_letter_tip,
                    matchScore: Math.round(data.match_score ?? extra?.matchScore ?? 75),
                }
            }
        } catch (err) {
            console.warn('[AI notice] evaluateCompetencies fallback:', err)
        }

        return generateHeuristicEvaluation(
            studentSkills,
            projectTitle,
            projectDescription,
            projectRequirements,
            extra?.studentBio,
            extra?.matchScore,
        )
    }
}

export interface CompetenceEvaluationResult {
    verdict: 'RECOMMENDED' | 'CONSIDER' | 'NOT_RECOMMENDED'
    verdictTitle: string
    pros: string[]
    cons: string[]
    summary: string
    recommendations: string[]
    coverLetterTip?: string
    matchScore: number
}

/**
 * Интеллектуальный эвристический генератор оценки компетенций.
 * Используется как надежный fallback при недоступности внешнего LLM-сервиса.
 */
export function generateHeuristicEvaluation(
    studentSkills: string[],
    projectTitle: string,
    _projectDescription: string,
    projectRequirements: string[],
    _studentBio?: string,
    matchScore?: number,
): CompetenceEvaluationResult {
    const studentSet = new Set(studentSkills.map((s) => s.trim().toLowerCase()))
    const reqList = projectRequirements.filter((r) => Boolean(r && r.trim()))

    const matching = reqList.filter((r) => studentSet.has(r.trim().toLowerCase()))
    const missing = reqList.filter((r) => !studentSet.has(r.trim().toLowerCase()))

    const ratio = matching.length / Math.max(1, reqList.length)
    const score = matchScore ?? Math.min(98, Math.max(45, Math.round(45 + ratio * 50)))

    let verdict: 'RECOMMENDED' | 'CONSIDER' | 'NOT_RECOMMENDED'
    let verdictTitle: string
    let pros: string[] = []
    let cons: string[] = []

    if (score >= 75) {
        verdict = 'RECOMMENDED'
        verdictTitle = 'Стоит отправлять заявку'
        pros = [
            `Отличное совпадение ключевого стека: ${matching.length > 0 ? matching.join(', ') : 'базовые профильные навыки'}.`,
            'Высокая готовность к выполнению основных производственных задач проекта.',
            'Профиль выглядит конкурентоспособно среди студенческих заявок.',
        ]
        cons = missing.length > 0
            ? [`Желательно перед стартом освежить знания по: ${missing.join(', ')}.`]
            : ['Существенных технических пробелов не обнаружено.']
    } else if (score >= 50) {
        verdict = 'CONSIDER'
        verdictTitle = 'Стоит попробовать (есть нюансы)'
        pros = [
            `Частичное совпадение стека: подтверждены ${matching.length > 0 ? matching.join(', ') : 'смежные компетенции'}.`,
            'Хорошая база для быстрого дообучения в ходе выполнения проекта.',
        ]
        cons = [
            `Не закрыты важные требования проекта: ${missing.length > 0 ? missing.join(', ') : 'специализированные фреймворки'}.`,
            'Потребуется уделить дополнительное время на освоение инструментов на старте.',
        ]
    } else {
        verdict = 'NOT_RECOMMENDED'
        verdictTitle = 'Лучше подтянуть стек перед откликом'
        pros = matching.length > 0
            ? [`Имеются базовые точки соприкосновения: ${matching.join(', ')}.`]
            : ['Общая заинтересованность в технологическом направлении.']
        cons = [
            `Отсутствует большая часть обязательного стека: ${missing.join(', ')}.`,
            'Высокий риск сложностей на этапе технического интервью и онбординга.',
        ]
    }

    const summary = `Семантическое соответствие с проектом «${projectTitle}» составляет ${score}%. Закрыто ${matching.length} из ${reqList.length} ключевых требований. ${
        verdict === 'RECOMMENDED'
            ? 'Ваш профиль оптимально подходит под требования компании.'
            : verdict === 'CONSIDER'
            ? 'Подача имеет смысл, если вы готовы аргументировать свою мотивацию в сопроводительном письме.'
            : 'Рекомендуется предварительно изучить недостающие технологии и выложить примеры в портфолио.'
    }`

    const recommendations = missing.length > 0
        ? [
              `Пройти базовые туториалы или создать пет-проект с использованием: ${missing.slice(0, 2).join(', ')}.`,
              'Ознакомиться с официальной документацией и лучшими практиками архитектуры проекта.',
          ]
        : [
              'Подготовить ссылки на релевантные репозитории GitHub для демонстрации наставнику.',
              'Продумать архитектурные решения типовых задач проекта перед техническим собеседованием.',
          ]

    const coverLetterTip = matching.length > 0
        ? `В сопроводительном письме подчеркните свой опыт с ${matching.slice(0, 3).join(', ')}${
              missing.length > 0 ? ` и напишите, что уже приступили к изучению ${missing[0]}` : ''
          }.`
        : 'Сделайте акцент на высокой мотивации, профильных курсах и скорости освоения новых технологий.'

    return {
        verdict,
        verdictTitle,
        pros,
        cons,
        summary,
        recommendations,
        coverLetterTip,
        matchScore: score,
    }
}

/** Сводка GigaChat-анализа → один абзац для profile.aiFeedback */
export function formatAiFeedback(
    analysis: {
        summary?: string
        matching_skills?: string[]
        missing_skills?: string[]
        recommendations?: string[]
    },
    projectTitle: string,
    matchScore: number,
    studentSkills?: string[],
): string {
    // Страховка: missing без пересечения с навыками студента не показываем
    const skillSet = new Set((studentSkills ?? []).map((s) => s.trim().toLowerCase()))
    const missing = studentSkills
        ? (analysis.missing_skills ?? []).filter(
              (m) => !skillSet.has(m.trim().toLowerCase()),
          )
        : (analysis.missing_skills ?? []).filter(Boolean)

    const parts: string[] = []
    const summary = analysis.summary?.trim()
    if (summary) {
        parts.push(summary)
    } else {
        parts.push(
            `Ваш профиль показывает ${Math.round(matchScore)}% семантического соответствия с требованиями проекта «${projectTitle}».`,
        )
    }
    if (missing.length > 0) {
        parts.push(`Стоит закрыть пробелы: ${missing.join(', ')}.`)
    }
    const recs = analysis.recommendations?.filter(Boolean) ?? []
    if (recs.length > 0) {
        parts.push(recs.join(' '))
    }
    return parts.join(' ')
}

export const aiService = new AiService()
