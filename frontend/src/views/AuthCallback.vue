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
import { handleRedirectCallback } from '../services/auth'
import { useRouter } from 'vue-router'

const router = useRouter()
const error = ref('')
const callbackUrl = ref(window.location.href)

onMounted(async () => {
  try {
    const tr = await handleRedirectCallback()
    if (tr) {
      router.replace({ path: '/create', query: {} })
    } else {
      error.value = 'No authorization code found or token exchange failed. Please try signing in again.'
    }
  } catch (err: any) {
    console.error('Callback handling failed', err)
    error.value = err?.message || 'Sign-in failed'
  }
})

</script>