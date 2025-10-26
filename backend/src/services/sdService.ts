import axios from 'axios'
import { SD_API_URL, SD_API_KEY } from '../config.js'

export const generateImage = async (prompt: string) => {
  if (!SD_API_URL) throw new Error('SD_API_URL not configured on backend')
    const baseUrl = SD_API_URL.replace(/\/$/, '')

    const txt2imgUrl = `${baseUrl}/sdapi/v1/txt2img`
    const payloadTxt2Img = { prompt, steps: 20, width: 512, height: 512 }
    console.debug('SD generate request (txt2img)', { url: txt2imgUrl, payload: payloadTxt2Img, hasApiKey: !!SD_API_KEY })
    try {
      const r = await axios.post(txt2imgUrl, payloadTxt2Img, {
        headers: {
          'Content-Type': 'application/json',
          ...(SD_API_KEY ? { Authorization: `Bearer ${SD_API_KEY}` } : {}),
        },
        timeout: 120000,
      })
      console.debug('SD generate response (txt2img)', { status: r.status })
      const data = r.data
      if (data?.images && Array.isArray(data.images) && data.images[0]) {
        return { image: data.images[0] }
      }
      return data
    } catch (err: any) {
      console.warn('txt2img attempt failed, falling back to /api/predict', { message: err?.message, status: err?.response?.status })

      const predictUrl = `${baseUrl}/api/predict`
      const payload = { prompt }
      console.debug('SD generate request (predict)', { url: predictUrl, payload, hasApiKey: !!SD_API_KEY })
      try {
        const r2 = await axios.post(predictUrl, payload, {
          headers: {
            'Content-Type': 'application/json',
            ...(SD_API_KEY ? { Authorization: `Bearer ${SD_API_KEY}` } : {}),
          },
          timeout: 120000,
        })
        console.debug('SD generate response (predict)', { status: r2.status })
        const data2 = r2.data
        if (data2?.images && Array.isArray(data2.images) && data2.images[0]) {
          return { image: data2.images[0] }
        }
        if (data2?.output && Array.isArray(data2.output) && data2.output[0]) return data2
        if (data2?.image) return data2
        if (data2?.url) return data2
        return data2
      } catch (err2: any) {
        const responseData = err2?.response?.data
        console.error('SD generate failed', {
          message: err2?.message,
          status: err2?.response?.status,
          responseData: responseData ? JSON.stringify(responseData, null, 2) : undefined,
          stack: err2?.stack,
        })
        throw err2
      }
    }
}
