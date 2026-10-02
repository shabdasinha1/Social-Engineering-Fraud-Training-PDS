import { Router } from 'express'
import { adminRoutes } from './adminRoutes.js'
import { assessmentRoutes } from './assessmentRoutes.js'
import { attemptRoutes } from './attemptRoutes.js'
import { candidateRoutes } from './candidateRoutes.js'
import { healthRoutes } from './healthRoutes.js'
import { progressRoutes } from './progressRoutes.js'
import { scenarioRoutes } from './scenarioRoutes.js'

export const apiRoutes = Router()

apiRoutes.use('/health', healthRoutes)
apiRoutes.use('/candidates', candidateRoutes)
apiRoutes.use('/scenarios', scenarioRoutes)
apiRoutes.use('/assessments', assessmentRoutes)
apiRoutes.use('/attempts', attemptRoutes)
apiRoutes.use('/progress', progressRoutes)
apiRoutes.use('/admin', adminRoutes)
