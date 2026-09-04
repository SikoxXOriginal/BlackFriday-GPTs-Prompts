import type { DrawnCard, Reading } from './types'

/** Text für die Sprachausgabe: Position + Deutung je Karte, dann Geschichte und Fazit. */
export function readingToSpeech(reading: Reading, cards: DrawnCard[]): string {
  const parts = reading.perCard.map((p, i) => `${cards[i].position.label}. ${p.text}`)
  return [...parts, reading.story, reading.advice].join(' ')
}
