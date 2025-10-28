<template>
  <div class="p-6 max-w-md mx-auto">
    <h2 class="text-xl font-bold mb-4">Signing in...</h2>
    <div v-if="error" class="text-red-600">{{ error }}
      <div class="mt-4">
        <router-link to="/login" class="px-4 py-2 bg-blue-600 text-white rounded">Try signing in again</router-link>
      </div>
    </div>
    <div class="mt-4 text-sm text-gray-600">
      <div>Callback URL:</div>
      <pre class="break-all">{{ callbackUrl }}</pre>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { LS_KEY } from '../services/auth'
import api from '../services/api'

const router = useRouter()
const route = useRoute()
const error = ref('')
const callbackUrl = ref(window.location.href)

onMounted(async () => {
  try {
    const queryToken = route.query.access_token as string | undefined
    const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''))
    const hashToken = hashParams.get('access_token') || undefined
    const accessToken = queryToken || hashToken
    if (accessToken) {
      console.debug('[AuthCallback] access_token received:', accessToken.slice(0, 20))
      try {
        const resp = await api.post('/api/oauth/complete', { access_token: accessToken })
        const tr = resp.data
        if (tr?.access_token) {
          localStorage.setItem(LS_KEY.ACCESS, tr.access_token)
          ;(api.defaults.headers as any).common['Authorization'] = `Bearer ${tr.access_token}`
        }
      } catch (e: any) {
        console.error('Exchange to backend failed', e?.response?.data || e?.message || e)
      }
      router.replace({ path: '/create', query: {} })
    } else {
      error.value = 'No access token found in callback URL. Please try signing in again.'
    }
  } catch (err: any) {
    console.error('Callback handling failed', err)
    error.value = err?.message || 'Sign-in failed'
  }
})

</script>