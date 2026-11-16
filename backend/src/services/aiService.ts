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
        extra?: { studentBio?: string; matchScore?: number },
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
