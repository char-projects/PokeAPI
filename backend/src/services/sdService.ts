import axios from 'axios'
import { SD_API_URL, SD_API_KEY } from '../config.js'

export const generateImage = async (prompt: string) => {
  if (!SD_API_URL) throw new Error('SD_API_URL not configured on backend')
  const r = await axios.post(
    `${SD_API_URL}/api/predict`,
    { prompt },
    {
      headers: {
        'Content-Type': 'application/json',
        ...(SD_API_KEY ? { Authorization: `Bearer ${SD_API_KEY}` } : {}),
      },
      timeout: 120000,
    }
  )
  return r.data
}
