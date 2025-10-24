/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE?: string
  readonly VITE_OAUTH_CLIENT_ID?: string
  readonly VITE_OAUTH_AUTHORIZE_URL?: string
  readonly VITE_OAUTH_TOKEN_URL?: string
  readonly VITE_OAUTH_REDIRECT_URI?: string
  readonly VITE_OAUTH_SCOPES?: string
  readonly VITE_OAUTH_BACKEND_TOKEN_EXCHANGE?: string
  readonly VITE_SD_API_URL?: string
  readonly VITE_SD_API_KEY?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
