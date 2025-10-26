<template>
  <div
      v-if="open"
      class="fixed inset-0 flex items-center justify-center bg-black/40 z-50"
      @click.self="close"
  >
  <div
    class="bg-white rounded-xl shadow-lg w-11/12 max-w-sm p-6 relative transition-transform transition-opacity duration-200 ease-out"
  >
      <button
          @click="close"
          aria-label="Close modal"
          class="absolute top-3 right-3 text-gray-400 hover:text-gray-700"
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
            class="w-full border rounded-md py-2 hover:bg-gray-100"
        >
          Copy Image Link
        </button>

        <button
            @click="downloadImage"
            class="w-full border rounded-md py-2 hover:bg-gray-100"
        >
          Download Image
        </button>

        <button
            v-if="canShare"
            @click="shareNative"
            class="w-full border rounded-md py-2 hover:bg-gray-100"
        >
          Share via Device
        </button>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref } from "vue"

const props = defineProps<{ open: boolean; image: string }>()
const emit = defineEmits<{ (e: "close"): void }>()

const canShare = !!navigator.share
const copied = ref(false)

const close = () => emit("close")

const copyLink = async () => {
  try {
    await navigator.clipboard.writeText(props.image)
    copied.value = true
    alert("Copied to clipboard!")
  } catch {
    alert("Unable to copy link.")
  }
}

const downloadImage = () => {
  const a = document.createElement("a")
  a.href = props.image
  a.download = "pokemon.png"
  a.click()
}

const shareNative = () => {
  navigator.share({
    title: "Check out my Pokémon!",
    url: window.location.href,
  })
}

</script>