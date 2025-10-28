import type { Request, Response, NextFunction } from 'express'
import { verifyJwt } from '../utils/jwt.js'
import User from '../models/User.js'

export const authenticateJWT = async (req: Request, res: Response, next: NextFunction) => {
  const auth = (req.headers.authorization as string) || ''
  let token: string | null = null
  if (auth.startsWith('Bearer ')) token = auth.slice(7)
  if (!token && (req as any).cookies && (req as any).cookies.access_token) token = (req as any).cookies.access_token
  if (!token) return res.status(401).json({ error: 'missing token' })
  try {
    const payload = verifyJwt(token)
    try {
      const username = (payload as any).sub
      if (username) {
        const user = await User.findOne({ where: { username } })
        if (user && (user as any).lastLogoutAt) {
          const lastLogoutSec = Math.floor(new Date((user as any).lastLogoutAt).getTime() / 1000)
          const tokenIat = (payload as any).iat as number | undefined
          if (tokenIat && tokenIat <= lastLogoutSec) {
            return res.status(401).json({ error: 'token revoked' })
          }
        }
      }
    } catch (e) {}
    ;(req as any).user = payload
    return next()
  } catch (err) {
    return res.status(401).json({ error: 'invalid token' })
  }
}
