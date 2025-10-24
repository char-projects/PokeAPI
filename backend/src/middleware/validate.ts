import type { Request, Response, NextFunction } from 'express'
import type { ZodSchema } from 'zod'

export const validateBody = (schema: ZodSchema<any>) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const parsed = schema.parse(req.body)
      req.body = parsed
      return next()
    } catch (err: any) {
      return res.status(400).json({ error: 'invalid_request', details: err.errors || err.message })
    }
  }
}
