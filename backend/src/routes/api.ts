import { Router } from 'express'
import { generateImage } from '../services/sdService.js'
import { getPokemons, createPokemon } from '../controllers/pokemonController.js'
import { authenticateJWT } from '../middleware/auth.js'
import { validateBody } from '../middleware/validate.js'
import { generateSchema, pokemonSchema } from '../schemas.js'
import { generateLimiter } from '../middleware/rateLimiter.js'

const router = Router()

router.post('/generate', generateLimiter, validateBody(generateSchema), async (req, res) => {
  const { prompt } = req.body
  try {
    const result = await generateImage(prompt)
    return res.json(result)
  } catch (err: any) {
    return res.status(err?.response?.status || 500).json(err?.response?.data || { error: 'failed to generate' })
  }
})

router.get('/pokemons', getPokemons)
router.post('/pokemons', authenticateJWT, validateBody(pokemonSchema), createPokemon)

export default router
