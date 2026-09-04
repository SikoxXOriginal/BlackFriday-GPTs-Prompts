import type { DrawnCard } from '../logic/types'
import { SuitIcon } from './SuitIcon'

const SUIT_LABEL: Record<string, string> = { wands: 'Stäbe', cups: 'Kelche', swords: 'Schwerter', pentacles: 'Münzen' }

interface Props {
  drawn: DrawnCard
  index: number
  animate: boolean
  reduced: boolean
  highlighted?: boolean
  onClick?: () => void
}

export const CARD_STAGGER_MS = 650
export const CARD_ANIM_MS = 1500
export const CARD_REDUCED_MS = 350

export function Card({ drawn, index, animate, reduced, highlighted, onClick }: Props) {
  const { card, reversed, position } = drawn
  const cls = ['card']
  if (animate) cls.push(reduced ? 'card--fade' : 'card--deal')
  if (reversed) cls.push('card--reversed')
  if (highlighted) cls.push('card--highlight')
  const delay = animate ? index * (reduced ? 120 : CARD_STAGGER_MS) : 0
  const subtitle = card.arcana === 'major' ? `${roman(card.number)} · Große Arkana` : `${card.number} · ${SUIT_LABEL[card.suit ?? '']}`

  return (
    <button
      type="button"
      className={cls.join(' ')}
      style={{ animationDelay: `${delay}ms` }}
      onClick={onClick}
      aria-label={`${position.label}: ${card.name}, ${reversed ? 'umgekehrt' : 'aufrecht'}`}
    >
      <span className="card__inner">
        <span className="card__face card__face--back">
          <span className="card__back-pattern" />
          <span className="card__back-star" />
        </span>
        <span className="card__face card__face--front">
          <span className="card__frame">
            <span className="card__title">{card.name}</span>
            <SuitIcon suit={card.suit} major={card.arcana === 'major'} />
            <span className="card__subtitle">{subtitle}</span>
          </span>
        </span>
      </span>
      <span className="card__pos">{position.label}</span>
    </button>
  )
}

function roman(n: number): string {
  if (n === 0) return '0'
  const map: [number, string][] = [[10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I']]
  let out = ''
  let v = n
  for (const [val, sym] of map) while (v >= val) { out += sym; v -= val }
  return out
}
