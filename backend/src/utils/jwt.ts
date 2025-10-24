import jwt from 'jsonwebtoken'
import { JWT_SECRET, JWT_EXPIRES_IN } from '../config.js'

if (!JWT_SECRET) {
  throw new Error('JWT_SECRET is not set. Please set it in .env or in your environment.')
}

export const verifyJwt = (token: string) => {
  return jwt.verify(token, JWT_SECRET as unknown as jwt.Secret) as Record<string, any>
}
