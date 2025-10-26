<template>
  <div class="p-4">
    <h2 class="text-xl font-bold mb-4">My Pokémons</h2>
    <div v-if="loading">Loading...</div>
    <div v-else>
      <div v-if="items.length === 0" class="text-slate-600">No pokémons saved yet.</div>
      <ul class="space-y-3 mt-3">
        <li v-for="p in items" :key="p.id" class="border rounded p-3 bg-white">
          <div class="flex items-start gap-3">
            <div>
              <div class="font-semibold">{{ p.name }}</div>
              <div class="text-sm text-slate-600">{{ p.description }}</div>
            </div>
          </div>
        </li>
      </ul>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, onMounted } from 'vue'
import { getPokemons } from '../services/api'

const items = ref<Array<any>>([])
const loading = ref(false)

const load = async () => {
  loading.value = true
  try {
    const data = await getPokemons()
    items.value = data || []
  } catch (err) {
    console.error('Failed to fetch pokemons', err)
    items.value = []
  } finally {
    loading.value = false
  }
}

onMounted(load)

</script>