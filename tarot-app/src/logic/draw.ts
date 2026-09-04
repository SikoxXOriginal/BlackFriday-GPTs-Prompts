import deckData from '../data/tarot-deck.json'
import type { DrawnCard, Spread, TarotCard } from './types'

export const DECK: TarotCard[] = deckData as TarotCard[]

export const REVERSED_PROBABILITY = 0.3

/**
 * Zieht Karten ohne Zurücklegen für alle Positionen des Spreads.
 * rng ist injizierbar (Tests); Standard ist Math.random.
 */
export function drawCards(spread: Spread, rng: () => number = Math.random, deck: TarotCard[] = DECK): DrawnCard[] {
  const pool = [...deck]
  return spread.positions.map((position) => {
    const idx = Math.floor(rng() * pool.length)
    const [card] = pool.splice(idx, 1)
    return { card, reversed: rng() < REVERSED_PROBABILITY, position }
  })
}

export function cardById(id: string): TarotCard | undefined {
  return DECK.find((c) => c.id === id)
}
