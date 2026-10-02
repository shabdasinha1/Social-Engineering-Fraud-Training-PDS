import { Router } from 'express'
import { getScenarioSummary } from '../controllers/scenarioController.js'

export const scenarioRoutes = Router()

scenarioRoutes.get('/summary', getScenarioSummary)
