<template>
  <div>
    <div class="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
      <div class="flex items-center gap-3">
        <div v-if="userName" class="text-sm text-slate-700">Hi, {{ userName }}</div>
  <button v-if="!authed" @click="goToLogin" class="px-3 py-1 bg-blue-600 text-white rounded text-sm">Sign in</button>
        <button v-else @click="signout" class="px-3 py-1 border rounded text-sm">Sign out</button>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { isAuthenticated, logout, getAccessToken, decodeJwt } from '../services/auth'

const router = useRouter()

const authed = computed(() => isAuthenticated())

const token = computed(() => getAccessToken())
const userName = computed(() => {
  const dec = decodeJwt(token.value || undefined)
  return dec?.name || dec?.preferred_username || dec?.email || null
})

const goToLogin = () => {
  router.push({ name: 'login' })
}

const signout = () => {
  logout('/')
  router.replace('/')
}
</script>
