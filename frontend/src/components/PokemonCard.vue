<template>
  <div
    class="border rounded-lg shadow-sm bg-neutral-800 overflow-hidden hover:shadow-md transition-shadow text-white"
  >
    <img
        :src="image"
        :alt="name || 'Generated Pokémon'"
        class="w-full aspect-square object-cover"
    />

    <div class="p-3 text-center">
      <h3 class="font-semibold text-lg truncate">
        {{ name || 'Unnamed Pokémon' }}
      </h3>
      <p class="text-gray-300 text-sm mt-1">
        {{ description || 'AI-generated creature' }}
      </p>

      <button
          @click="$emit('share', image)"
          class="mt-3 px-4 py-1.5 text-sm border border-white/20 rounded-md hover:bg-white/5 transition-colors"
      >
        Share
      </button>
    </div>
  </div>
</template>

<script lang="ts" setup>
defineProps<{
  name?: string
  description?: string
  image: string
}>()

defineEmits<{
  (e: 'share', imageUrl: string): void
}>()
</script>
