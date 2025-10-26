type TokenResponse = {
    access_token: string
    refresh_token?: string
    expires_in?: number
    token_type?: string
    id_token?: string
}

const LS_KEY = {
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
        localStorage.removeItem(LS_KEY.ACCESS)
        localStorage.removeItem(LS_KEY.REFRESH)
        localStorage.removeItem(LS_KEY.EXPIRES_AT)
        localStorage.removeItem(LS_KEY.USER)
        return
    }
    localStorage.setItem(LS_KEY.ACCESS, tr.access_token)
    if (tr.refresh_token) localStorage.setItem(LS_KEY.REFRESH, tr.refresh_token)
    if (tr.expires_in) {
        const expiresAt = Date.now() + tr.expires_in * 1000
        localStorage.setItem(LS_KEY.EXPIRES_AT, String(expiresAt))
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
        const res = await fetch(`${BACKEND_OAUTH_BASE}/exchange`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ code, redirect_uri: REDIRECT_URI, code_verifier: codeVerifier }),
            credentials: "include",
        })
        const text = await res.text()
        if (res.ok) {
            try {
                const tr: TokenResponse = JSON.parse(text)
                saveTokens(tr)
                return tr
            } catch (e) {
                console.error('Failed to parse token response JSON', e, text)
                backendError = `Failed to parse backend token response: ${text}`
            }
        } else {
            backendError = `Backend token exchange failed (status ${res.status}): ${text}`
            console.warn(backendError)
        }
    } catch (err: any) {
        backendError = `Backend token exchange error: ${String(err)}`
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

        const res2 = await fetch(TOKEN_URL, {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: body.toString(),
        })

        if (!res2.ok) {
            const text2 = await res2.text()
            const msg = `Provider token exchange failed (status ${res2.status}): ${text2}`
            console.error(msg)
            throw new Error(`${backendError ? backendError + ' | ' : ''}${msg}`)
        }

        const tr: TokenResponse = await res2.json()
        saveTokens(tr)
        return tr
    } catch (err: any) {
        const combined = `${backendError ? backendError + ' | ' : ''}${err?.message || String(err)}`
        throw new Error(combined)
    }
}

export const getAuthHeader = (): Record<string, string> => {
    const token = localStorage.getItem(LS_KEY.ACCESS)
    if (!token) return {}
    return { Authorization: `Bearer ${token}` }
}

export const getAccessToken = () => localStorage.getItem(LS_KEY.ACCESS) || null

export const isAuthenticated = (): boolean => {
    const token = localStorage.getItem(LS_KEY.ACCESS)
    if (!token) return false
    const expires = localStorage.getItem(LS_KEY.EXPIRES_AT)
    if (expires && Number(expires) < Date.now()) return false
    return true
}

export const logout = (redirectTo?: string) => {
    saveTokens(null)
    if (redirectTo) window.location.href = redirectTo
}

export const refreshToken = async (): Promise<boolean> => {
    try {
        const res = await fetch(`${BACKEND_OAUTH_BASE}/refresh`, {
            method: "POST",
            credentials: "include",
        })
        if (!res.ok) return false
        const tr: TokenResponse = await res.json()
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
