import type { Session } from '../logic/types'

export function History({ sessions, currentId, onOpen }: { sessions: Session[]; currentId: string | null; onOpen: (s: Session) => void }) {
  if (sessions.length === 0) return null
  return (
    <section className="history">
      <h2 className="history__title">Frühere Legungen dieser Sitzung</h2>
      <p className="history__hint">Nur im Speicher dieser Seite. Beim Neuladen ist der Verlauf weg.</p>
      <ul className="history__list">
        {sessions.map((s) => (
          <li key={s.id}>
            <button type="button" className={`history__item${s.id === currentId ? ' history__item--on' : ''}`} onClick={() => onOpen(s)}>
              <span className="history__q">{s.question.trim() || 'Allgemeine Lesung'}</span>
              <span className="history__meta">
                {s.spread.name} · {s.cards.map((c) => c.card.name).join(', ')} · {new Date(s.createdAt).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </section>
  )
}
