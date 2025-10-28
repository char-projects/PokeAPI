import { Router } from 'express'
import { oauthExchange, oauthRefresh, me, oauthComplete } from '../controllers/authController.js'
import { authenticateJWT } from '../middleware/auth.js'
import User from '../models/User.js'
import { JWT_SECRET, JWT_EXPIRES_IN, FRONTEND_ORIGIN } from '../config.js'
import { OAUTH_AUTHORIZE_URL, OAUTH_CALLBACK_URL, OAUTH_CLIENT_ID } from '../config.js'
import crypto from 'crypto'
import axios from 'axios'
import { OAUTH_TOKEN_URL, OAUTH_CLIENT_SECRET } from '../config.js'

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
				res.cookie('access_token', token, { httpOnly: true, secure: secureFlag, path: '/', sameSite: 'lax', maxAge: 1000 * 60 * 60 })
				return res.json({ access_token: token, token_type: 'Bearer', expires_in: process.env.JWT_EXPIRES_IN || '1h' })
		}

		const allowedPassword = process.env.DEMO_PASSWORD || 'password'
		if (password !== allowedPassword) return res.status(401).json({ error: 'invalid credentials' })

	const user = { sub: username, name: username }
	const _jwt = await import('jsonwebtoken')
	const jwtLib = (_jwt && (_jwt as any).default) ? (_jwt as any).default : _jwt
	const token = jwtLib.sign(user as object, JWT_SECRET as unknown as any, { expiresIn: JWT_EXPIRES_IN as string } as any)
        	const secureFlag = !!(req.secure || (req.headers['x-forwarded-proto'] === 'https'))
			res.cookie('access_token', token, { httpOnly: true, secure: secureFlag, path: '/', sameSite: 'lax', maxAge: 1000 * 60 * 60 })
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
		res.cookie('access_token', token, { httpOnly: true, secure: secureFlag, path: '/', sameSite: 'lax', maxAge: 1000 * 60 * 60 })
		return res.json({ access_token: token, token_type: 'Bearer', expires_in: process.env.JWT_EXPIRES_IN || '1h' })
	} catch (err: any) {
		console.error('register error', err?.toString())
		return res.status(500).json({ error: 'registration failed' })
	}
})

router.get('/oauth/start', (req, res) => {
	if (!OAUTH_AUTHORIZE_URL || !OAUTH_CLIENT_ID) return res.status(500).send('OAuth not configured')
	try { res.clearCookie('access_token', { path: '/', sameSite: 'lax' }) } catch (e) {}
	const state = crypto.randomBytes(12).toString('hex')
	res.cookie('oauth_state', state, { maxAge: 5 * 60 * 1000, sameSite: 'lax', path: '/' })
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

  res.clearCookie('oauth_state')

  const frontendBase = FRONTEND_ORIGIN || 'http://localhost:5173'
		try {
			if (!OAUTH_TOKEN_URL) throw new Error('OAUTH_TOKEN_URL not configured')
			const body = new URLSearchParams({
				grant_type: 'authorization_code',
				code,
				redirect_uri: OAUTH_CALLBACK_URL as string,
				client_id: OAUTH_CLIENT_ID as string,
			})
			if (OAUTH_CLIENT_SECRET) body.set('client_secret', OAUTH_CLIENT_SECRET as string)
			const tokenResp = await axios.post(OAUTH_TOKEN_URL as string, body.toString(), { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } })
			const access_token = tokenResp.data?.access_token as string | undefined
			if (!access_token) {
				throw new Error('no access_token from provider')
			}
			const redirectUrl = `${frontendBase}/auth/callback#access_token=${encodeURIComponent(access_token)}&state=${encodeURIComponent(state || '')}`
			return res.redirect(redirectUrl)
		} catch (e: any) {
			console.error('oauth callback exchange failed', e?.response?.data || e?.message || e)
			const redirectUrl = `${frontendBase}/auth/callback?code=${encodeURIComponent(code)}&state=${encodeURIComponent(state || '')}`
			return res.redirect(redirectUrl)
		}
})

router.post('/logout', async (req, res) => {
	try {
		const authHeader = (req.headers.authorization as string) || ''
		let token: string | null = null
		if (authHeader.startsWith('Bearer ')) token = authHeader.slice(7)
		if (!token && (req as any).cookies && (req as any).cookies.access_token) token = (req as any).cookies.access_token
		if (token) {
			try {
				const { verifyJwt } = await import('../utils/jwt.js')
				const payload: any = verifyJwt(token)
				const username = payload?.sub
				if (username) {
					const user = await User.findOne({ where: { username } })
					if (user) {
						user.set('lastLogoutAt', new Date())
						await user.save()
					}
				}
			} catch (e) {
			}
		}

		const secureFlag = !!(req.secure || (req.headers['x-forwarded-proto'] === 'https'))
		res.clearCookie('access_token', { httpOnly: true, secure: secureFlag, path: '/', sameSite: 'lax' })
		res.clearCookie('refresh_token', { httpOnly: true, secure: secureFlag, path: '/', sameSite: 'lax' })
		res.clearCookie('oauth_state', { path: '/' })
	} catch (e) {}
	return res.json({ ok: true })
})

router.get('/logout/clear', (req, res) => {
	try {
		const secureFlag = !!(req.secure || (req.headers['x-forwarded-proto'] === 'https'))
		res.clearCookie('access_token', { httpOnly: true, secure: secureFlag, path: '/', sameSite: 'lax' })
		res.clearCookie('refresh_token', { httpOnly: true, secure: secureFlag, path: '/', sameSite: 'lax' })
		res.clearCookie('oauth_state', { path: '/' })
	} catch (e) {}

		const frontendBase = FRONTEND_ORIGIN || 'http://localhost:5173'
		const redirectRaw = String(req.query.redirect || '')
		let target = ''
		try {
			const urlObj = new URL(redirectRaw || '/', frontendBase)
			if (!urlObj.searchParams.has('message')) urlObj.searchParams.set('message', 'Signed out successfully')
			target = urlObj.toString()
		} catch (e) {
			const fb = new URL('/login', frontendBase)
			fb.searchParams.set('message', 'Signed out successfully')
			target = fb.toString()
		}
		return res.redirect(target)
})

export default router
