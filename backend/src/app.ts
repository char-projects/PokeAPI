import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import apiRouter from './routes/api.js'
import authRouter from './routes/auth.js'
import { FRONTEND_ORIGIN } from './config.js'

const app = express()
app.use(
  cors({
    origin: FRONTEND_ORIGIN,
    credentials: true,
  })
)
app.use(express.json({ limit: '10mb' }))
app.use(cookieParser())

app.get('/', (_req, res) => res.status(200).send('Backend is running'))

app.use('/api', apiRouter)
app.use('/api', authRouter)

app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  res.status(500).json({ error: 'internal server error' })
})

export default app
