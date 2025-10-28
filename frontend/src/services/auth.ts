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
    REFRESH: 'poke_refresh_token',
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
                console.debug('[auth] fragment token found, exchanging with backend')
                try {
                    const res = await api.post(`${BACKEND_OAUTH_BASE}/complete`, { access_token: token })
                    const tr: TokenResponse = res.data
                    console.debug('[auth] backend /oauth/complete response:', { has_access_token: !!tr?.access_token, user: (tr as any)?.user })
                    saveTokens(tr)
                } catch (err: any) {
                    console.debug('[auth] backend /oauth/complete failed:', err?.response?.status, err?.response?.data)
                }
                history.replaceState(null, '', window.location.pathname + window.location.search)
            }
        } catch (e) {
            // ignore
        }
    })()
    return initPromise
}

const saveTokens = (tr: TokenResponse | null) => {
    if (!tr) {
        localStorage.removeItem(LS_KEY.ACCESS)
        localStorage.removeItem(LS_KEY.REFRESH)
        delete (api.defaults.headers as any).common['Authorization']
        return
    }
    if (tr.access_token) {
        localStorage.setItem(LS_KEY.ACCESS, tr.access_token)
        ;(api.defaults.headers as any).common['Authorization'] = `Bearer ${tr.access_token}`
    }
    if (tr.refresh_token) {
        localStorage.setItem(LS_KEY.REFRESH, tr.refresh_token)
    }
}

export const loginWithProvider = async () => {
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

export const logout = async (redirectTo?: string) => {
    try {
        await api.post('/api/logout')
    } catch (e) {
        // ignore
    }
    saveTokens(null)
    if (redirectTo) window.location.href = redirectTo
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
