import express from 'express'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const here = path.dirname(fileURLToPath(import.meta.url))

export const READING_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['perCard', 'story', 'advice'],
  properties: {
    perCard: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['cardId', 'text'],
        properties: { cardId: { type: 'string' }, text: { type: 'string' } },
      },
    },
    story: { type: 'string' },
    advice: { type: 'string' },
  },
}

const MAX_QUESTION = 500
const MAX_CARDS = 10

function validateBody(body) {
  if (!body || typeof body !== 'object') return 'Body fehlt'
  if (typeof body.question !== 'string' || body.question.length > MAX_QUESTION) return 'question ungültig'
  if (!Array.isArray(body.cards) || body.cards.length === 0 || body.cards.length > MAX_CARDS) return 'cards ungültig'
  for (const c of body.cards) {
    if (typeof c.cardId !== 'string' || typeof c.name !== 'string' || typeof c.position !== 'string') return 'card ungültig'
    if (typeof c.reversed !== 'boolean' || typeof c.meaning !== 'string' || !Array.isArray(c.keywords)) return 'card ungültig'
  }
  return null
}

function validateReading(reading, cards) {
  if (!reading || typeof reading !== 'object') return false
  if (!Array.isArray(reading.perCard) || reading.perCard.length !== cards.length) return false
  if (!reading.perCard.every((p, i) => p && p.cardId === cards[i].cardId && typeof p.text === 'string' && p.text.length > 0)) return false
  return typeof reading.story === 'string' && reading.story.length > 0 && typeof reading.advice === 'string' && reading.advice.length > 0
}

/**
 * @param {object} opts
 * @param {(input: {question: string, spread: {id: string, name: string}, cards: any[]}) => Promise<object>} [opts.provider]
 *   Liefert die Lesung als Objekt gemäß READING_SCHEMA oder wirft. Ohne provider läuft der Server im Offline-Modus.
 * @param {string|null} [opts.model]
 * @param {string} [opts.distDir]
 */
export function createApp({ provider = null, model = null, distDir = path.join(here, '..', 'dist') } = {}) {
  const app = express()
  app.disable('x-powered-by')
  app.use(express.json({ limit: '64kb' }))

  app.get('/api/health', (_req, res) => {
    res.json({ llm: provider !== null, model: provider ? model : null })
  })

  app.post('/api/reading', async (req, res) => {
    const err = validateBody(req.body)
    if (err) return res.status(400).json({ error: err })
    if (!provider) return res.status(503).json({ fallback: true, reason: 'no-provider' })
    try {
      const reading = await provider({ question: req.body.question, spread: req.body.spread ?? { id: 'three', name: 'Drei Karten' }, cards: req.body.cards })
      if (!validateReading(reading, req.body.cards)) return res.status(503).json({ fallback: true, reason: 'invalid-output' })
      return res.json({ perCard: reading.perCard, story: reading.story, advice: reading.advice })
    } catch (e) {
      console.error('[reading] provider failed:', e?.message ?? e)
      return res.status(503).json({ fallback: true, reason: 'provider-error' })
    }
  })

  app.use(express.static(distDir))
  app.get(/^\/(?!api\/).*/, (_req, res, next) => {
    res.sendFile(path.join(distDir, 'index.html'), (e) => (e ? next() : undefined))
  })

  return app
}
