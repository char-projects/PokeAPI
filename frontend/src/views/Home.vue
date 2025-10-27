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
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { getCurrentUser, logout } from '../services/auth'

const router = useRouter()
const authed = ref(false)
const userName = ref<string | null>(null)

onMounted(async () => {
  const user = await getCurrentUser()
  authed.value = !!user
  if (user) userName.value = user.name || user.preferred_username || user.email || null
})

const goToLogin = () => {
  router.push({ name: 'login' })
}

const signout = async () => {
  await logout('/')
  router.replace('/')
}
</script>
