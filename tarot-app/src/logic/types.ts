export type Arcana = 'major' | 'minor'
export type Suit = 'wands' | 'cups' | 'swords' | 'pentacles' | null

export interface TarotCard {
  id: string
  name: string
  nameEn: string
  number: number
  arcana: Arcana
  suit: Suit
  upright: string
  reversed: string
  keywords: string[]
}

export type SpreadId = 'one' | 'two' | 'three' | 'celtic'

export interface SpreadPosition {
  key: string
  label: string
  /** Kurzformel für Einleitungssätze, z.B. "in deiner Vergangenheit" */
  phrase: string
}

export interface Spread {
  id: SpreadId
  name: string
  positions: SpreadPosition[]
}

export interface DrawnCard {
  card: TarotCard
  reversed: boolean
  position: SpreadPosition
}

export type Topic = 'love' | 'work' | 'money' | 'health' | 'decision' | 'general'

export interface Reading {
  perCard: { cardId: string; text: string }[]
  story: string
  advice: string
  source: 'rules' | 'claude'
}

export interface Session {
  id: string
  question: string
  spread: Spread
  cards: DrawnCard[]
  reading: Reading
  createdAt: number
}
