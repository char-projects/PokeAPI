<template>
  <div class="max-w-3xl w-full mx-auto p-10 bg-neutral-900 border border-white/10 rounded-2xl shadow-lg text-white">
    <div class="flex items-center justify-between mb-4">
      <div>
        <button @click="goToMyPokemons" class="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700">My Pokémons</button>
      </div>
      <div>
        <button @click="onLogout" class="px-3 py-1 border rounded bg-red-600 hover:bg-red-700 text-white">Logout</button>
      </div>
    </div>

    <h2 class="text-2xl font-bold mb-4 text-center">Create your Pokémon</h2>

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
          <label class="block text-md font-medium my-2">Ability</label>
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

  <div v-if="toastMessage" class="fixed right-6 bottom-6 z-50">
    <div :class="['px-4 py-2 rounded shadow', toastSuccess ? 'bg-green-600 text-white' : 'bg-yellow-600 text-white']">
      {{ toastMessage }}
    </div>
  </div>

  <div v-if="imageUrl" class="mt-8 flex flex-col items-center gap-6">
      <div class="w-full max-w-xl">
        <PokemonCard :image="imageUrl" :name="name" :description="description" @share="openShareModal" />
      </div>

      <div class="w-full max-w-xl flex flex-col sm:flex-row gap-4 justify-center">
        <button class="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg text-lg disabled:opacity-50" @click="savePokemon" :disabled="saved || loading">
          {{ saved ? 'Saved' : 'Save' }}
        </button>
        <button class="flex-1 px-6 py-3 border rounded-lg text-lg" @click="download">Download</button>
      </div>
    </div>

  <ShareModal v-if="modalOpen" :open="modalOpen" :image="imageUrl" :name="name" :description="description" @close="closeShareModal" @saved="onSharedSaved" />
  </div>
</template>

<script lang="ts" setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { generateImage, createPokemon } from '../services/api'
import { getCurrentUser, loginWithProvider, logoutAndRedirect } from '../services/auth'
import { useRouter } from 'vue-router'
import PokemonCard from '../components/PokemonCard.vue'
import ShareModal from '../components/ShareModal.vue'

const animals = [
  'Bulbasaur','Charmander','Squirtle','Pikachu','Eevee','Pidgey','Rattata','Jigglypuff',
  'Meowth','Psyduck','Geodude','Snorlax','Dragonite','Magikarp','Vulpix','Growlithe',
  'Butterfree','Zubat','Oddish','Bellsprout','Sandslash','Rat','Fox','Owl','Turtle'
]

const abilities = [
  'Normal','Fire','Water','Electric','Grass','Ice','Fighting','Poison','Ground','Flying',
  'Psychic','Bug','Rock','Ghost','Dragon','Dark','Steel','Fairy',
  'Overgrow','Blaze','Torrent','Static','Intimidate','Levitate','Swift Swim','Chlorophyll'
]

const base = ref(animals[0])
const ability = ref(abilities[0])
const selectedTab = ref<'composer' | 'prompt'>('composer')
const promptText = ref('')
const loading = ref(false)
const imageUrl = ref('')
const saved = ref(false)
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
  saved.value = false
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

const toastMessage = ref('')
const toastSuccess = ref(false)
const showToast = (msg: string, success = true, ms = 3000) => {
  toastMessage.value = msg
  toastSuccess.value = success
  setTimeout(() => {
    toastMessage.value = ''
    toastSuccess.value = false
  }, ms)
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
  saved.value = false
}

const savePokemon = async () => {
  if (!imageUrl.value) return
  const user = await getCurrentUser()
  if (!user) {
    if (confirm('You need to sign in to save. Sign in now?')) loginWithProvider()
    return
  }
  try {
    const created = await createPokemon({ name: name.value, description: description.value, imageUrl: imageUrl.value })
  saved.value = true
  if (created && created.imageUrl) imageUrl.value = created.imageUrl
  showToast('Saved Pokémon successfully!', true)
  } catch (err) {
    console.error('Save failed', err)
    showToast('Failed to save Pokémon. Make sure you are signed in and try again.', false)
  }
}

const download = () => {
  if (!imageUrl.value) return
  const doAnchorDownload = (href: string) => {
    const a = document.createElement('a')
    a.href = href
    a.download = `${name.value}.png`
    document.body.appendChild(a)
    a.click()
    a.remove()
  }

  ;(async () => {
    try {
      if (imageUrl.value.startsWith('data:')) {
        doAnchorDownload(imageUrl.value)
        return
      }
      let url = imageUrl.value
      try {
        if (url.startsWith('/data/')) {
          url = `${window.location.protocol}//${window.location.host}${url}`
        }
      } catch (e) {}

      const resp = await fetch(url, { credentials: 'include' })
      if (!resp.ok) {
        window.open(url, '_blank')
        return
      }
      const blob = await resp.blob()
      const blobUrl = URL.createObjectURL(blob)
      doAnchorDownload(blobUrl)
      setTimeout(() => URL.revokeObjectURL(blobUrl), 5000)
    } catch (e) {
      try {
        window.open(imageUrl.value, '_blank')
      } catch (e2) {
        console.error('Download failed', e2)
      }
    }
  })()
}

const onLogout = () => {
  logoutAndRedirect().catch(() => { window.location.href = '/login' })
}

const router = useRouter()

const goToMyPokemons = async () => {
  try {
    await router.push({ name: 'mypokemons' })
  } catch (e) {
    try { await router.push('/mypokemons') } catch {}
  }
}

onMounted(() => {
  const handler = async () => {
    try {
      const u = await getCurrentUser()
      if (!u) {
        router.replace({ name: 'login' })
      }
    } catch (e) {}
  }
  window.addEventListener('auth-changed', handler)
  handler()
  onUnmounted(() => {
    window.removeEventListener('auth-changed', handler)
  })
})

const onSharedSaved = (created: any) => {
  saved.value = true
  if (created && created.imageUrl) imageUrl.value = created.imageUrl
  showToast('Saved and copied shareable link!', true)
  closeShareModal()
}
</script>