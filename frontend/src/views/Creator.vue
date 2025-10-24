<template>
  <div class="max-w-md mx-auto mt-8 p-4 bg-white border rounded-lg shadow-sm">
    <h2 class="text-2xl font-bold mb-4 text-center">Create your Pokémon</h2>

    <form @submit.prevent="onSubmit" class="space-y-4">
      <div>
        <label class="block text-sm font-medium mb-1">Base Animal</label>
        <select
            v-model="base"
            class="w-full border rounded p-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
        >
          <option v-for="opt in animals" :key="opt" :value="opt">
            {{ opt }}
          </option>
        </select>
      </div>

      <div>
        <label class="block text-sm font-medium mb-1">Ability</label>
        <select
            v-model="ability"
            class="w-full border rounded p-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
        >
          <option v-for="a in abilities" :key="a" :value="a">
            {{ a }}
          </option>
        </select>
      </div>

      <button
          type="submit"
          class="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 transition disabled:opacity-50"
          :disabled="loading"
      >
        {{ loading ? "Generating..." : "Generate Pokémon" }}
      </button>
    </form>

    <div v-if="imageUrl" class="mt-6">
      <PokemonCard
          :image="imageUrl"
          :name="`${base} + ${ability}`"
          :description="`A ${base} with ${ability} powers`"
          @share="openShareModal"
      />
    </div>

    <ShareModal
        v-if="modalOpen"
        :open="modalOpen"
        :image="imageUrl"
        @close="closeShareModal"
    />
  </div>
</template>

<script lang="ts" setup>
import { ref } from "vue"
import { generateImage } from "../services/api"
import PokemonCard from "../components/PokemonCard.vue"
import ShareModal from "../components/ShareModal.vue"

const animals = ["fox", "owl", "turtle", "lion", "rabbit", "snake", "eagle"]
const abilities = ["fire", "water", "electric", "psychic", "ice", "earth", "ghost"]

const base = ref(animals[0])
const ability = ref(abilities[0])
const loading = ref(false)
const imageUrl = ref("")
const modalOpen = ref(false)

const onSubmit = async () => {
  loading.value = true
  imageUrl.value = ""
  try {
    const prompt = `${base.value} creature with ${ability.value} powers, Pokémon style, bright colors, cute and detailed`
    const data = await generateImage(prompt)

    if (data.image) imageUrl.value = `data:image/png;base64,${data.image}`
    else if (data.output?.[0]) imageUrl.value = data.output[0]
    else if (data.url) imageUrl.value = data.url
    else alert("No image returned from API.")
  } catch (err) {
    console.error("Error generating image:", err)
    alert("Failed to generate image. Please try again.")
  } finally {
    loading.value = false
  }
}

const openShareModal = () => {
  modalOpen.value = true
}

const closeShareModal = () => {
  modalOpen.value = false
}
</script>

<style scoped>
div[role="img"] {
  animation: fadeIn 0.3s ease-in;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(5px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
