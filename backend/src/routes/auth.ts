import { Router } from 'express'
import { oauthExchange, oauthRefresh, me, oauthComplete } from '../controllers/authController.js'
import { authenticateJWT } from '../middleware/auth.js'
import User from '../models/User.js'
import { JWT_SECRET, JWT_EXPIRES_IN, FRONTEND_ORIGIN } from '../config.js'
import { OAUTH_AUTHORIZE_URL, OAUTH_CALLBACK_URL, OAUTH_CLIENT_ID } from '../config.js'
import crypto from 'crypto'

const router = Router()

router.post('/oauth/exchange', oauthExchange)
router.post('/oauth/refresh', oauthRefresh)
router.post('/oauth/complete', oauthComplete)
router.get('/me', authenticateJWT, me)

router.post('/login', async (req, res) => {
	const { username, password } = req.body || {}
	if (!username || !password) return res.status(400).json({ error: 'username and password required' })
	try {
		const existing = await User.findOne({ where: { username } })
		if (existing) {
			const _bcrypt = await import('bcryptjs')
			const bcrypt = (_bcrypt && (_bcrypt as any).default) ? (_bcrypt as any).default : _bcrypt
			const ok = await bcrypt.compare(password, existing.passwordHash)
			if (!ok) return res.status(401).json({ error: 'invalid credentials' })
			const user = { sub: username, name: username }
			const _jwt = await import('jsonwebtoken')
			const jwtLib = (_jwt && (_jwt as any).default) ? (_jwt as any).default : _jwt
			const token = jwtLib.sign(user as object, JWT_SECRET as unknown as any, { expiresIn: JWT_EXPIRES_IN as string } as any)
			const secureFlag = !!(req.secure || (req.headers['x-forwarded-proto'] === 'https'))
			res.cookie('access_token', token, { httpOnly: true, secure: secureFlag, maxAge: 1000 * 60 * 60 })
			return res.json({ access_token: token, token_type: 'Bearer', expires_in: process.env.JWT_EXPIRES_IN || '1h' })
		}

		const allowedPassword = process.env.DEMO_PASSWORD || 'password'
		if (password !== allowedPassword) return res.status(401).json({ error: 'invalid credentials' })

	const user = { sub: username, name: username }
	const _jwt = await import('jsonwebtoken')
	const jwtLib = (_jwt && (_jwt as any).default) ? (_jwt as any).default : _jwt
	const token = jwtLib.sign(user as object, JWT_SECRET as unknown as any, { expiresIn: JWT_EXPIRES_IN as string } as any)
        	const secureFlag = !!(req.secure || (req.headers['x-forwarded-proto'] === 'https'))
        	res.cookie('access_token', token, { httpOnly: true, secure: secureFlag, maxAge: 1000 * 60 * 60 })
		return res.json({ access_token: token, token_type: 'Bearer', expires_in: process.env.JWT_EXPIRES_IN || '1h' })
	} catch (err: any) {
		console.error('login error', err?.toString())
		return res.status(500).json({ error: 'login failed' })
	}
})

router.post('/register', async (req, res) => {
	const { username, password } = req.body || {}
	if (!username || !password) return res.status(400).json({ error: 'username and password required' })
	if (password.length < 4) return res.status(400).json({ error: 'password must be at least 4 characters' })
	try {
		const existing = await User.findOne({ where: { username } })
		if (existing) return res.status(409).json({ error: 'user already exists' })
		const _bcrypt = await import('bcryptjs')
		const bcrypt = (_bcrypt && (_bcrypt as any).default) ? (_bcrypt as any).default : _bcrypt
		const saltRounds = 10
		const hash = await bcrypt.hash(password, saltRounds)
		await User.create({ username, passwordHash: hash })
	const user = { sub: username, name: username }
	const _jwt = await import('jsonwebtoken')
	const jwtLib = (_jwt && (_jwt as any).default) ? (_jwt as any).default : _jwt
	const token = jwtLib.sign(user as object, JWT_SECRET as unknown as any, { expiresIn: JWT_EXPIRES_IN as string } as any)
		const secureFlag = !!(req.secure || (req.headers['x-forwarded-proto'] === 'https'))
		res.cookie('access_token', token, { httpOnly: true, secure: secureFlag, maxAge: 1000 * 60 * 60 })
		return res.json({ access_token: token, token_type: 'Bearer', expires_in: process.env.JWT_EXPIRES_IN || '1h' })
	} catch (err: any) {
		console.error('register error', err?.toString())
		return res.status(500).json({ error: 'registration failed' })
	}
})

router.get('/oauth/start', (req, res) => {
	if (!OAUTH_AUTHORIZE_URL || !OAUTH_CLIENT_ID) return res.status(500).send('OAuth not configured')
	const state = crypto.randomBytes(12).toString('hex')
	res.cookie('oauth_state', state, { maxAge: 5 * 60 * 1000, sameSite: 'lax' })
		const params = new URLSearchParams({
		response_type: 'code',
		client_id: OAUTH_CLIENT_ID as string,
		redirect_uri: OAUTH_CALLBACK_URL as string,
		scope: 'openid profile email',
		state,
	})
		const redirectUrl = `${OAUTH_AUTHORIZE_URL}?${params.toString()}`
		return res.redirect(redirectUrl)
})

router.get('/oauth/callback', async (req, res) => {
	const code = req.query.code as string | undefined
	const state = req.query.state as string | undefined
	const stored = req.cookies?.oauth_state
	if (!code) return res.status(400).send('Missing code')
	if (!stored || !state || stored !== state) return res.status(400).send('Invalid state')
	try {
		const { exchangeToken } = await import('../services/oauthService.js')
		const tr = await exchangeToken(code, OAUTH_CALLBACK_URL as string, '')
		const secureFlag = !!(req.secure || (req.headers['x-forwarded-proto'] === 'https'))
		if (tr.access_token) res.cookie('access_token', tr.access_token, { httpOnly: true, secure: secureFlag, sameSite: 'lax' })
		if (tr.refresh_token) res.cookie('refresh_token', tr.refresh_token, { httpOnly: true, secure: secureFlag, sameSite: 'lax' })
		res.clearCookie('oauth_state')
		const frontendBase = (FRONTEND_ORIGIN || 'http://localhost:5173')
		if (tr.access_token) {
			const frag = `?access_token=${tr.access_token}`
			return res.redirect(frontendBase + '/create' + frag)
		}
		return res.redirect(frontendBase + '/create')
	} catch (err: any) {
		console.error('oauth callback failed', err?.response || err)
		return res.status(err?.response?.status || 500).send('OAuth callback failed')
	}
})

export default router
