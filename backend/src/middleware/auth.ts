import type { Request, Response, NextFunction } from 'express'
import { verifyJwt } from '../utils/jwt.js'

export const authenticateJWT = (req: Request, res: Response, next: NextFunction) => {
  const auth = (req.headers.authorization as string) || ''
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
