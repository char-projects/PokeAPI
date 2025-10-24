<template>
  <div class="min-h-screen flex flex-col">
    <header class="bg-blue-600 text-white p-4 shadow-md">
      <div class="max-w-5xl mx-auto flex justify-between items-center">
        <router-link to="/" class="font-bold text-xl">PokeAPI</router-link>
        <nav class="space-x-4">
          <router-link to="/" class="hover:underline">Home</router-link>
          <router-link to="/create" class="hover:underline">Create</router-link>
        </nav>
      </div>
    </header>

    <main class="flex-1 p-4">
      <router-view />
    </main>

    <footer class="text-center text-sm p-4 border-t">
      Made by cschnath <3
    </footer>
  </div>
</template>

<script lang="ts" setup>
</script>

<style scoped>
</style>
