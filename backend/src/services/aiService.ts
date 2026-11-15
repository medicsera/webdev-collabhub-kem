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
}

export const aiService = new AiService()
