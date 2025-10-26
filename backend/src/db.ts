import { Sequelize } from 'sequelize'
import path from 'path'
import { DATA_DIR } from './config.js'
import fs from 'fs'

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true })

const storage = path.join(DATA_DIR, 'database.sqlite')

export const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage,
  logging: false,
})

export const connectAndSync = async () => {
  try {
    await sequelize.authenticate()
    await sequelize.sync()
    console.log('Database connected and synced at', storage)
  } catch (err) {
    console.error('Failed to connect or sync DB', err)
    throw err
  }
}

export default sequelize
