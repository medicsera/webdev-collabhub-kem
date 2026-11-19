import { Router } from 'express'
import { authRequired, requireRole } from '../middleware/auth.js'
import {
    getMyOrganization,
    getOrganizationById,
    listOrganizations,
    updateMyOrganization,
} from './organizations.controllers.js'

const router = Router()

router.get('/', authRequired, listOrganizations)
router.get('/me', authRequired, requireRole('COMPANY'), getMyOrganization)
router.patch('/me', authRequired, requireRole('COMPANY'), updateMyOrganization)
router.get('/:id', authRequired, getOrganizationById)

export default router
