import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react'
import { fetchHealth, requestClaudeReading } from './api'
import { Candle } from './components/Candle'
import { CARD_ANIM_MS, CARD_REDUCED_MS, CARD_STAGGER_MS } from './components/Card'
import { CardLayout } from './components/CardLayout'
import { Deck } from './components/Deck'
import { History } from './components/History'
import { QuestionInput } from './components/QuestionInput'
import { Reader } from './components/Reader'
import { ReadingOutput } from './components/ReadingOutput'
import { SpreadSelector, type SpreadChoice } from './components/SpreadSelector'
import { useReducedMotion } from './hooks/useReducedMotion'
import { useSpeechSynthesis } from './hooks/useSpeechSynthesis'
import { chooseSpread } from './logic/classifier'
import { drawCards } from './logic/draw'
import { generateReading } from './logic/reading'
import { readingToSpeech } from './logic/speechText'
import { SPREADS } from './logic/spreads'
import type { Reading, Session } from './logic/types'

type Phase = 'idle' | 'dealing' | 'waiting' | 'reading'

interface State {
  phase: Phase
  current: Session | null
  history: Session[]
  animate: boolean
  highlighted: number | null
}

type Action =
  | { type: 'deal'; session: Session }
  | { type: 'dealt' }
  | { type: 'reading'; sessionId: string; reading?: Reading }
  | { type: 'upgrade'; sessionId: string; reading: Reading }
  | { type: 'open'; session: Session }
  | { type: 'highlight'; index: number | null }
  | { type: 'reset' }

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'deal':
      return { ...state, phase: 'dealing', current: action.session, animate: true, highlighted: null }
    case 'dealt':
      return state.phase === 'dealing' ? { ...state, phase: 'waiting' } : state
    case 'reading': {
      if (!state.current || state.current.id !== action.sessionId) return state
      const current = action.reading ? { ...state.current, reading: action.reading } : state.current
      const history = state.history.some((s) => s.id === current.id) ? state.history.map((s) => (s.id === current.id ? current : s)) : [current, ...state.history]
      return { ...state, phase: 'reading', current, history }
    }
    case 'upgrade': {
      const patch = (s: Session) => (s.id === action.sessionId ? { ...s, reading: action.reading } : s)
      return { ...state, current: state.current ? patch(state.current) : null, history: state.history.map(patch) }
    }
    case 'open':
      return { ...state, phase: 'reading', current: action.session, animate: false, highlighted: null }
    case 'highlight':
      return { ...state, highlighted: action.index }
    case 'reset':
      return { ...state, phase: 'idle', current: null, animate: false, highlighted: null }
  }
}

const CLAUDE_GRACE_MS = 8000

