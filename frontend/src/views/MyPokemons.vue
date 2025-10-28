<template>
  <div class="p-4 text-white w-full max-w-3xl">
    <h2 class="text-xl font-bold mb-4 text-center">My Pokémons</h2>
    <div v-if="loading">Loading...</div>
    <div v-else>
      <div v-if="items.length === 0" class="text-slate-300 text-center">No pokémons saved yet.</div>
        <ul class="space-y-3 mt-3">
          <li v-for="p in items" :key="p.id" class="border rounded p-3 bg-neutral-800 text-white">
            <div class="flex items-start gap-3">
              <div class="w-32 h-32 flex-shrink-0 bg-black rounded overflow-hidden">
                <img v-if="p.imageUrl" :src="p.imageUrl" alt="pokemon" class="w-full h-full object-cover" />
                <div v-else class="w-full h-full flex items-center justify-center text-slate-400">No image</div>
              </div>
              <div class="flex-1">
                <div class="font-semibold">{{ p.name }}</div>
                <div class="text-sm text-slate-300">{{ p.description }}</div>
              </div>
              <div class="flex items-start gap-2">
                <button @click="onDelete(p.id)" class="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700">Delete</button>
                <button @click="downloadItem(p)" class="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700">Download</button>
                <button @click="copyLink(p)" class="px-3 py-1 border rounded">Copy Link</button>
                <div v-if="copiedId === String(p.id)" class="text-xs text-slate-300 ml-2">Copied!</div>
              </div>
            </div>
          </li>
        </ul>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, onMounted } from 'vue'
import { getMyPokemons, deleteMyPokemon } from '../services/api'

const items = ref<Array<any>>([])
const loading = ref(false)
const copiedId = ref<string | null>(null)

const load = async () => {
  loading.value = true
  try {
  const data = await getMyPokemons()
  items.value = data || []
  } catch (err) {
    console.error('Failed to fetch pokemons', err)
    items.value = []
  } finally {
    loading.value = false
  }
}

const onDelete = async (id: number | string) => {
  if (!confirm('Delete this Pokémon?')) return
  try {
    await deleteMyPokemon(id)
    items.value = items.value.filter(i => String(i.id) !== String(id))
  } catch (err) {
    console.error('Failed to delete', err)
    alert('Failed to delete')
  }
}

onMounted(load)

const downloadItem = async (p: any) => {
  if (!p || !p.imageUrl) return
  const doAnchor = (href: string) => {
    const a = document.createElement('a')
    a.href = href
    a.download = `${p.name || 'pokemon'}.png`
    document.body.appendChild(a)
    a.click()
    a.remove()
  }

  try {
    let url = p.imageUrl
    try {
      if (url.startsWith('/data/')) url = `${window.location.protocol}//${window.location.host}${url}`
    } catch (e) {}
    if (url.startsWith('data:')) {
      doAnchor(url)
      return
    }
    const resp = await fetch(url, { credentials: 'include' })
    if (!resp.ok) {
      window.open(url, '_blank')
      return
    }
    const blob = await resp.blob()
    const blobUrl = URL.createObjectURL(blob)
    doAnchor(blobUrl)
    setTimeout(() => URL.revokeObjectURL(blobUrl), 5000)
  } catch (e) {
    try { window.open(p.imageUrl, '_blank') } catch (e2) { console.error('download failed', e2) }
  }
}

const copyLink = async (p: any) => {
  if (!p || !p.imageUrl) return
  try {
    let link = p.imageUrl
    try { if (link.startsWith('/data/')) link = `${window.location.protocol}//${window.location.host}${link}` } catch (e) {}
    await navigator.clipboard.writeText(link)
    copiedId.value = String(p.id)
    setTimeout(() => { copiedId.value = null }, 3000)
  } catch (e) {
    console.error('copy failed', e)
    try { window.open(p.imageUrl, '_blank') } catch {}
  }
}

</script>