import { useCallback, useEffect, useRef, useState } from 'react'

export interface SpeechSynthesisApi {
  supported: boolean
  speaking: boolean
  voiceName: string | null
  speak: (text: string) => void
  cancel: () => void
}

function pickGermanVoice(voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | null {
  const de = voices.filter((v) => v.lang.toLowerCase().startsWith('de'))
  if (de.length === 0) return null
  // Bevorzugt: lokale Stimmen, dann weibliche Namen (die Kartenlegerin), sonst erste deutsche.
  const preferred =
    de.find((v) => v.localService && /anna|petra|helena|katja|vicki|marlene|hedda|female|frau/i.test(v.name)) ??
    de.find((v) => /anna|petra|helena|katja|vicki|marlene|hedda|female|frau/i.test(v.name)) ??
    de.find((v) => v.localService) ??
    de[0]
  return preferred
}

/** Sprachausgabe der Lesung mit deutscher Stimme, abbrechbar. */
export function useSpeechSynthesis(): SpeechSynthesisApi {
  const supported = typeof window !== 'undefined' && 'speechSynthesis' in window
  const [speaking, setSpeaking] = useState(false)
  const [voice, setVoice] = useState<SpeechSynthesisVoice | null>(null)
  const utterRef = useRef<SpeechSynthesisUtterance | null>(null)

  useEffect(() => {
    if (!supported) return
    const load = () => setVoice(pickGermanVoice(window.speechSynthesis.getVoices()))
    load()
    window.speechSynthesis.addEventListener('voiceschanged', load)
    return () => {
      window.speechSynthesis.removeEventListener('voiceschanged', load)
      window.speechSynthesis.cancel()
    }
  }, [supported])

  const cancel = useCallback(() => {
    if (!supported) return
    window.speechSynthesis.cancel()
    utterRef.current = null
    setSpeaking(false)
  }, [supported])

  const speak = useCallback(
    (text: string) => {
      if (!supported || !text.trim()) return
      window.speechSynthesis.cancel()
      // Chrome bricht lange Utterances nach ca. 15 s ab, deshalb satzweise Chunks in die Queue.
      const chunks = splitIntoChunks(text, 220)
      setSpeaking(true)
      chunks.forEach((chunk, i) => {
        const u = new SpeechSynthesisUtterance(chunk)
        u.lang = voice?.lang ?? 'de-DE'
        if (voice) u.voice = voice
        u.rate = 0.92
        u.pitch = 1.02
        if (i === chunks.length - 1) {
          u.onend = () => setSpeaking(false)
          u.onerror = () => setSpeaking(false)
          utterRef.current = u
        }
        window.speechSynthesis.speak(u)
      })
    },
    [supported, voice],
  )

  return { supported, speaking, voiceName: voice?.name ?? null, speak, cancel }
}

export function splitIntoChunks(text: string, max: number): string[] {
  const sentences = text.match(/[^.!?]+[.!?]+["»“]?|[^.!?]+$/g) ?? [text]
  const out: string[] = []
  let cur = ''
  for (const s of sentences) {
    const piece = s.trim()
    if (!piece) continue
    if ((cur + ' ' + piece).trim().length > max && cur) {
      out.push(cur.trim())
      cur = piece
    } else {
      cur = `${cur} ${piece}`.trim()
    }
  }
  if (cur) out.push(cur.trim())
  return out
}
