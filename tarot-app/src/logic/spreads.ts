import type { Spread, SpreadId } from './types'

export const SPREADS: Record<SpreadId, Spread> = {
  one: {
    id: 'one',
    name: 'Eine Karte',
    positions: [{ key: 'message', label: 'Botschaft', phrase: 'als Botschaft für dich' }],
  },
  two: {
    id: 'two',
    name: 'Zwei Karten',
    positions: [
      { key: 'situation', label: 'Situation', phrase: 'für deine Situation' },
      { key: 'advice', label: 'Rat', phrase: 'als Rat' },
    ],
  },
  three: {
    id: 'three',
    name: 'Drei Karten',
    positions: [
      { key: 'past', label: 'Vergangenheit', phrase: 'in deiner Vergangenheit' },
      { key: 'present', label: 'Gegenwart', phrase: 'in deiner Gegenwart' },
      { key: 'future', label: 'Zukunft', phrase: 'für deine Zukunft' },
    ],
  },
  celtic: {
    id: 'celtic',
    name: 'Keltisches Kreuz',
    positions: [
      { key: 'situation', label: 'Situation', phrase: 'im Herzen deiner Situation' },
      { key: 'challenge', label: 'Herausforderung', phrase: 'als Herausforderung' },
      { key: 'foundation', label: 'Grundlage', phrase: 'als Grundlage unter allem' },
      { key: 'past', label: 'Vergangenheit', phrase: 'in der jüngeren Vergangenheit' },
      { key: 'crown', label: 'Krone', phrase: 'als das, was über dir schwebt' },
      { key: 'future', label: 'Zukunft', phrase: 'für die nahe Zukunft' },
      { key: 'self', label: 'Selbstbild', phrase: 'für dein Selbstbild' },
      { key: 'environment', label: 'Umfeld', phrase: 'für dein Umfeld' },
      { key: 'hopes', label: 'Hoffnungen und Ängste', phrase: 'für deine Hoffnungen und Ängste' },
      { key: 'outcome', label: 'Ergebnis', phrase: 'als mögliches Ergebnis' },
    ],
  },
}

/** Zwei-Karten-Spread mit Alternativen-Positionen (Option A / Option B). */
export const TWO_OPTIONS: Spread = {
  id: 'two',
  name: 'Zwei Karten',
  positions: [
    { key: 'optionA', label: 'Option A', phrase: 'für die erste Möglichkeit' },
    { key: 'optionB', label: 'Option B', phrase: 'für die zweite Möglichkeit' },
  ],
}

export const SPREAD_ORDER: SpreadId[] = ['one', 'two', 'three', 'celtic']
