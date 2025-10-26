<template>
  <div class="bg-black text-white min-h-screen">
      <div class="p-6 max-w-md mx-auto bg-neutral-900 rounded-lg border border-white/10">
        <h2 class="text-xl font-bold mb-4">Sign in</h2>

        <div class="space-y-4">
          <form @submit.prevent="localLogin" class="space-y-3">
            <div>
              <label class="block text-sm mb-1">Email or Username</label>
              <input v-model="username" class="w-full p-2 rounded bg-white text-black" />
              <div v-if="usernameError" class="text-sm text-red-400 mt-1">{{ usernameError }}</div>
            </div>

            <div>
              <label class="block text-sm mb-1">Password</label>
              <div class="relative">
                <input :type="showPassword ? 'text' : 'password'" v-model="password" class="w-full p-2 rounded bg-white text-black" />
                <button type="button" @click="showPassword = !showPassword" class="absolute right-2 top-2 text-sm text-slate-600">{{ showPassword ? 'Hide' : 'Show' }}</button>
              </div>
              <div v-if="passwordError" class="text-sm text-red-400 mt-1">{{ passwordError }}</div>
            </div>

            <div class="flex items-center justify-between gap-3">
              <div class="flex items-center gap-3">
                <input id="remember" type="checkbox" v-model="rememberMe" class="w-4 h-4" />
                <label for="remember" class="text-sm">Remember me</label>
              </div>
              <div class="flex gap-3">
                <button type="submit" class="px-4 py-2 bg-green-600 text-white rounded">Sign in</button>
                <button type="button" @click="localRegister" class="px-4 py-2 border rounded">Register</button>
              </div>
            </div>

            <div v-if="message" class="mt-3 text-sm text-red-400">{{ message }}</div>
          </form>

          <div class="border-t border-white/10 pt-4 text-center">
            <button @click="login" class="px-4 py-2 bg-blue-600 text-white rounded">Sign in with Google</button>
          </div>
        </div>
      </div>
  </div>
</template>

<script lang="ts" setup>
import { loginWithPKCE } from '../services/auth'
import { ref } from 'vue'

const login = () => {
  loginWithPKCE()
}

const username = ref('')
const password = ref('')
const message = ref('')
const rememberMe = ref(false)
const showPassword = ref(false)
const usernameError = ref('')
const passwordError = ref('')

const localLogin = async () => {
  message.value = ''
  usernameError.value = ''
  passwordError.value = ''
  if (!username.value || username.value.trim().length < 1) {
    usernameError.value = 'Username or email is required'
  }
  if (!password.value || password.value.length < 4) {
    passwordError.value = 'Password must be at least 4 characters'
  }
  if (usernameError.value || passwordError.value) return

  try {
    const res = await fetch('http://localhost:3000/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: username.value, password: password.value }),
      credentials: 'include',
    })
    const text = await res.text()
    if (!res.ok) {
      message.value = `Login failed: ${text}`
      return
    }
    const data = JSON.parse(text)
    if (rememberMe.value && data.access_token) {
      localStorage.setItem('poke_access_token', data.access_token)
    }
    message.value = 'Signed in successfully'
    setTimeout(() => (window.location.href = '/'), 500)
  } catch (err: any) {
    message.value = String(err?.message || err)
  }
}

const localRegister = async () => {
  message.value = ''
  usernameError.value = ''
  passwordError.value = ''
  if (!username.value || username.value.trim().length < 1) {
    usernameError.value = 'Username or email is required'
  }
  if (!password.value || password.value.length < 4) {
    passwordError.value = 'Password must be at least 4 characters'
  }
  if (usernameError.value || passwordError.value) return

  try {
      const res = await fetch('/api/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: username.value, password: password.value }),
      credentials: 'include',
    })
    const text = await res.text()
    if (!res.ok) {
      message.value = `Register failed: ${text}`
      return
    }
    const data = JSON.parse(text)
    if (rememberMe.value && data.access_token) localStorage.setItem('poke_access_token', data.access_token)
    message.value = 'Registered successfully'
    setTimeout(() => (window.location.href = '/'), 500)
  } catch (err: any) {
    message.value = String(err?.message || err)
  }
}
</script>