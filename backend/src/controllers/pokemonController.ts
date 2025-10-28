import type { Request, Response } from 'express'
import { Pokemon } from '../models/Pokemon.js'
import fs from 'fs/promises'
import crypto from 'crypto'
import path from 'path'
import config from '../config.js'

export const getPokemons = async (req: Request, res: Response) => {
  try {
    const list = await Pokemon.findAll({ order: [['id', 'ASC']] })
    const base = `${req.protocol}://${req.get('host')}`
    const out = list.map((p: any) => {
      const plain = p.get ? p.get({ plain: true }) : p
      if (plain && typeof plain.imageUrl === 'string' && plain.imageUrl.startsWith('/data/')) {
        plain.imageUrl = base + plain.imageUrl
      }
      return plain
    })
    res.json(out)
  } catch (err) {
    res.status(500).json({ error: 'failed to read data' })
  }
}

export const getMyPokemons = async (req: Request, res: Response) => {
  try {
    const payload = (req as any).user || {}
    const username = (payload as any).sub || 'anonymous'
    const safe = String(username).replace(/[^a-zA-Z0-9-_\.]/g, '_')
    const dataFile = path.resolve(config.DATA_DIR, 'pokemons', safe, 'pokemons.json')
    try {
      const raw = await fs.readFile(dataFile, 'utf-8')
      const list = JSON.parse(raw)
      return res.json(Array.isArray(list) ? list : [])
    } catch (e) {
      return res.json([])
    }
  } catch (err) {
    return res.status(500).json({ error: 'failed to read my pokemons' })
  }
}

