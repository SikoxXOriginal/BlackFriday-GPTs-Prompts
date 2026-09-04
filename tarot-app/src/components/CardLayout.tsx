import { useLayoutEffect, useRef } from 'react'
import type { DrawnCard, SpreadId } from '../logic/types'
import { Card } from './Card'

interface Props {
  spreadId: SpreadId
  cards: DrawnCard[]
  animate: boolean
  reduced: boolean
  highlightedIndex: number | null
  onSelect: (index: number) => void
}

/** Ordnet die Slots je Spread an und setzt pro Slot die Flugvektoren vom Stapel. */
export function CardLayout({ spreadId, cards, animate, reduced, highlightedIndex, onSelect }: Props) {
  const ref = useRef<HTMLDivElement>(null)

  useLayoutEffect(() => {
    const root = ref.current
    if (!root) return
    const deck = root.parentElement?.querySelector<HTMLElement>('.deck')
    if (!deck) return
    const d = deck.getBoundingClientRect()
    root.querySelectorAll<HTMLElement>('.slot').forEach((slot) => {
      const s = slot.getBoundingClientRect()
      slot.style.setProperty('--dx', `${d.left + d.width / 2 - (s.left + s.width / 2)}px`)
      slot.style.setProperty('--dy', `${d.top + d.height / 2 - (s.top + s.height / 2)}px`)
    })
  }, [cards, spreadId])

  return (
    <div ref={ref} className={`layout layout--${spreadId}`}>
      {cards.map((dc, i) => (
        <div key={dc.card.id} className={`slot slot--${dc.position.key}`}>
          <Card drawn={dc} index={i} animate={animate} reduced={reduced} highlighted={highlightedIndex === i} onClick={() => onSelect(i)} />
        </div>
      ))}
    </div>
  )
}
