import type { DrawnCard, Reading } from '../logic/types'

interface Props {
  reading: Reading
  cards: DrawnCard[]
  question: string
  waiting: boolean
  highlightedIndex: number | null
  onSelect: (i: number) => void
  tts: { supported: boolean; enabled: boolean; speaking: boolean; toggle: () => void; replay: () => void; stop: () => void }
}

export function ReadingOutput({ reading, cards, question, waiting, highlightedIndex, onSelect, tts }: Props) {
  return (
    <section className="reading" aria-live="polite" aria-busy={waiting}>
      <header className="reading__head">
        <div>
          <h2 className="reading__title">Deine Lesung</h2>
          {question.trim() && <p className="reading__question">„{question.trim()}“</p>}
        </div>
        {tts.supported && (
          <div className="reading__tts">
            <button type="button" className="btn btn--ghost" onClick={tts.toggle} aria-pressed={tts.enabled} aria-label={tts.enabled ? 'Sprachausgabe ausschalten' : 'Sprachausgabe einschalten'}>
              {tts.enabled ? '🔊 Stimme an' : '🔇 Stimme aus'}
            </button>
            {tts.enabled && (
              <button type="button" className="btn btn--ghost" onClick={tts.speaking ? tts.stop : tts.replay} aria-label={tts.speaking ? 'Vorlesen stoppen' : 'Noch einmal vorlesen'}>
                {tts.speaking ? '⏹ Stopp' : '▶ Vorlesen'}
              </button>
            )}
          </div>
        )}
      </header>

      {waiting ? (
        <p className="reading__waiting">Die Kartenlegerin sammelt sich einen Moment …</p>
      ) : (
        <>
          <ol className="reading__cards">
            {reading.perCard.map((p, i) => {
              const dc = cards[i]
              return (
                <li key={p.cardId} className={`reading__card${highlightedIndex === i ? ' reading__card--active' : ''}`} style={{ animationDelay: `${i * 220}ms` }}>
                  <button type="button" className="reading__cardhead" onClick={() => onSelect(i)}>
                    <span className="reading__pos">{dc.position.label}</span>
                    <span className="reading__name">
                      {dc.card.name} <em>{dc.reversed ? 'umgekehrt' : 'aufrecht'}</em>
                    </span>
                  </button>
                  <p className="reading__text">{p.text}</p>
                  <p className="reading__keywords">{dc.card.keywords.join(' · ')}</p>
                </li>
              )
            })}
          </ol>
          <div className="reading__story" style={{ animationDelay: `${reading.perCard.length * 220 + 100}ms` }}>
            <h3>Die Geschichte der Karten</h3>
            <p>{reading.story}</p>
          </div>
          <div className="reading__advice" style={{ animationDelay: `${reading.perCard.length * 220 + 400}ms` }}>
            <h3>Fazit</h3>
            <p>{reading.advice}</p>
          </div>
          <p className="reading__source">
            Quelle: {reading.source === 'claude' ? 'Kartenlegerin mit Claude' : 'Tischregeln (regelbasiert)'}
          </p>
        </>
      )}
    </section>
  )
}
