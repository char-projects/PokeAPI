import axios from "axios"

const base = import.meta.env.VITE_API_BASE ?? ''
const api = axios.create({
    baseURL: base,
    timeout: 10000,
})

api.interceptors.response.use(
    (response) => response,
    (error) => {
        console.error("API error:", error)
        return Promise.reject(error)
    }
)

export const generateImage = async (prompt: string) => {
    const res = await api.post('/api/generate', { prompt })
    return res.data
}

export const getImageStatus = async (taskId: string) => {
    const res = await api.get(`/api/sd/status?task_id=${taskId}`)
    return res.data
}

export const fetchImage = async (imageId: string) => {
    const res = await api.get(`/api/sd/fetch/${imageId}`, {
        responseType: "blob",
    })
    return res.data
}

export const getGeneratedImages = async () => {
    const res = await api.get('/api/sd/generated-images')
    return res.data
}

export const deleteGeneratedImage = async (imageId: string) => {
    const res = await api.delete(`/api/sd/generated-images/${imageId}`)
    return res.data
}

export default api
