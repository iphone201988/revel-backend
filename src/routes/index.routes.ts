import express from 'express'
const router = express.Router()
import orgRouter from './orgnization.routes.js'
import providerRouter from './provider.routes.js'
import logsRouter from './logs.routes.js'
import sessionRouter from './session.routes.js'
import downloadRouter from './pdf.routes.js'
import auditLogs from '../middleware/auditLogs.middleware.js'

router.use('/org', orgRouter);
router.use('/provider',providerRouter )
router.use('/logs', logsRouter)
router.use('/session', sessionRouter)
router.use('/download', downloadRouter )


export default router