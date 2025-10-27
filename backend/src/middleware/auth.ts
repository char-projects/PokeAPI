import type { Request, Response, NextFunction } from 'express'
import { verifyJwt } from '../utils/jwt.js'

export const authenticateJWT = (req: Request, res: Response, next: NextFunction) => {
  const auth = (req.headers.authorization as string) || ''
  // Debugging: log incoming auth header and cookies when authorization fails
  if (!auth) {
    console.debug('[auth] no Authorization header. cookies.access_token=', (req as any).cookies?.access_token)
  } else {
    console.debug('[auth] Authorization header present (first 20 chars)=', auth.slice(0, 20))
  }
  let token: string | null = null
  if (auth.startsWith('Bearer ')) token = auth.slice(7)
  if (!token && (req as any).cookies && (req as any).cookies.access_token) token = (req as any).cookies.access_token
  if (!token) return res.status(401).json({ error: 'missing token' })
  try {
    const payload = verifyJwt(token)
    ;(req as any).user = payload
    return next()
  } catch (err) {
    return res.status(401).json({ error: 'invalid token' })
  }
}
