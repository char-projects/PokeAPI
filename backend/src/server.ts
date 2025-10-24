import http from 'http'
import app from './app.js'
import { PORT } from './config.js'
import { connectAndSync } from './db.js'

const start = async () => {
  try {
    await connectAndSync()
    const server = http.createServer(app)
    server.listen(PORT, () => {
      console.log('Backend listening on Port ', PORT)
    })
    server.on('error', (err: any) => {
      console.error('Failed to start server:', err.message)
      process.exit(1)
    })
  } catch (err) {
    console.error('Failed to initialize application:', err)
    process.exit(1)
  }
}

start()
