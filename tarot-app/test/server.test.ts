import type { AddressInfo } from 'node:net'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
// @ts-expect-error JS-Modul ohne Typen
import { createApp } from '../server/app.mjs'
// @ts-expect-error JS-Modul ohne Typen
import { createClaudeProvider } from '../server/claude.mjs'

const cards = [
  { cardId: 'major-00', name: 'Der Narr', nameEn: 'The Fool', position: 'Vergangenheit', reversed: false, meaning: 'Neubeginn.', keywords: ['Neubeginn'] },
  { cardId: 'cups-02', name: 'Zwei der Kelche', nameEn: 'Two of Cups', position: 'Gegenwart', reversed: true, meaning: 'Ungleichgewicht.', keywords: ['Partnerschaft'] },
]
const body = { question: 'Wie geht es weiter?', spread: { id: 'two', name: 'Zwei Karten' }, cards }

async function listen(app: { listen: (p: number, cb: () => void) => { address: () => AddressInfo; close: (cb: () => void) => void } }) {
  return new Promise<{ url: string; close: () => Promise<void> }>((resolve) => {
    const srv = app.listen(0, () => {
      resolve({ url: `http://127.0.0.1:${srv.address().port}`, close: () => new Promise((r) => srv.close(() => r())) })
    })
  })
}

describe('server ohne Provider', () => {
  let url = ''
  let close: () => Promise<void>
  beforeAll(async () => ({ url, close } = await listen(createApp({ provider: null }))))
  afterAll(() => close())

  it('health meldet llm=false', async () => {
    const res = await fetch(`${url}/api/health`)
    expect(await res.json()).toEqual({ llm: false, model: null })
  })
  it('reading liefert 503 mit fallback', async () => {
    const res = await fetch(`${url}/api/reading`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
    expect(res.status).toBe(503)
    expect((await res.json()).fallback).toBe(true)
  })
  it('validiert den Body', async () => {
    const res = await fetch(`${url}/api/reading`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ question: 'x'.repeat(501), cards }) })
    expect(res.status).toBe(400)
  })
})

describe('server mit Provider', () => {
  let url = ''
  let close: () => Promise<void>
  const good = { perCard: cards.map((c) => ({ cardId: c.cardId, text: `Deutung ${c.name}` })), story: 'Eine Geschichte.', advice: 'Mein Rat: ruhig bleiben.' }
  let mode: 'ok' | 'throw' | 'invalid' = 'ok'
  const provider = async () => {
    if (mode === 'throw') throw new Error('boom')
    if (mode === 'invalid') return { perCard: [], story: '', advice: '' }
    return good
  }
  beforeAll(async () => ({ url, close } = await listen(createApp({ provider, model: 'test-model' }))))
  afterAll(() => close())

  it('health meldet llm=true und Modell', async () => {
    expect(await (await fetch(`${url}/api/health`)).json()).toEqual({ llm: true, model: 'test-model' })
  })
  it('liefert die Lesung durch', async () => {
    mode = 'ok'
    const res = await fetch(`${url}/api/reading`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual(good)
  })
  it('Provider-Fehler → 503 fallback', async () => {
    mode = 'throw'
    const res = await fetch(`${url}/api/reading`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
    expect(res.status).toBe(503)
  })
  it('ungültige Provider-Ausgabe → 503 fallback', async () => {
    mode = 'invalid'
    const res = await fetch(`${url}/api/reading`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
    expect(res.status).toBe(503)
  })
})

describe('claude provider', () => {
  it('baut den Request korrekt und parst die Antwort', async () => {
    let captured: Record<string, unknown> = {}
    const fake = {
      messages: {
        create: async (params: Record<string, unknown>) => {
          captured = params
          return { stop_reason: 'end_turn', content: [{ type: 'text', text: JSON.stringify({ perCard: [{ cardId: 'major-00', text: 'a' }, { cardId: 'cups-02', text: 'b' }], story: 's', advice: 'Mein Rat: r' }) }] }
        },
      },
    }
    const provider = createClaudeProvider({ model: 'claude-sonnet-5', client: fake })
    const out = await provider(body)
    expect(out.perCard).toHaveLength(2)
    expect(captured.model).toBe('claude-sonnet-5')
    expect(captured.thinking).toEqual({ type: 'adaptive' })
    const oc = captured.output_config as { format: { type: string }; effort: string }
    expect(oc.format.type).toBe('json_schema')
    expect(oc.effort).toBe('medium')
    expect(JSON.stringify(captured.messages)).toContain('Der Narr')
    expect(JSON.stringify(captured.messages)).toContain('umgekehrt')
  })
  it('wirft bei refusal', async () => {
    const fake = { messages: { create: async () => ({ stop_reason: 'refusal', stop_details: { category: 'x' }, content: [] }) } }
    await expect(createClaudeProvider({ client: fake })(body)).rejects.toThrow(/refusal/)
  })
})
