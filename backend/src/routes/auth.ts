import { Router } from 'express'
import { oauthExchange, oauthRefresh, me } from '../controllers/authController.js'
import { authenticateJWT } from '../middleware/auth.js'

const router = Router()

router.post('/oauth/exchange', oauthExchange)
router.post('/oauth/refresh', oauthRefresh)
router.get('/me', authenticateJWT, me)

export default router
