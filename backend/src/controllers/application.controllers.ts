import express, { type Request, type Response } from 'express';
import {eq} from 'drizzle-orm';
import {db} from  '../db'
import {
    applications,
    projects,
    skills,
    studentSkills,
    projectRequiredSkills
} from "../db/schema.js";
import {aiService} from '../services/aiService.js'

export  const applyForProject = async (req: Request, res: Response)=> {
    try {
        const {studentId, projectId, coverLetter} = req.body
        const [projectInfo] = await db
            .select({title:projects.title, description: projects.description})
            .from(projects)
            .where(eq(projects.id,projectId))

        if (!projectInfo){
            return res.status(404).json({error: "Проект не найден"})
        }

        const studentSkillData = await db
            .select({name: skills.name})
            .from(studentSkills)
            .innerJoin(skills, eq(studentSkills.skillId,skills.id))
            .where(eq(studentSkills.studentId,studentId))

        const studentSkillsArr = studentSkillData.map(s => s.name);

        const projectReqsData = await db
            .select({name: skills.name})
            .from(projectRequiredSkills)
            .innerJoin(skills, eq(projectRequiredSkills.skillId, skills.id))
            .where(eq(projectRequiredSkills.projectId, projectId))

        const projectReqsArr = projectReqsData.map(r=> r.name);

        const aiResult = await aiService.runPipeline(
            studentSkillsArr,
            projectInfo.title,
            projectInfo.description,
            projectReqsArr
        )

        const [newApplication] = await db.insert(applications).values({
            studentId,
            projectId,
            coverLetter,
            aiMatchScore: aiResult.aiMatchScore,
            aiFeedBack: aiResult.aiFeedback,
            status: 'PENDING'
        }).returning()

        res.status(201).json(newApplication)
    } catch (error){
        console.error('Ошибка при подаче заявки:', error)
        res.status(500).json({error: "Не удалось обработать заявку на проект"})
    }
}
