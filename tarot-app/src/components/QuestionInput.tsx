import { useSpeechRecognition } from '../hooks/useSpeechRecognition'

interface Props {
  value: string
  onChange: (v: string) => void
  onSubmit: () => void
  disabled: boolean
}

export const MAX_QUESTION = 500

export function QuestionInput({ value, onChange, onSubmit, disabled }: Props) {
  const sr = useSpeechRecognition((text) => onChange(text.slice(0, MAX_QUESTION)))

  return (
    <form
      className="ask"
      onSubmit={(e) => {
        e.preventDefault()
        if (!disabled) onSubmit()
      }}
    >
      <label className="ask__label" htmlFor="question">
        Was beschäftigt dich? Stell deine Frage oder beschreibe deine Situation.
      </label>
      <div className="ask__row">
        <textarea
          id="question"
          className="ask__input"
          value={value}
          maxLength={MAX_QUESTION}
          rows={2}
          placeholder="z. B. Soll ich das Angebot annehmen oder warten?"
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              if (!disabled) onSubmit()
            }
          }}
        />
        {sr.supported && (
          <button
            type="button"
            className={`ask__mic${sr.listening ? ' ask__mic--on' : ''}`}
            onClick={() => (sr.listening ? sr.stop() : sr.start())}
            aria-label={sr.listening ? 'Aufnahme stoppen' : 'Frage einsprechen'}
            aria-pressed={sr.listening}
            disabled={disabled}
          >
            <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
              <rect x="9" y="3" width="6" height="11" rx="3" fill="currentColor" />
              <path d="M6 11a6 6 0 0 0 12 0" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              <path d="M12 17v4M9 21h6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        )}
      </div>
      <div className="ask__meta">
        <span className="ask__count">
          {value.length}/{MAX_QUESTION}
        </span>
        {sr.listening && <span className="ask__hint">Ich höre zu …</span>}
        {sr.error && (
          <span className="ask__error" role="alert">
            {sr.error}
          </span>
        )}
      </div>
      <button type="submit" className="btn btn--primary ask__submit" disabled={disabled}>
        Karten legen
      </button>
    </form>
  )
}
