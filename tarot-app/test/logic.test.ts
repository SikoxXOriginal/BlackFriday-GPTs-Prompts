import { describe, expect, it } from 'vitest'
import { chooseSpread, detectTopic } from '../src/logic/classifier'
import { drawCards } from '../src/logic/draw'
import { mulberry32 } from '../src/logic/random'
import { countSentences, generateReading } from '../src/logic/reading'
import { SPREADS } from '../src/logic/spreads'

describe('chooseSpread', () => {
  it('leere Frage → drei Karten', () => {
    expect(chooseSpread('').id).toBe('three')
    expect(chooseSpread('  ').id).toBe('three')
  })
  it('Alternativfrage mit "oder" → zwei Karten mit Option A/B', () => {
    const s = chooseSpread('Soll ich den Job wechseln oder bleiben?')
    expect(s.id).toBe('two')
    expect(s.positions.map((p) => p.label)).toEqual(['Option A', 'Option B'])
  })
  it('Entscheidungsfrage ohne "oder" → zwei Karten Situation/Rat', () => {
    const s = chooseSpread('Soll ich das Studio umbauen?')
    expect(s.id).toBe('two')
    expect(s.positions.map((p) => p.label)).toEqual(['Situation', 'Rat'])
  })
  it('Zeitbezug → drei Karten', () => {
    expect(chooseSpread('Was wird aus meiner Beziehung?').id).toBe('three')
  })
  it('allgemeine Frage → drei Karten', () => {
    expect(chooseSpread('Was beschäftigt mich gerade?').id).toBe('three')
  })
})

describe('detectTopic', () => {
  it('erkennt Themen', () => {
    expect(detectTopic('Wie geht es in meiner Beziehung weiter?')).toBe('love')
    expect(detectTopic('Bekomme ich den Job?')).toBe('work')
    expect(detectTopic('Soll ich in Aktien investieren?')).toBe('money')
    expect(detectTopic('Warum bin ich so müde?')).toBe('health')
    expect(detectTopic('Soll ich es tun?')).toBe('decision')
    expect(detectTopic('Was erwartet mich?')).toBe('general')
  })
})

describe('drawCards', () => {
  it('zieht ohne Zurücklegen (Keltisches Kreuz, 10 Karten)', () => {
    const cards = drawCards(SPREADS.celtic, mulberry32(42))
    expect(cards).toHaveLength(10)
    expect(new Set(cards.map((c) => c.card.id)).size).toBe(10)
    expect(cards.map((c) => c.position.key)).toEqual(SPREADS.celtic.positions.map((p) => p.key))
  })
  it('liefert ungefähr 30 % umgekehrte Karten', () => {
    const rng = mulberry32(7)
    let reversed = 0
    const total = 3000
    for (let i = 0; i < total / 3; i++) {
      for (const c of drawCards(SPREADS.three, rng)) if (c.reversed) reversed++
    }
    expect(reversed / total).toBeGreaterThan(0.25)
    expect(reversed / total).toBeLessThan(0.35)
  })
})

describe('generateReading', () => {
  const q = 'Wie geht es in meiner Beziehung weiter?'
  const cards = drawCards(SPREADS.three, mulberry32(3))
  const reading = generateReading(q, SPREADS.three, cards)

  it('liefert eine Deutung pro Karte mit Kartenname', () => {
    expect(reading.perCard).toHaveLength(3)
    reading.perCard.forEach((p, i) => {
      expect(p.cardId).toBe(cards[i].card.id)
      expect(p.text).toContain(cards[i].card.name)
    })
  })
  it('Geschichte hat 3 bis 6 Sätze', () => {
    const n = countSentences(reading.story)
    expect(n).toBeGreaterThanOrEqual(3)
    expect(n).toBeLessThanOrEqual(6)
  })
  it('Geschichte bleibt auch beim Keltischen Kreuz bei maximal 6 Sätzen', () => {
    const c10 = drawCards(SPREADS.celtic, mulberry32(11))
    const r = generateReading('Was erwartet mich?', SPREADS.celtic, c10)
    expect(countSentences(r.story)).toBeLessThanOrEqual(6)
    expect(r.perCard).toHaveLength(10)
  })
  it('Fazit enthält einen Rat und die letzte Karte', () => {
    expect(reading.advice).toContain('Mein Rat')
    expect(reading.advice).toContain(cards[2].card.name)
  })
  it('ist deterministisch für gleiche Eingaben und verschieden für andere', () => {
    expect(generateReading(q, SPREADS.three, cards)).toEqual(reading)
    expect(generateReading('Bekomme ich den Job?', SPREADS.three, cards).story).not.toBe(reading.story)
  })
  it('Quelle ist "rules"', () => {
    expect(reading.source).toBe('rules')
  })
})