export const deleteMyPokemon = async (req: Request, res: Response) => {
  try {
    const id = req.params.id
    const idxQuery = req.query.index as string | undefined
    const payload = (req as any).user || {}
    const username = (payload as any).sub || 'anonymous'
    const safe = String(username).replace(/[^a-zA-Z0-9-_\.]/g, '_')
    const dataFile = path.resolve(config.DATA_DIR, 'pokemons', safe, 'pokemons.json')
    const base = `${req.protocol}://${req.get('host')}`

    let list: any[] = []
    try {
      const raw = await fs.readFile(dataFile, 'utf-8')
      list = JSON.parse(raw)
      if (!Array.isArray(list)) list = []
    } catch (e) {
      list = []
    }

    let entry = list.find((p: any) => String(p.id) === String(id))
    if (entry) {
      if (entry && typeof entry.imageUrl === 'string') {
        try {
          const parsed = new URL(entry.imageUrl, base)
          const rel = parsed.pathname.replace(/^\/data\//, '')
          const filePath = path.resolve(config.DATA_DIR, rel)
          await fs.unlink(filePath).catch(() => {})
        } catch (e) {}
      }
      const idx2 = list.findIndex((p: any) => String(p.id) === String(id))
      if (idx2 !== -1) {
        list.splice(idx2, 1)
        try {
          await fs.writeFile(dataFile, JSON.stringify(list, null, 2), 'utf-8')
        } catch (e) {
          console.error('Failed to update per-user pokemons.json:', e)
        }
      }
      try {
        await Pokemon.destroy({ where: { id } })
      } catch (e) {}
      return res.json({ ok: true })
    }

    try {
      const dbRow = await Pokemon.findByPk(id as any)
      if (!dbRow) return res.status(404).json({ error: 'not found' })
      const plain = dbRow.get({ plain: true })
      if (!plain || typeof plain.imageUrl !== 'string' || !plain.imageUrl.includes(`/pokemons/${safe}/`)) {
        return res.status(404).json({ error: 'not found' })
      }
      try {
        const parsed = new URL(plain.imageUrl, base)
        const rel = parsed.pathname.replace(/^\/data\//, '')
        const filePath = path.resolve(config.DATA_DIR, rel)
        await fs.unlink(filePath).catch(() => {})
      } catch (e) {}
      try {
        await Pokemon.destroy({ where: { id } })
      } catch (e) {}
      return res.json({ ok: true })
    } catch (e) {
      console.error('DB lookup failed', e)
      return res.status(500).json({ error: 'failed to delete' })
    }
  } catch (err) {
    console.error('deleteMyPokemon failed', err)
    return res.status(500).json({ error: 'failed to delete' })
  }
}

export const createPokemon = async (req: Request, res: Response) => {
  try {
    const entry = req.body

    try {
      if (entry && typeof entry.imageUrl === 'string' && entry.imageUrl.startsWith('data:')) {
        const m = entry.imageUrl.match(/^data:(image\/(png|jpeg|jpg));base64,(.+)$/)
        if (m) {
          const ext = m[2] === 'jpeg' ? 'jpg' : m[2]
          const b64 = m[3]
          const payload = (req as any).user || {}
          const username = (payload as any).sub || 'anonymous'
          const safe = String(username).replace(/[^a-zA-Z0-9-_\.]/g, '_')
          const imagesDir = path.resolve(config.DATA_DIR, 'pokemons', safe)
          await fs.mkdir(imagesDir, { recursive: true })
              const buf = Buffer.from(b64, 'base64')
              const hash = crypto.createHash('sha256').update(buf).digest('hex')
              const filename = `${hash}.${ext}`
              const outPath = path.join(imagesDir, filename)
              try {
                await fs.access(outPath).catch(async () => {
                  await fs.writeFile(outPath, buf)
                })
              } catch (e) {
                console.error('Failed to write image file:', e)
              }
              entry.imageUrl = `/data/pokemons/${safe}/${filename}`
        }
      }
    } catch (imgErr) {
      console.error('Failed to persist image to disk:', imgErr)
    }

    const shareOnlyFlag = !!(entry as any).shareOnly
    if (shareOnlyFlag) {
      try {
        const base = `${req.protocol}://${req.get('host')}`
        const result = { imageUrl: (entry as any).imageUrl && (entry as any).imageUrl.startsWith('/data/') ? base + (entry as any).imageUrl : (entry as any).imageUrl }
        return res.json(result)
      } catch (e) {
        console.error('Failed to return share-only result', e)
        return res.status(500).json({ error: 'failed to save share' })
      }
    }

  const created = await Pokemon.create(entry)

    try {
      const payload = (req as any).user || {}
      const username = (payload as any).sub || 'anonymous'
      const safe = String(username).replace(/[^a-zA-Z0-9-_\\.]/g, '_')
      const dataDir = path.resolve(config.DATA_DIR, 'pokemons', safe)
      await fs.mkdir(dataDir, { recursive: true })
      const dataFile = path.resolve(dataDir, 'pokemons.json')
      let list: any[] = []
      try {
        const raw = await fs.readFile(dataFile, 'utf-8')
        list = JSON.parse(raw)
        if (!Array.isArray(list)) list = []
      } catch (e) {
        list = []
      }
      const plain = created.get({ plain: true })
      const base = `${req.protocol}://${req.get('host')}`
      if (plain && typeof plain.imageUrl === 'string' && plain.imageUrl.startsWith('/data/')) {
        plain.imageUrl = base + plain.imageUrl
      }
  const existsInList = list.some((p: any) => p && typeof p.imageUrl === 'string' && p.imageUrl === plain.imageUrl)
  if (!existsInList) list.push(plain)
      await fs.writeFile(dataFile, JSON.stringify(list, null, 2), 'utf-8')
      return res.json(plain)
    } catch (writeErr) {
      console.error('Failed to write per-user pokemons.json:', writeErr)
      const plain = created.get({ plain: true })
      const base = `${req.protocol}://${req.get('host')}`
      if (plain && typeof plain.imageUrl === 'string' && plain.imageUrl.startsWith('/data/')) {
        plain.imageUrl = base + plain.imageUrl
      }
      return res.json(plain)
    }
  } catch (err: any) {
    return res.status(500).json({ error: 'failed to save data', details: err?.message })
  }
}
