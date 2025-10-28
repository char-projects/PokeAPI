import axios, { AxiosError } from "axios"

const base = import.meta.env.VITE_API_BASE ?? import.meta.env.VITE_API_URL ?? 'http://localhost:3000'
const api = axios.create({
    baseURL: base,
    timeout: 120000,
    withCredentials: true,
})

api.interceptors.response.use(
    (response) => response,
    async (error: AxiosError & { config?: any }) => {
        const originalRequest = error.config
        if (error.response && error.response.status === 401 && originalRequest && !originalRequest._retry) {
            originalRequest._retry = true
            try {
                const isCrossOrigin = (typeof window !== 'undefined') && (new URL(api.defaults.baseURL as string).origin !== window.location.origin)
                const hasStoredRefresh = (typeof window !== 'undefined') && !!localStorage.getItem('poke_refresh_token')
                if (isCrossOrigin && !hasStoredRefresh) {
                    return Promise.reject(error)
                }
                // Avoid a static import to prevent a circular dependency with ./auth
                const { refreshToken } = await import('./auth')
                const ok = await refreshToken()
                if (ok) {
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
