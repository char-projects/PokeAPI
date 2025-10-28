<template>
  <div
      v-if="open"
      class="fixed inset-0 flex items-center justify-center bg-black/40 z-50"
      @click.self="close"
  >
  <div
    class="bg-neutral-800 rounded-xl shadow-lg w-11/12 max-w-sm p-6 relative transition-transform transition-opacity duration-200 ease-out text-white"
  >
      <button
          @click="close"
          aria-label="Close modal"
          class="absolute top-3 right-3 text-gray-300 hover:text-white"
      >
        ✕
      </button>

      <h2 class="text-xl font-semibold mb-3 text-center">Share your Pokémon</h2>

      <img
          :src="image"
          alt="Pokémon preview"
          class="w-full rounded-lg mb-4 shadow-sm"
      />

      <div class="space-y-3 text-center">
        <button
            @click="copyLink"
            class="w-full border border-white/20 rounded-md py-2 hover:bg-white/5"
        >
          Copy Image Link
        </button>

        <button
            @click="downloadImage"
            class="w-full border border-white/20 rounded-md py-2 hover:bg-white/5"
        >
          Download Image
        </button>

        <button
            v-if="canShare"
            @click="shareNative"
            class="w-full border border-white/20 rounded-md py-2 hover:bg-white/5"
        >
          Share via Device
        </button>
      </div>

      <div class="mt-4">
        <div v-if="showConfirmSave" class="bg-neutral-700 p-3 rounded space-y-2 text-sm">
          <div>Save this image to the server to create a shareable HTTP link?</div>
          <div class="flex gap-2 mt-2">
            <button @click="doSaveAndCopy" class="flex-1 px-3 py-1 bg-green-600 rounded text-white">Save & Copy</button>
            <button @click="cancelSaveConfirm" class="flex-1 px-3 py-1 border rounded">Cancel</button>
          </div>
        </div>
        <div v-if="statusMessage" :class="['mt-3 text-sm p-2 rounded', statusSuccess ? 'bg-green-700 text-white' : 'bg-yellow-700 text-white']">
          {{ statusMessage }}
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref } from 'vue'
import { createPokemon } from '../services/api'

const props = defineProps<{ open: boolean; image: string; name?: string; description?: string }>()
const emit = defineEmits<{ (e: 'close'): void; (e: 'saved', payload: any): void }>()

const canShare = !!navigator.share
const copying = ref(false)
const showConfirmSave = ref(false)
const statusMessage = ref('')
const statusSuccess = ref(false)

const close = () => emit('close')

const copyLink = async () => {
  if (copying.value) return
  if (props.image && props.image.startsWith('data:')) {
    showConfirmSave.value = true
    return
  }

  copying.value = true
  try {
    let toCopy = props.image
    try {
      if (props.image && props.image.startsWith('/data/')) {
        toCopy = `${window.location.protocol}//${window.location.host}${props.image}`
      }
    } catch (e) {}

    try {
      await navigator.clipboard.writeText(toCopy)
      statusMessage.value = 'Copied link to clipboard!'
      statusSuccess.value = true
      setTimeout(() => { statusMessage.value = ''; statusSuccess.value = false }, 3000)
    } catch {
      statusMessage.value = 'Unable to copy link to clipboard.'
      statusSuccess.value = false
      setTimeout(() => { statusMessage.value = ''; statusSuccess.value = false }, 3000)
    }
  } finally {
    copying.value = false
  }
}

const cancelSaveConfirm = () => {
  showConfirmSave.value = false
}

const doSaveAndCopy = async () => {
  if (copying.value) return
  copying.value = true
  statusMessage.value = ''
  try {
    try {
      const created = await createPokemon({ name: props.name || 'Shared Pokémon', description: props.description || '', imageUrl: props.image })
      const link = created?.imageUrl || created?.url || ''
      if (!link) {
        statusMessage.value = 'Saved but could not obtain a shareable link.'
        statusSuccess.value = false
        setTimeout(() => { statusMessage.value = ''; statusSuccess.value = false }, 3000)
        return
      }
      try {
        await navigator.clipboard.writeText(link)
        statusMessage.value = 'Saved and copied shareable link to clipboard!'
        statusSuccess.value = true
        setTimeout(() => { statusMessage.value = ''; statusSuccess.value = false }, 3000)
        showConfirmSave.value = false
        emit('saved', created)
      } catch (e) {
        console.error('Clipboard write failed', e)
        statusMessage.value = 'Saved but failed to copy link to clipboard.'
        statusSuccess.value = false
        setTimeout(() => { statusMessage.value = ''; statusSuccess.value = false }, 3000)
      }
      return
    } catch (err: any) {
      if (err && err.response && err.response.status === 401) {
      } else {
        console.error('Create (normal) failed', err)
        statusMessage.value = 'Failed to save image for sharing.'
        statusSuccess.value = false
        setTimeout(() => { statusMessage.value = ''; statusSuccess.value = false }, 3000)
        return
      }
    }

  const created = await createPokemon({ name: props.name || 'Shared Pokémon', description: props.description || '', imageUrl: props.image, shareOnly: true })
    const link = created?.imageUrl || created?.url || ''
    if (!link) {
      statusMessage.value = 'Saved but could not obtain a shareable link.'
      statusSuccess.value = false
      setTimeout(() => { statusMessage.value = ''; statusSuccess.value = false }, 3000)
      return
    }
    try {
      await navigator.clipboard.writeText(link)
      statusMessage.value = 'Saved and copied shareable link to clipboard!'
      statusSuccess.value = true
      setTimeout(() => { statusMessage.value = ''; statusSuccess.value = false }, 3000)
      showConfirmSave.value = false
    } catch (e) {
      console.error('Clipboard write failed', e)
      statusMessage.value = 'Saved but failed to copy link to clipboard.'
      statusSuccess.value = false
      setTimeout(() => { statusMessage.value = ''; statusSuccess.value = false }, 3000)
    }
  } catch (err) {
    console.error('Failed to save and copy:', err)
    statusMessage.value = 'Failed to save image for sharing.'
    statusSuccess.value = false
    setTimeout(() => { statusMessage.value = ''; statusSuccess.value = false }, 3000)
  } finally {
    copying.value = false
  }
}

const downloadImage = () => {
  const a = document.createElement('a')
  a.href = props.image
  a.download = 'pokemon.png'
  document.body.appendChild(a)
  a.click()
  a.remove()
}

const shareNative = () => {
  navigator.share({
    title: 'Check out my Pokémon!',
    url: window.location.href,
  })
}

</script>