export default function App() {
  const [state, dispatch] = useReducer(reducer, { phase: 'idle', current: null, history: [], animate: false, highlighted: null })
  const [question, setQuestion] = useState('')
  const [spreadChoice, setSpreadChoice] = useState<SpreadChoice>('auto')
  const [ttsEnabled, setTtsEnabled] = useState(true)
  const [llm, setLlm] = useState<{ llm: boolean; model: string | null }>({ llm: false, model: null })
  const reduced = useReducedMotion()
  const tts = useSpeechSynthesis()
  const pendingRef = useRef<{ id: string; promise: Promise<Reading | null>; controller: AbortController } | null>(null)
  const timersRef = useRef<number[]>([])

  useEffect(() => {
    fetchHealth().then(setLlm)
  }, [])

  const clearTimers = () => {
    timersRef.current.forEach((t) => window.clearTimeout(t))
    timersRef.current = []
  }

  const busy = state.phase === 'dealing' || state.phase === 'waiting'
  const current = state.current
  const phase = state.phase
  const animate = state.animate

  const deal = useCallback(() => {
    tts.cancel()
    clearTimers()
    pendingRef.current?.controller.abort()

    const spread = spreadChoice === 'auto' ? chooseSpread(question) : SPREADS[spreadChoice]
    const cards = drawCards(spread)
    const rules = generateReading(question, spread, cards)
    const session: Session = { id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, question, spread, cards, reading: rules, createdAt: Date.now() }
    dispatch({ type: 'deal', session })

    let claudePromise: Promise<Reading | null> = Promise.resolve(null)
    if (llm.llm) {
      const controller = new AbortController()
      claudePromise = requestClaudeReading(question, spread, cards, controller.signal)
      pendingRef.current = { id: session.id, promise: claudePromise, controller }
    }

    const dealMs = reduced ? cards.length * 120 + CARD_REDUCED_MS : (cards.length - 1) * CARD_STAGGER_MS + CARD_ANIM_MS
    timersRef.current.push(
      window.setTimeout(() => {
        dispatch({ type: 'dealt' })
        const timeout = new Promise<null>((r) => timersRef.current.push(window.setTimeout(() => r(null), CLAUDE_GRACE_MS)))
        Promise.race([claudePromise, timeout]).then((reading) => {
          dispatch({ type: 'reading', sessionId: session.id, reading: reading ?? undefined })
          if (!reading) {
            // Kommt Claude doch noch, wird die Lesung still nachgezogen (F-09).
            claudePromise.then((late) => late && dispatch({ type: 'upgrade', sessionId: session.id, reading: late }))
          }
        })
      }, dealMs),
    )
  }, [question, spreadChoice, llm.llm, reduced, tts])

  // Sprachausgabe startet, sobald die Lesung steht (F-10).
  const spokenForRef = useRef<string | null>(null)
  useEffect(() => {
    if (phase !== 'reading' || !current || !ttsEnabled || !animate) return
    if (spokenForRef.current === current.id) return
    spokenForRef.current = current.id
    tts.speak(readingToSpeech(current.reading, current.cards))
  }, [phase, current, ttsEnabled, animate, tts])

  useEffect(() => () => clearTimers(), [])

  const ttsApi = useMemo(
    () => ({
      supported: tts.supported,
      enabled: ttsEnabled,
      speaking: tts.speaking,
      toggle: () => {
        if (ttsEnabled) tts.cancel()
        setTtsEnabled((v) => !v)
      },
      replay: () => current && tts.speak(readingToSpeech(current.reading, current.cards)),
      stop: tts.cancel,
    }),
    [tts, ttsEnabled, current],
  )

  return (
    <div className="app">
      <header className="top">
        <h1 className="top__title">Die Kartenlegerin</h1>
        <p className="top__sub">Stell deine Frage. Ich lege die Karten und lese, was sie erzählen.</p>
      </header>

      <section className="scene" aria-label="Tisch der Kartenlegerin">
        <Reader speaking={tts.speaking} />
        <div className="table">
          <div className="cloth">
            <Candle />
            <Deck empty={false} />
            {current ? (
              <CardLayout
                key={current.id}
                spreadId={current.spread.id}
                cards={current.cards}
                animate={state.animate}
                reduced={reduced}
                highlightedIndex={state.highlighted}
                onSelect={(i) => dispatch({ type: 'highlight', index: state.highlighted === i ? null : i })}
              />
            ) : (
              <p className="table__empty">Die Karten warten auf deine Frage.</p>
            )}
          </div>
        </div>
      </section>

      <main className="panel">
        <SpreadSelector value={spreadChoice} onChange={setSpreadChoice} disabled={busy} />
        <QuestionInput value={question} onChange={setQuestion} onSubmit={deal} disabled={busy} />
        {state.phase === 'dealing' && (
          <p className="status" role="status">
            Die Karten werden gelegt …
          </p>
        )}

        {current && (state.phase === 'waiting' || state.phase === 'reading') && (
          <ReadingOutput
            reading={current.reading}
            cards={current.cards}
            question={current.question}
            waiting={state.phase === 'waiting'}
            highlightedIndex={state.highlighted}
            onSelect={(i) => dispatch({ type: 'highlight', index: state.highlighted === i ? null : i })}
            tts={ttsApi}
          />
        )}

        <History sessions={state.history} currentId={current?.id ?? null} onOpen={(s) => { tts.cancel(); dispatch({ type: 'open', session: s }) }} />
      </main>

      <footer className="foot">
        <p>
          Zur Unterhaltung gedacht. Keine Lebens-, Rechts-, Finanz- oder Gesundheitsberatung. Kartenbedeutungen nach dem gemeinfreien Rider-Waite-Tarot.
        </p>
        <p>
          Spracheingabe nutzt die Spracherkennung deines Browsers, Audio kann an dessen Anbieter gesendet werden.{' '}
          {llm.llm ? `Die Deutung wird mit Claude (${llm.model}) erzeugt, dazu gehen Frage und Karten an Anthropic.` : 'Die Deutung entsteht regelbasiert auf deinem Gerät.'}{' '}
          Nichts wird gespeichert.
        </p>
      </footer>
    </div>
  )
}
