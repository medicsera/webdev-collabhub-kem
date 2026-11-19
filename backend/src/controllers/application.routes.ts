import { Router } from 'express'
import { applyForProject } from './application.controllers.js'
import { authRequired, requireRole } from '../middleware/auth.js'

const router = Router()

// POST /api/application — только авторизованный студент
router.post('/', authRequired, requireRole('STUDENT'), applyForProject)

export default router
