import { describe, expect, it } from 'vitest'
import { DECK } from '../src/logic/draw'

describe('tarot-deck.json', () => {
  it('hat genau 78 Karten mit eindeutigen IDs', () => {
    expect(DECK).toHaveLength(78)
    expect(new Set(DECK.map((c) => c.id)).size).toBe(78)
  })
  it('hat 22 Große Arkana mit Nummern 0 bis 21', () => {
    const major = DECK.filter((c) => c.arcana === 'major')
    expect(major).toHaveLength(22)
    expect(major.map((c) => c.number).sort((a, b) => a - b)).toEqual([...Array(22).keys()])
    expect(major.every((c) => c.suit === null)).toBe(true)
  })
  it('hat je Farbe 14 Karten mit Nummern 1 bis 14', () => {
    for (const suit of ['wands', 'cups', 'swords', 'pentacles']) {
      const cards = DECK.filter((c) => c.suit === suit)
      expect(cards, suit).toHaveLength(14)
      expect(cards.map((c) => c.number).sort((a, b) => a - b)).toEqual([...Array(14).keys()].map((n) => n + 1))
      expect(cards.every((c) => c.arcana === 'minor')).toBe(true)
    }
  })
  it('hat keine leeren Textfelder', () => {
    for (const c of DECK) {
      expect(c.name.length, c.id).toBeGreaterThan(0)
      expect(c.nameEn.length, c.id).toBeGreaterThan(0)
      expect(c.upright.length, c.id).toBeGreaterThan(20)
      expect(c.reversed.length, c.id).toBeGreaterThan(20)
      expect(c.keywords.length, c.id).toBeGreaterThanOrEqual(3)
    }
  })
})
