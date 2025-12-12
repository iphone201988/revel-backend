import express from 'express'
import { orgController } from '../controller/organization.controller.js'
import { validate } from '../middleware/validate.middleware.js'
import { orgSchema } from '../schema/organization.schema.js'
import auditLogs from '../middleware/auditLogs.middleware.js'

const router = express.Router()

router.post('/register', 
    validate(orgSchema.orgRegisterSchema),
    
    orgController.registerOrganization,
)


export default router