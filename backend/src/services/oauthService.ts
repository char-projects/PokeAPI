import axios from 'axios'
import { OAUTH_CLIENT_ID, OAUTH_CLIENT_SECRET, OAUTH_TOKEN_URL } from '../config.js'

export const exchangeToken = async (code: string, redirect_uri: string, code_verifier: string) => {
  if (!OAUTH_TOKEN_URL || !OAUTH_CLIENT_ID) throw new Error('OAuth server not configured')
  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    redirect_uri,
    client_id: OAUTH_CLIENT_ID,
    code_verifier,
  })
  // if (OAUTH_CLIENT_SECRET) body.set('client_secret', OAUTH_CLIENT_SECRET)

  const r = await axios.post(OAUTH_TOKEN_URL, body.toString(), { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } })
  return r.data
}

export const refreshToken = async (refresh_token: string) => {
  if (!OAUTH_TOKEN_URL || !OAUTH_CLIENT_ID) throw new Error('OAuth server not configured')
  const body = new URLSearchParams({
    grant_type: 'refresh_token',
    refresh_token,
    client_id: OAUTH_CLIENT_ID,
  })
  if (OAUTH_CLIENT_SECRET) body.set('client_secret', OAUTH_CLIENT_SECRET)
  const r = await axios.post(OAUTH_TOKEN_URL, body.toString(), { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } })
  return r.data
}
