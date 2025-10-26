import type { Request, Response } from 'express'
import { exchangeToken, refreshToken } from '../services/oauthService.js'

export const oauthExchange = async (req: Request, res: Response) => {
  const { code, redirect_uri, code_verifier } = req.body || {}
  if (!code || !redirect_uri || !code_verifier) return res.status(400).json({ error: 'code, redirect_uri and code_verifier required' })
  try {
    const tr = await exchangeToken(code, redirect_uri, code_verifier)
    if (tr.access_token) res.cookie('access_token', tr.access_token, { httpOnly: true, secure: true, sameSite: 'lax' })
    if (tr.refresh_token) res.cookie('refresh_token', tr.refresh_token, { httpOnly: true, secure: true, sameSite: 'lax' })
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
    if (tr.access_token) res.cookie('access_token', tr.access_token, { httpOnly: true, secure: true, sameSite: 'lax' })
    if (tr.refresh_token) res.cookie('refresh_token', tr.refresh_token, { httpOnly: true, secure: true, sameSite: 'lax' })
    return res.json(tr)
  } catch (err: any) {
    console.error('OAuth refresh failed:', err?.response?.data || err?.message || err)
    return res.status(err?.response?.status || 500).json(err?.response?.data || { error: 'refresh failed' })
  }
}

export const me = (req: Request, res: Response) => {
  res.json({ user: (req as any).user })
}
