<template>
  <div
      class="border rounded-lg shadow-sm bg-white overflow-hidden hover:shadow-md transition-shadow"
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
      <p class="text-gray-500 text-sm mt-1">
        {{ description || 'AI-generated creature' }}
      </p>

      <button
          @click="$emit('share', image)"
          class="mt-3 px-4 py-1.5 text-sm border rounded-md hover:bg-gray-100 transition-colors"
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
