type TokenResponse = {
    access_token: string
    refresh_token?: string
    expires_in?: number
    token_type?: string
    id_token?: string
}

export const LS_KEY = {
    ACCESS: "poke_access_token",
    REFRESH: "poke_refresh_token",
    EXPIRES_AT: "poke_token_expires_at",
    CODE_VERIFIER: "poke_pkce_code_verifier",
    USER: "poke_user",
}

const CLIENT_ID = import.meta.env.VITE_OAUTH_CLIENT_ID as string
const AUTHORIZE_URL = import.meta.env.VITE_OAUTH_AUTHORIZE_URL as string
const TOKEN_URL = import.meta.env.VITE_OAUTH_TOKEN_URL as string | undefined
const REDIRECT_URI = import.meta.env.VITE_OAUTH_REDIRECT_URI as string
let SCOPES = (import.meta.env.VITE_OAUTH_SCOPES as string) || "openid profile email"
if (SCOPES.includes('@') || SCOPES.trim().startsWith('mailto:')) {
    console.warn('VITE_OAUTH_SCOPES looks like an email address; falling back to default scopes')
    SCOPES = 'openid profile email'
}
const _BACKEND_OAUTH_BASE = (import.meta.env.VITE_OAUTH_BACKEND_TOKEN_EXCHANGE as string | undefined) ?? '/api/oauth'
const BACKEND_OAUTH_BASE = _BACKEND_OAUTH_BASE.replace(/\/exchange\/?$/i, '')

const randomString = (length = 64) => {
    const charset = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~"
    let res = ""
    const random = crypto.getRandomValues(new Uint8Array(length))
    for (let i = 0; i < length; i++) res += charset[random[i] % charset.length]
    return res
}

import api from './api'
import axios from 'axios'

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
                    const res = await api.post('/api/oauth/complete', { access_token: token })
                    const tr: TokenResponse = res.data
                    // tr may include `user` in our flow; guard property access
                    console.debug('[auth] backend /oauth/complete response:', { has_access_token: !!tr?.access_token, user: (tr as any)?.user })
                    saveTokens(tr)
                } catch (err: any) {
                    console.debug('[auth] backend /oauth/complete failed:', err?.response?.status, err?.response?.data)
                    try {
                        saveTokens({ access_token: token } as TokenResponse)
                    } catch (e) {
                        // ignore
                    }
                }
                history.replaceState(null, '', window.location.pathname + window.location.search)
            }
        } catch (e) {
            // ignore
        }
    })()
    return initPromise
}

const base64UrlEncode = (arrayBuffer: ArrayBuffer) => {
    const bytes = new Uint8Array(arrayBuffer)
    let str = ""
    for (let i = 0; i < bytes.byteLength; i++) str += String.fromCharCode(bytes[i])
    return btoa(str).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "")
}

const sha256 = async (plain: string) => {
    const encoder = new TextEncoder()
    const data = encoder.encode(plain)
    const hash = await crypto.subtle.digest("SHA-256", data)
    return base64UrlEncode(hash)
}

const saveTokens = (tr: TokenResponse | null) => {
    if (!tr) {
        localStorage.removeItem(LS_KEY.CODE_VERIFIER)
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

export const loginWithPKCE = async () => {
    if (!CLIENT_ID || !AUTHORIZE_URL || !REDIRECT_URI) {
        throw new Error("OAuth config missing (CLIENT_ID, AUTHORIZE_URL, or REDIRECT_URI).")
    }

    const codeVerifier = randomString(64)
    localStorage.setItem(LS_KEY.CODE_VERIFIER, codeVerifier)

    const codeChallenge = await sha256(codeVerifier)
    const params = new URLSearchParams({
        response_type: "code",
        client_id: CLIENT_ID,
        redirect_uri: REDIRECT_URI,
        scope: SCOPES,
        code_challenge: codeChallenge,
        code_challenge_method: "S256",
    })
    const redirectUrl = `${AUTHORIZE_URL}?${params.toString()}`
    console.debug('Redirecting to OAuth authorize URL:', redirectUrl)
    window.location.href = redirectUrl
}

export const handleRedirectCallback = async (): Promise<TokenResponse | null> => {
    const url = new URL(window.location.href)
    const code = url.searchParams.get("code")
    const error = url.searchParams.get("error")
    if (error) {
        console.error("OAuth error:", error, url.searchParams.get("error_description"))
        return null
    }
    if (!code) return null

    const codeVerifier = localStorage.getItem(LS_KEY.CODE_VERIFIER)
    if (!codeVerifier) {
        throw new Error("PKCE code_verifier not found in storage.")
    }
    localStorage.removeItem(LS_KEY.CODE_VERIFIER)
    let backendError: string | null = null
    try {
        const res = await api.post(`${BACKEND_OAUTH_BASE}/exchange`, { code, redirect_uri: REDIRECT_URI, code_verifier: codeVerifier })
        const tr: TokenResponse = res.data
        saveTokens(tr)
        return tr
    } catch (err: any) {
        if (err?.response) {
            try {
                backendError = `Backend token exchange failed (status ${err.response.status}): ${JSON.stringify(err.response.data)}`
            } catch (e) {
                backendError = `Backend token exchange failed: ${String(err)}`
            }
        } else {
            backendError = `Backend token exchange error: ${String(err)}`
        }
        console.warn(backendError)
    }

    if (!TOKEN_URL) {
        const msg = backendError || "No TOKEN_URL configured and backend exchange failed."
        console.error(msg)
        throw new Error(msg)
    }

    try {
        const body = new URLSearchParams({
            grant_type: "authorization_code",
            client_id: CLIENT_ID,
            code,
            redirect_uri: REDIRECT_URI,
            code_verifier: codeVerifier,
        })
        const res2 = await axios.post(TOKEN_URL!, body.toString(), { headers: { "Content-Type": "application/x-www-form-urlencoded" } })
        const tr: TokenResponse = res2.data
        saveTokens(tr)
        return tr
    } catch (err: any) {
        let combined = ''
        if (backendError) combined += backendError + ' | '
        if (err?.response) combined += `Provider token exchange failed (status ${err.response.status}): ${JSON.stringify(err.response.data)}`
        else combined += err?.message || String(err)
        throw new Error(combined)
    }
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
        console.error("Refresh token failed", err)
        return false
    }
}

export const decodeJwt = (token?: string) => {
    if (!token) return null
    try {
        const parts = token.split(".")
        if (parts.length < 2) return null
        const payload = parts[1].replace(/-/g, "+").replace(/_/g, "/")
        const json = atob(payload)
        return JSON.parse(decodeURIComponent(escape(json)))
    } catch {
        return null
    }
}
