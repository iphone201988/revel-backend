import express from 'express'
import { auth } from '../middleware/auth.middleware.js'
import { auditLogController } from '../controller/auditLogs.controller.js'
import auditLogs from '../middleware/auditLogs.middleware.js'
const router = express.Router()

router.get('/view', 
    auth,
    auditLogs,
    auditLogController.viewAllAuditLogs
)
router.get('/statistics', 
    auth,
    auditLogs,
    auditLogController.statistics
)

export default router