import { Router } from 'express'
import { authRequired, requireRole } from '../middleware/auth.js'
import {
    createPortfolioItem,
    createResume,
    deleteMyResume,
    deletePortfolioItem,
    analyzeMyResume,
    getMyProfile,
    getStudentById,
    listMyPortfolio,
    listMyResumes,
    listStudents,
    replaceMySkills,
    updateMyProfile,
    updatePortfolioItem,
} from './students.controllers.js'

const router = Router()

// Сначала /me, иначе /:id перехватит "me"
router.get('/me', authRequired, requireRole('STUDENT'), getMyProfile)
router.patch('/me', authRequired, requireRole('STUDENT'), updateMyProfile)
router.put('/me/skills', authRequired, requireRole('STUDENT'), replaceMySkills)

router.get('/me/resumes', authRequired, requireRole('STUDENT'), listMyResumes)
router.post('/me/resumes', authRequired, requireRole('STUDENT'), createResume)
router.delete('/me/resumes/:id', authRequired, requireRole('STUDENT'), deleteMyResume)
router.post('/me/resumes/:id/analyze', authRequired, requireRole('STUDENT'), analyzeMyResume)

router.get('/me/portfolio', authRequired, requireRole('STUDENT'), listMyPortfolio)
router.post('/me/portfolio', authRequired, requireRole('STUDENT'), createPortfolioItem)
router.patch('/me/portfolio/:id', authRequired, requireRole('STUDENT'), updatePortfolioItem)
router.delete('/me/portfolio/:id', authRequired, requireRole('STUDENT'), deletePortfolioItem)

// Публичные / общие
router.get('/', authRequired, listStudents)
router.get('/:id', authRequired, getStudentById)

export default router
