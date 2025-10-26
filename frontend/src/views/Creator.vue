<template>
  <div class="max-w-3xl mx-auto mt-12 p-10 bg-white border rounded-2xl shadow-lg">
    <h2 class="text-2xl font-bold mb-4 text-center">Create your Pokémon</h2>
    <div class="flex items-center gap-4">
        <router-link to="/mypokemons" class="text-sm text-slate-600 hover:underline">My Pokémons</router-link>
    </div>

  <form @submit.prevent="onSubmit" class="space-y-6">
      <div>
        <label class="block text-md font-medium mb-2">Base Animal</label>
        <select v-model="base" class="w-full border rounded-lg p-3 text-lg focus:outline-none focus:ring-2 focus:ring-blue-400">
          <option v-for="opt in animals" :key="opt" :value="opt">{{ opt }}</option>
        </select>
      </div>

      <div>
        <label class="block text-md font-medium mb-2">Ability</label>
        <select v-model="ability" class="w-full border rounded-lg p-3 text-lg focus:outline-none focus:ring-2 focus:ring-blue-400">
          <option v-for="a in abilities" :key="a" :value="a">{{ a }}</option>
        </select>
      </div>

      <div class="flex flex-col sm:flex-row gap-4">
        <button type="submit" class="flex-1 bg-indigo-600 text-white py-3 rounded-lg text-lg hover:bg-indigo-700 transition" :disabled="loading">
          {{ loading ? 'Generating...' : 'Generate Pokémon' }}
        </button>
        <button type="button" class="px-5 py-3 border rounded-lg text-lg" @click="reset">Reset</button>
      </div>
    </form>

    <div v-if="error" class="mt-4 text-sm text-red-600">{{ error }}</div>

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
const loading = ref(false)
const imageUrl = ref('')
const modalOpen = ref(false)
const error = ref('')

const name = computed(() => `${base.value} + ${ability.value}`)
const description = computed(() => `A ${base.value} with ${ability.value} powers`)

const onSubmit = async () => {
  loading.value = true
  imageUrl.value = ''
  error.value = ''
  try {
    const prompt = `${base.value} creature with ${ability.value} powers, Pokémon style, bright colors, cute and detailed`
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

