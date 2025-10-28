import api from './api'

export type TokenResponse = {
    access_token: string
    refresh_token?: string
    expires_in?: number
    token_type?: string
    id_token?: string
}

export const LS_KEY = {
    ACCESS: 'poke_access_token',
    EXPIRES_AT: 'poke_token_expires_at',
    USER: 'poke_user',
}

const BACKEND_OAUTH_BASE = ((import.meta.env.VITE_OAUTH_BACKEND_TOKEN_EXCHANGE as string | undefined) ?? '/api/oauth').replace(/\/exchange\/?$/i, '')

let initPromise: Promise<void> | null = null

const initFromHash = () => {
    if (initPromise) return initPromise
    initPromise = (async () => {
        try {
            const hash = window.location.hash || ''
            if (!hash) return
            const params = new URLSearchParams(hash.replace(/^#/, ''))
            const token = params.get('access_token')
            if (token) {
                try {
                    const res = await api.post(`${BACKEND_OAUTH_BASE}/complete`, { access_token: token })
                    const tr: TokenResponse = res.data
                    saveTokens(tr)
                } catch (err: any) {}
                history.replaceState(null, '', window.location.pathname + window.location.search)
            }
        } catch (e) {}
    })()
    return initPromise
}

const saveTokens = (tr: TokenResponse | null) => {
    if (!tr) {
        try {
            localStorage.clear()
            sessionStorage.clear()
        } catch {}
        try { delete (api.defaults.headers as any).common['Authorization'] } catch {}
        return
    }
    if (tr.access_token) {
        try { localStorage.setItem(LS_KEY.ACCESS, tr.access_token) } catch {}
        ;(api.defaults.headers as any).common['Authorization'] = `Bearer ${tr.access_token}`
    }
}

export const loginWithProvider = async () => {
    saveTokens(null)
    try { localStorage.clear(); } catch {}
    try { sessionStorage.clear(); } catch {}
    try { delete (api.defaults.headers as any).common['Authorization'] } catch {}
    const backend = import.meta.env.VITE_API_BASE ?? import.meta.env.VITE_API_URL ?? 'http://localhost:3000'
    window.location.href = `${backend.replace(/\/$/, '')}/api/oauth/start`
}

if (typeof window !== 'undefined') initFromHash()

export const getCurrentUser = async (): Promise<any | null> => {
    try {
        if (typeof window !== 'undefined' && initPromise) await initPromise
        const stored = localStorage.getItem(LS_KEY.ACCESS)
        if (stored) (api.defaults.headers as any).common['Authorization'] = `Bearer ${stored}`
        const res = await api.get('/api/me')
        return res.data?.user || res.data || null
    } catch (err) {
        return null
    }
}

export const isAuthenticated = async (): Promise<boolean> => {
    const u = await getCurrentUser()
    return !!u
}

export const logout = async () => {
    try {
        await api.post('/api/logout')
    } catch (e) {}
    saveTokens(null)
    try {
        localStorage.clear()
        sessionStorage.clear()
    } catch (e) {}
    try {
        delete (api.defaults.headers as any).common['Authorization']
    } catch (e) {}
    try { window.dispatchEvent(new Event('auth-changed')) } catch (e) {}
}

export const logoutAndRedirect = async () => {
    await logout()
    try { window.location.href = '/login?message=' + encodeURIComponent('Signed out successfully') } catch (e) {}
}

export const refreshToken = async (): Promise<boolean> => {
    try {
        const res = await api.post(`${BACKEND_OAUTH_BASE}/refresh`)
        const tr: TokenResponse = res.data
        saveTokens(tr)
        return true
    } catch (err) {
        console.error('Refresh token failed', err)
        return false
    }
}

export const decodeJwt = (token?: string) => {
    if (!token) return null
    try {
        const parts = token.split('.')
        if (parts.length < 2) return null
        const payload = parts[1].replace(/-/g, '+').replace(/_/g, '/')
        const json = atob(payload)
        return JSON.parse(decodeURIComponent(escape(json)))
    } catch {
        return null
    }
}
