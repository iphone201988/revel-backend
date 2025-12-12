import express from 'express'
const router = express.Router()
import orgRouter from './orgnization.routes.js'
import providerRouter from './provider.routes.js'
import logsRouter from './logs.routes.js'
import sessionRouter from './session.routes.js'

router.use('/org', orgRouter);
router.use('/provider',providerRouter )
router.use('/logs', logsRouter)
router.use('/session', sessionRouter)

export default router