<template>
  <div class="p-4 max-w-screen-sm mx-auto">
    <h1 class="text-2xl mb-4">Create Pokémon</h1>

    <form @submit.prevent="onSubmit" class="space-y-4">
      <div>
        <label class="block text-sm">Base animal</label>
  <select v-model="base" class="w-full border rounded p-2 bg-white text-black">
          <option v-for="opt in animals" :key="opt" :value="opt">{{ opt }}</option>
        </select>
      </div>

      <div>
        <label class="block text-sm">Ability</label>
  <select v-model="ability" class="w-full border rounded p-2 bg-white text-black">
          <option v-for="a in abilities" :key="a" :value="a">{{ a }}</option>
        </select>
      </div>

      <button class="px-4 py-2 rounded bg-slate-800 text-white" type="submit">Generate Image</button>
    </form>

    <div v-if="loading" class="mt-4">Generating…</div>

    <div v-if="imageUrl" class="mt-4">
      <img :src="imageUrl" alt="generated pokemon" class="w-full rounded" />
      <div class="mt-2">
        <button @click="share" class="px-3 py-1 border rounded">Share</button>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { ref } from 'vue'
import { generateImage } from '../services/api'

export default {
  setup() {
    const animals = ['fox','owl','turtle','butterfly','lion']
    const abilities = ['fire','electric','water','psychic']
    const base = ref(animals[0])
    const ability = ref(abilities[0])
    const loading = ref(false)
    const imageUrl = ref('')

    const onSubmit = async () => {
      loading.value = true
      try {
        const prompt = `${base.value} creature with ${ability.value} ability, cute stylized creature, high detail, bright background`
        const data = await generateImage(prompt)
        if (data.image) {
          imageUrl.value = `data:image/png;base64,${data.image}`
        } else if (data.output?.[0]) {
          imageUrl.value = data.output[0]
        } else if (data.url) {
          imageUrl.value = data.url
        }
      } finally {
        loading.value = false
      }
    }

    const share = () => {
      if (navigator.share) {
        navigator.share({ title: 'My Pokémon', files: [] }).catch(()=>{})
      } else {
        navigator.clipboard.writeText(imageUrl.value).catch(()=>{})
        alert('Copied image URL to clipboard')
      }
    }

    return { animals, abilities, base, ability, onSubmit, loading, imageUrl, share }
  }
}

</script>