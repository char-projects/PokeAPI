import axios, { AxiosError } from "axios"
import { getAuthHeader, refreshToken } from "./auth"

const base = import.meta.env.VITE_API_BASE ?? import.meta.env.VITE_API_URL ?? ''
const api = axios.create({
    baseURL: base,
    timeout: 120000,
})

api.interceptors.request.use((config) => {
    const auth = getAuthHeader()
    if (auth) {
        config.headers = { ...(config.headers as any), ...auth }
    }
    return config
})

api.interceptors.response.use(
    (response) => response,
    async (error: AxiosError & { config?: any }) => {
        const originalRequest = error.config
        if (error.response && error.response.status === 401 && originalRequest && !originalRequest._retry) {
            originalRequest._retry = true
            try {
                const ok = await refreshToken()
                if (ok) {
                    const auth = getAuthHeader()
                    if (auth) originalRequest.headers = { ...(originalRequest.headers as any), ...auth }
                    return api.request(originalRequest)
                }
            } catch (e) {
                console.error("Refresh token attempt failed", e)
            }
        }
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

export const getPokemons = async () => {
    const res = await api.get('/api/pokemons')
    return res.data
}

export const createPokemon = async (payload: { name: string; description?: string; imageUrl?: string }) => {
    const res = await api.post('/api/pokemons', payload)
    return res.data
}

export default api
