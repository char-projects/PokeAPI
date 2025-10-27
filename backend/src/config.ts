import path from 'path'
import { fileURLToPath } from 'url'
import dotenv from 'dotenv'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
dotenv.config({ path: path.resolve(__dirname, '../.env') })

const get = (k: string, fallback?: string) => process.env[k] ?? fallback

export const PORT = Number(get('PORT', '3000'))
export const SD_API_URL = get('SD_API_URL')
export const SD_API_KEY = get('SD_API_KEY')
export const JWT_SECRET = get('JWT_SECRET')
export const JWT_EXPIRES_IN = get('JWT_EXPIRES_IN', '1h')
export const OAUTH_CLIENT_ID = get('OAUTH_CLIENT_ID')
export const OAUTH_CLIENT_SECRET = get('OAUTH_CLIENT_SECRET')
export const OAUTH_TOKEN_URL = get('OAUTH_TOKEN_URL')
export const OAUTH_AUTHORIZE_URL = get('OAUTH_AUTHORIZE_URL')
export const OAUTH_CALLBACK_URL = get('OAUTH_CALLBACK_URL')
export const FRONTEND_ORIGIN = get('FRONTEND_ORIGIN', 'http://localhost:5173')

if ( !JWT_SECRET) {
  throw new Error('JWT_SECRET must be set')
}

export const DATA_DIR = path.resolve(__dirname, '../data')

export default {
  PORT,
  SD_API_URL,
  SD_API_KEY,
  JWT_SECRET,
  JWT_EXPIRES_IN,
  
  OAUTH_CLIENT_ID,
  OAUTH_CLIENT_SECRET,
  OAUTH_TOKEN_URL,
  FRONTEND_ORIGIN,
  DATA_DIR,
}

if (OAUTH_CLIENT_ID && !OAUTH_CLIENT_SECRET) {
  console.warn('OAUTH_CLIENT_ID is set but OAUTH_CLIENT_SECRET is missing. Token exchange may fail for providers that require a client_secret (e.g. Google web app).')
}
