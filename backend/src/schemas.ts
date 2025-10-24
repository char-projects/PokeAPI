import { z } from 'zod'

export const generateSchema = z.object({
  prompt: z.string().min(3).max(2000),
})

export const pokemonSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(2000).optional(),
  imageUrl: z.string().url().optional(),
})

export type GenerateInput = z.infer<typeof generateSchema>
export type PokemonInput = z.infer<typeof pokemonSchema>
