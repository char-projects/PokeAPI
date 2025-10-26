<template>
  <div class="max-w-3xl w-full mx-auto p-10 bg-neutral-900 border border-white/10 rounded-2xl shadow-lg text-white">
    <h2 class="text-2xl font-bold mb-4 text-center">Create your Pokémon</h2>
    <div class="flex items-center gap-4">
        <router-link to="/mypokemons" class="text-white hover:underline">My Pokémons</router-link>
    </div>

  <div>
    <div class="mb-4">
      <nav class="inline-flex rounded-lg bg-neutral-800 p-1">
        <button :class="['px-4 py-2 rounded-md', selectedTab === 'composer' ? 'bg-neutral-700' : 'text-white']" @click="selectedTab = 'composer'">Composer</button>
        <button :class="['px-4 py-2 rounded-md', selectedTab === 'prompt' ? 'bg-neutral-700' : 'text-white']" @click="selectedTab = 'prompt'">Prompt</button>
      </nav>
    </div>

    <form @submit.prevent="onSubmit" class="space-y-6">
      <div v-if="selectedTab === 'composer'">
        <div>
          <label class="block text-md font-medium mb-2">Base Animal</label>
          <select v-model="base" class="w-full border rounded-lg p-3 text-lg bg-white text-black focus:outline-none focus:ring-2 focus:ring-blue-400">
            <option v-for="opt in animals" :key="opt" :value="opt">{{ opt }}</option>
          </select>
        </div>

        <div>
          <label class="block text-md font-medium mb-2">Ability</label>
          <select v-model="ability" class="w-full border rounded-lg p-3 text-lg bg-white text-black focus:outline-none focus:ring-2 focus:ring-blue-400">
            <option v-for="a in abilities" :key="a" :value="a">{{ a }}</option>
          </select>
        </div>
      </div>

      <div v-if="selectedTab === 'prompt'">
        <label class="block text-md font-medium mb-2">Enter your prompt</label>
  <textarea v-model="promptText" rows="4" class="w-full border rounded-lg p-3 text-lg bg-white text-black placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-400" placeholder="Describe the Pokémon or scene you want..."></textarea>
      </div>

      <div class="flex flex-col sm:flex-row gap-4">
        <button type="submit" class="flex-1 bg-indigo-600 text-white py-3 rounded-lg text-lg hover:bg-indigo-700 transition" :disabled="loading">
          {{ loading ? 'Generating...' : 'Generate Pokémon' }}
        </button>
        <button type="button" class="px-5 py-3 border rounded-lg text-lg" @click="reset">Reset</button>
      </div>
    </form>
  </div>

  <div v-if="error" class="mt-4 text-sm text-red-400">{{ error }}</div>

  <div v-if="imageUrl" class="mt-8 flex flex-col items-center gap-6">
      <div class="w-full max-w-xl">
        <PokemonCard :image="imageUrl" :name="name" :description="description" @share="openShareModal" />
      </div>

      <div class="w-full max-w-xl flex flex-col sm:flex-row gap-4 justify-center">
        <button class="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg text-lg" @click="savePokemon">Save</button>
        <button class="flex-1 px-6 py-3 border rounded-lg text-lg" @click="download">Download</button>
      </div>
    </div>

    <ShareModal v-if="modalOpen" :open="modalOpen" :image="imageUrl" @close="closeShareModal" />
  </div>
</template>

<script lang="ts" setup>
import { ref, computed } from 'vue'
import { generateImage, createPokemon } from '../services/api'
import { isAuthenticated, loginWithPKCE } from '../services/auth'
import PokemonCard from '../components/PokemonCard.vue'
import ShareModal from '../components/ShareModal.vue'

const animals = ['fox','owl','turtle','butterfly','lion','rabbit','snake','eagle']
const abilities = ['fire','water','electric','psychic','ice','earth','ghost']

const base = ref(animals[0])
const ability = ref(abilities[0])
const selectedTab = ref<'composer' | 'prompt'>('composer')
const promptText = ref('')
const loading = ref(false)
const imageUrl = ref('')
const modalOpen = ref(false)
const error = ref('')

const name = computed(() => {
  if (selectedTab.value === 'prompt') {
    return promptText.value ? (promptText.value.length > 30 ? promptText.value.slice(0, 30) + '…' : promptText.value) : 'Custom Prompt'
  }
  return `${base.value} + ${ability.value}`
})

const description = computed(() => {
  if (selectedTab.value === 'prompt') return promptText.value || 'AI-generated from custom prompt'
  return `A ${base.value} with ${ability.value} powers`
})

const onSubmit = async () => {
  loading.value = true
  imageUrl.value = ''
  error.value = ''
  try {
    const prompt = selectedTab.value === 'prompt' && promptText.value
      ? promptText.value
      : `${base.value} creature with ${ability.value} powers, Pokémon style, bright colors, cute and detailed`
    const data = await generateImage(prompt)
    if (data.image) imageUrl.value = `data:image/png;base64,${data.image}`
    else if (data.output?.[0]) imageUrl.value = data.output[0]
    else if (data.url) imageUrl.value = data.url
    else throw new Error('No image returned from API')
  } catch (err: any) {
    console.error('Error generating image:', err)
    error.value = err?.message || 'Failed to generate image. Please try again.'
  } finally {
    loading.value = false
  }
}

const openShareModal = () => { modalOpen.value = true }
const closeShareModal = () => { modalOpen.value = false }

const reset = () => {
  base.value = animals[0]
  ability.value = abilities[0]
  imageUrl.value = ''
  error.value = ''
  promptText.value = ''
  selectedTab.value = 'composer'
}

const savePokemon = async () => {
  if (!imageUrl.value) return
  if (!isAuthenticated()) {
    if (confirm('You need to sign in to save. Sign in now?')) loginWithPKCE()
    return
  }
  try {
    await createPokemon({ name: name.value, description: description.value, imageUrl: imageUrl.value })
    alert('Saved Pokémon successfully!')
  } catch (err) {
    console.error('Save failed', err)
    alert('Failed to save Pokémon. Make sure you are signed in and try again.')
  }
}

const download = () => {
  if (!imageUrl.value) return
  const a = document.createElement('a')
  a.href = imageUrl.value
  a.download = `${name.value}.png`
  document.body.appendChild(a)
  a.click()
  a.remove()
}
</script>

<style scoped>
</style>