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
    console.error('Generate error:', {
      message: err?.message,
      status: err?.response?.status,
      responseData: err?.response?.data,
      stack: err?.stack,
    })

    const status = err?.response?.status || 500
    const payload = err?.response?.data || { error: err?.message || 'failed to generate' }
    return res.status(status).json(payload)
  }
})

router.get('/pokemons', getPokemons)
router.post('/pokemons', authenticateJWT, validateBody(pokemonSchema), createPokemon)

export default router
