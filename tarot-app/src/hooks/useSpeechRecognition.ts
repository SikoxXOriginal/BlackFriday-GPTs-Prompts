import { useCallback, useEffect, useRef, useState } from 'react'

// Minimale Typen, weil die Web Speech API nicht in allen TS-DOM-Libs enthalten ist.
interface SRResultAlt { transcript: string }
interface SRResult { isFinal: boolean; 0: SRResultAlt; length: number }
interface SREvent { resultIndex: number; results: ArrayLike<SRResult> }
interface SRErrorEvent { error: string }
interface SRInstance {
  lang: string
  interimResults: boolean
  continuous: boolean
  onresult: ((e: SREvent) => void) | null
  onerror: ((e: SRErrorEvent) => void) | null
  onend: (() => void) | null
  start: () => void
  stop: () => void
  abort: () => void
}
type SRCtor = new () => SRInstance

function getCtor(): SRCtor | null {
  if (typeof window === 'undefined') return null
  const w = window as unknown as { SpeechRecognition?: SRCtor; webkitSpeechRecognition?: SRCtor }
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null
}

const ERROR_TEXT: Record<string, string> = {
  'not-allowed': 'Mikrofon-Zugriff wurde verweigert. Bitte in den Browser-Einstellungen erlauben.',
  'service-not-allowed': 'Spracherkennung ist in diesem Browser nicht freigegeben.',
  network: 'Keine Verbindung zur Spracherkennung. Bitte Netzwerk prüfen.',
  'no-speech': 'Ich habe nichts gehört. Versuch es noch einmal.',
  'audio-capture': 'Kein Mikrofon gefunden.',
  aborted: '',
}

export interface SpeechRecognitionApi {
  supported: boolean
  listening: boolean
  error: string | null
  start: () => void
  stop: () => void
}

/**
 * Live-Transkription (de-DE). onTranscript erhält den kompletten aktuellen Text
 * (final + interim), damit das Textfeld während des Sprechens mitläuft.
 */
export function useSpeechRecognition(onTranscript: (text: string, isFinal: boolean) => void): SpeechRecognitionApi {
  const [supported] = useState(() => getCtor() !== null)
  const [listening, setListening] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const recRef = useRef<SRInstance | null>(null)
  const finalRef = useRef('')
  const cbRef = useRef(onTranscript)
  useEffect(() => {
    cbRef.current = onTranscript
  }, [onTranscript])

  useEffect(() => () => recRef.current?.abort(), [])

  const stop = useCallback(() => {
    recRef.current?.stop()
  }, [])

  const start = useCallback(() => {
    const Ctor = getCtor()
    if (!Ctor) return
    recRef.current?.abort()
    const rec = new Ctor()
    rec.lang = 'de-DE'
    rec.interimResults = true
    rec.continuous = false
    finalRef.current = ''
    setError(null)
    rec.onresult = (e) => {
      let interim = ''
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const r = e.results[i]
        if (r.isFinal) finalRef.current += r[0].transcript
        else interim += r[0].transcript
      }
      const text = (finalRef.current + interim).trim()
      cbRef.current(text, interim === '')
    }
    rec.onerror = (e) => {
      const msg = ERROR_TEXT[e.error] ?? `Spracherkennung fehlgeschlagen (${e.error}).`
      if (msg) setError(msg)
    }
    rec.onend = () => {
      setListening(false)
      recRef.current = null
    }
    recRef.current = rec
    try {
      rec.start()
      setListening(true)
    } catch {
      setError('Spracherkennung konnte nicht gestartet werden.')
    }
  }, [])

  return { supported, listening, error, start, stop }
}
