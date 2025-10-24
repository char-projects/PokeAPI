import express from 'express'
import type { Request, Response, NextFunction } from 'express'
import cors from 'cors'
import axios from 'axios'
import path from 'path'
import dotenv from 'dotenv'
import * as jwt from 'jsonwebtoken'
import cookieParser from 'cookie-parser'

dotenv.config({ path:path.resolve(process.cwd(), '../.env') })

const app = express()
app.use(cors())
app.use(express.json({ limit: '10mb' }))
app.use(cookieParser())

const PORT = process.env.PORT || 3000
const JWT_SECRET = process.env.JWT_SECRET || 'dev-jwt-secret'
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1h'
const OAUTH_CLIENT_ID = process.env.OAUTH_CLIENT_ID || process.env.VITE_OAUTH_CLIENT_ID
const OAUTH_CLIENT_SECRET = process.env.OAUTH_CLIENT_SECRET || process.env.VITE_OAUTH_CLIENT_SECRET
const OAUTH_TOKEN_URL = process.env.OAUTH_TOKEN_URL || process.env.VITE_OAUTH_TOKEN_URL

import './db.js'
import Pokemon from './models/Pokemon.js'

app.get('/', (_req: Request, res: Response) => {
  res.status(200).send('Backend is running!!!')
})

app.post('/api/login', (req: Request, res: Response) => {
  const { username, password } = (req.body || {}) as { username?: string; password?: string }
  if (!username || !password) return res.status(400).json({ error: 'username and password required' })

  const allowedPassword = process.env.DEMO_PASSWORD || 'password'
  if (password !== allowedPassword) return res.status(401).json({ error: 'invalid credentials' })

  const user = { sub: username, name: username }
  const token = jwt.sign(
    user as object,
    JWT_SECRET as unknown as jwt.Secret,
    { expiresIn: JWT_EXPIRES_IN as string } as jwt.SignOptions
  )

  res.cookie('access_token', token, { httpOnly: true, secure: false, maxAge: 1000 * 60 * 60 })
  return res.json({ access_token: token, token_type: 'Bearer', expires_in: JWT_EXPIRES_IN })
})

app.post('/api/oauth/exchange', async (req: Request, res: Response) => {
  const { code, redirect_uri, code_verifier } = req.body || {}
  if (!code || !redirect_uri || !code_verifier) return res.status(400).json({ error: 'code, redirect_uri and code_verifier required' })
  if (!OAUTH_TOKEN_URL || !OAUTH_CLIENT_ID) return res.status(500).json({ error: 'OAuth server not configured on backend' })

  try {
    const body = new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri,
      client_id: OAUTH_CLIENT_ID,
      code_verifier,
    })
    if (OAUTH_CLIENT_SECRET) body.set('client_secret', OAUTH_CLIENT_SECRET)

    const r = await axios.post(OAUTH_TOKEN_URL, body.toString(), { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } })
    const tr = r.data
    if (tr.access_token) res.cookie('access_token', tr.access_token, { httpOnly: true, secure: false })
    if (tr.refresh_token) res.cookie('refresh_token', tr.refresh_token, { httpOnly: true, secure: false })
    return res.json(tr)
  } catch (err: any) {
    console.error('oauth exchange failed', err?.toString())
    return res.status(err?.response?.status || 500).json(err?.response?.data || { error: 'token exchange failed' })
  }
})

app.post('/api/oauth/refresh', async (req: Request, res: Response) => {
  const refresh_token = req.cookies?.refresh_token || req.body?.refresh_token
  if (!refresh_token) return res.status(400).json({ error: 'refresh_token required' })
  if (!OAUTH_TOKEN_URL || !OAUTH_CLIENT_ID) return res.status(500).json({ error: 'OAuth server not configured on backend' })

  try {
    const body = new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token,
      client_id: OAUTH_CLIENT_ID,
    })
    if (OAUTH_CLIENT_SECRET) body.set('client_secret', OAUTH_CLIENT_SECRET)

    const r = await axios.post(OAUTH_TOKEN_URL, body.toString(), { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } })
    const tr = r.data
    if (tr.access_token) res.cookie('access_token', tr.access_token, { httpOnly: true, secure: false })
    if (tr.refresh_token) res.cookie('refresh_token', tr.refresh_token, { httpOnly: true, secure: false })
    return res.json(tr)
  } catch (err: any) {
    console.error('oauth refresh failed', err?.toString())
    return res.status(err?.response?.status || 500).json(err?.response?.data || { error: 'refresh failed' })
  }
})

const authenticateJWT = (req: Request, res: Response, next: NextFunction) => {
  const auth = (req.headers.authorization as string) || ''
  let token: string | null = null
  if (auth.startsWith('Bearer ')) token = auth.slice(7)
  if (!token && (req as any).cookies && (req as any).cookies.access_token) token = (req as any).cookies.access_token
  if (!token) return res.status(401).json({ error: 'missing token' })
  try {
    const payload = jwt.verify(token, JWT_SECRET) as Record<string, any>
    // @ts-ignore
    req.user = payload
    return next()
  } catch (err) {
    return res.status(401).json({ error: 'invalid token' })
  }
}

app.get('/api/me', authenticateJWT, (req: Request, res: Response) => {
  res.json({ user: (req as any).user })
})

app.post('/api/generate', async (req, res) => {
  const prompt = req.body?.prompt
  if (!prompt) return res.status(400).json({ error: 'prompt required' })

  const SD_URL = process.env.SD_API_URL || process.env.VITE_SD_API_URL || 'http://stable-diffusion.42malaga.com:7860'
  const SD_KEY = process.env.SD_API_KEY || process.env.VITE_SD_API_KEY || ''

  try {
    const r = await axios.post(
      `${SD_URL}/api/predict`,
      { prompt },
      {
        headers: {
          'Content-Type': 'application/json',
          ...(SD_KEY ? { Authorization: `Bearer ${SD_KEY}` } : {}),
        },
        timeout: 120000,
      }
    )

    return res.json(r.data)
  } catch (err: any) {
    console.error('generate error', err?.toString())
    const status = err?.response?.status || 500
    const data = err?.response?.data || { error: 'failed to generate' }
    return res.status(status).json(data)
  }
})

app.get('/api/pokemons', async (_req, res) => {
  try {
    const list = await Pokemon.findAll({ order: [['id', 'ASC']] })
    res.json(list)
  } catch (err: any) {
    console.error('failed to read pokemons', err?.toString())
    res.status(500).json({ error: 'failed to read data' })
  }
})

app.post('/api/pokemons', async (req, res) => {
  try {
    const entry = req.body
    const created = await Pokemon.create(entry)
    res.json(created)
  } catch (err: any) {
    console.error('failed to save pokemon', err?.toString())
    res.status(500).json({ error: 'failed to save data', details: err.message })
  }
})

app.listen(PORT, () => {
    console.log("Backend listening on Port ", PORT);
}).on("error", (err) => {
     throw new Error("Failed to start server: " + err.message);
});
