import type { DrawnCard, Reading, Spread } from './logic/types'

export interface Health {
  llm: boolean
  model: string | null
}

export async function fetchHealth(): Promise<Health> {
  try {
    const res = await fetch('/api/health')
    if (!res.ok) return { llm: false, model: null }
    return (await res.json()) as Health
  } catch {
    return { llm: false, model: null }
  }
}

/**
 * Holt eine Lesung vom Server-Proxy. Liefert null bei jedem Fehler,
 * der Aufrufer nutzt dann die regelbasierte Lesung (F-09).
 */
export async function requestClaudeReading(question: string, spread: Spread, cards: DrawnCard[], signal?: AbortSignal): Promise<Reading | null> {
  try {
    const res = await fetch('/api/reading', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal,
      body: JSON.stringify({
        question,
        spread: { id: spread.id, name: spread.name },
        cards: cards.map((c) => ({
          cardId: c.card.id,
          name: c.card.name,
          nameEn: c.card.nameEn,
          position: c.position.label,
          reversed: c.reversed,
          meaning: c.reversed ? c.card.reversed : c.card.upright,
          keywords: c.card.keywords,
        })),
      }),
    })
    if (!res.ok) return null
    const data = (await res.json()) as { perCard?: { cardId: string; text: string }[]; story?: string; advice?: string }
    if (!Array.isArray(data.perCard) || typeof data.story !== 'string' || typeof data.advice !== 'string') return null
    if (data.perCard.length !== cards.length) return null
    return { perCard: data.perCard, story: data.story, advice: data.advice, source: 'claude' }
  } catch {
    return null
  }
}
