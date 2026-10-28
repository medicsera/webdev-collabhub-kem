import {addAbortListener} from "node:events";
import {applications} from "../db/schema.js";

export class AiService {
    private readonly baseUrl = process.env.AI_SERVICE_URL

    async runPipeline(studentSkills: string[],projectTitle: string, projectDescription: string, projectRequirements: string[]){
        try{
            const responce = await fetch(`${this.baseUrl}/api/v1/pipeline`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    student_skills: studentSkills,
                    project_title: projectTitle,
                    project_description: projectDescription,
                    project_requirements: projectRequirements
                })
            });

            if (!responce.ok){
                const errorDetails = await responce.text();
                console.error("FastAPI Error Details:", errorDetails);
                throw new Error(`Ai service Error ${responce.status}`)
            }

            const data = await responce.json();
            console.log("Сырой ответ от ИИ-сервиса:", data);

            return  {
                aiMatchScore: data.match_score,
                aiFeedback: data.analysis
            }
        } catch (error){
            throw error
        }
    }
}

export const aiService = new AiService()