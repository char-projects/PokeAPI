<template>
  <div class="bg-black text-white min-h-screen">
    <div class="p-6 max-w-md mx-auto">
      <h2 class="text-xl font-bold mb-4">Sign in</h2>
      <p class="mb-4">Sign in with your OAuth provider</p>
      <button @click="login" class="px-4 py-2 bg-blue-600 text-white rounded">Sign in</button>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { loginWithPKCE } from '../services/auth'

const login = () => {
  loginWithPKCE()
}
</script>