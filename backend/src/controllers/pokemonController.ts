import type { Request, Response } from 'express'
import { Pokemon } from '../models/Pokemon.js'

export const getPokemons = async (req: Request, res: Response) => {
  try {
    const list = await Pokemon.findAll({ order: [['id', 'ASC']] })
    res.json(list)
  } catch (err) {
    res.status(500).json({ error: 'failed to read data' })
  }
}

export const createPokemon = async (req: Request, res: Response) => {
  try {
    const entry = req.body
    const created = await Pokemon.create(entry)
    res.json(created)
  } catch (err: any) {
    res.status(500).json({ error: 'failed to save data', details: err.message })
  }
}
