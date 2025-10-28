import type { Request, Response } from 'express'
import { exchangeToken, refreshToken } from '../services/oauthService.js'
import axios from 'axios'
import User from '../models/User.js'
import { JWT_SECRET, JWT_EXPIRES_IN } from '../config.js'

export const oauthExchange = async (req: Request, res: Response) => {
  const { code, redirect_uri, code_verifier } = req.body || {}
  if (!code || !redirect_uri || !code_verifier) return res.status(400).json({ error: 'code, redirect_uri and code_verifier required' })
  try {
  const tr = await exchangeToken(code, redirect_uri, code_verifier)
  const secureFlag = !!(req.secure || (req.headers['x-forwarded-proto'] === 'https'))
  if (tr.access_token) res.cookie('access_token', tr.access_token, { httpOnly: true, secure: secureFlag, path: '/', sameSite: 'lax' })
    return res.json(tr)
  } catch (err: any) {
    console.error('OAuth exchange failed:', err?.response?.data || err?.message || err)
    return res.status(err?.response?.status || 500).json(err?.response?.data || { error: 'token exchange failed' })
  }
}

export const oauthRefresh = async (req: Request, res: Response) => {
  const refresh_token = req.cookies?.refresh_token || req.body?.refresh_token
  if (!refresh_token) return res.status(400).json({ error: 'refresh_token required' })
  try {
  const tr = await refreshToken(refresh_token)
  const secureFlag = !!(req.secure || (req.headers['x-forwarded-proto'] === 'https'))
  if (tr.access_token) res.cookie('access_token', tr.access_token, { httpOnly: true, secure: secureFlag, path: '/', sameSite: 'lax' })
    return res.json(tr)
  } catch (err: any) {
    console.error('OAuth refresh failed:', err?.response?.data || err?.message || err)
    return res.status(err?.response?.status || 500).json(err?.response?.data || { error: 'refresh failed' })
  }
}

export const me = (req: Request, res: Response) => {
  res.json({ user: (req as any).user })
}

export const oauthComplete = async (req: Request, res: Response) => {
  const providerToken = req.body?.access_token as string | undefined
  if (!providerToken) return res.status(400).json({ error: 'access_token required' })
  try {
    let profile: any = null
    const _jwt = await import('jsonwebtoken')
    const jwtLib: any = (_jwt && (_jwt as any).default) ? (_jwt as any).default : _jwt

    if (providerToken.split('.').length === 3) {
      try {
        const decoded = (jwtLib.decode(providerToken) || {}) as any
        profile = decoded
      } catch (e) {
        profile = null
      }
    }
    if (!profile) {
      const userinfoUrl = 'https://openidconnect.googleapis.com/v1/userinfo'
      const r = await axios.get(userinfoUrl, { headers: { Authorization: `Bearer ${providerToken}` } })
      profile = r.data
    }
    const username = profile.email || profile.sub
    if (!username) return res.status(400).json({ error: 'failed to obtain user identity from provider' })

    let user = await User.findOne({ where: { username } })
    if (!user) {
      user = await User.create({ username, passwordHash: '', displayName: profile.name || username })
    }

    const payload = { sub: username, name: profile.name || username }
  const token = jwtLib.sign(payload as object, JWT_SECRET as unknown as any, { expiresIn: JWT_EXPIRES_IN as string } as any)
    return res.json({ access_token: token, user: payload })
  } catch (err: any) {
    console.error('oauth complete failed', err?.response?.data || err?.message || err)
    return res.status(err?.response?.status || 500).json({ error: 'oauth complete failed' })
  }
}
