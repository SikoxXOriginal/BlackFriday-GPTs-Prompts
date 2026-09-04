import { SPREADS, TWO_OPTIONS } from './spreads'
import type { Spread, Topic } from './types'

const DECISION_PATTERNS = [
  /\bsoll(te)? ich\b/,
  /\bja oder nein\b/,
  /\blohnt (es )?sich\b/,
  /\bist es (besser|richtig|klug)\b/,
  /\bwäre es (besser|richtig|klug)\b/,
  /\bkann ich\b.*\?$/,
]

const ALTERNATIVE_PATTERN = /\S+\s+oder\s+\S+/

const TIME_PATTERNS = [/\bwird\b/, /\bzukunft\b/, /\bkommt\b/, /\bnächste[nrs]?\b/, /\bbald\b/, /\bwann\b/, /\bin einem jahr\b/]

export function normalizeQuestion(q: string): string {
  return q.trim().toLowerCase().replace(/\s+/g, ' ')
}

/**
 * Wählt das Legesystem anhand fester Regeln (siehe docs, Abschnitt 5).
 * Reihenfolge der Regeln ist bindend.
 */
export function chooseSpread(question: string): Spread {
  const q = normalizeQuestion(question)
  if (q.length < 3) return SPREADS.three
  if (ALTERNATIVE_PATTERN.test(q)) return TWO_OPTIONS
  if (DECISION_PATTERNS.some((p) => p.test(q))) return SPREADS.two
  if (TIME_PATTERNS.some((p) => p.test(q))) return SPREADS.three
  return SPREADS.three
}

const TOPIC_KEYWORDS: Record<Exclude<Topic, 'general'>, RegExp[]> = {
  love: [/\bliebe\b/, /\bbeziehung\b/, /\bpartner(in)?\b/, /\bfreund(in)?\b/, /\bherz\b/, /\bdate\b/, /\bex\b/, /\bheirat/, /\btrenn/],
  work: [/\bjob\b/, /\barbeit/, /\bberuf/, /\bkarriere\b/, /\bchef/, /\bfirma\b/, /\bprojekt\b/, /\bstudio\b/, /\bkund/, /\bbewerbung\b/, /\bstudium\b/],
  money: [/\bgeld\b/, /\bfinanz/, /\bschulden\b/, /\binvest/, /\bkauf/, /\bmiete\b/, /\bgehalt\b/, /\beinkommen\b/, /\bsparen\b/],
  health: [/\bgesund/, /\bkrank/, /\bkörper\b/, /\bschlaf/, /\bstress\b/, /\benergie\b/, /\bmüde\b/, /\berschöpf/],
  decision: [/\bsoll(te)? ich\b/, /\boder\b/, /\bentscheid/, /\bwahl\b/, /\bwechsel/],
}

/** Erkennt das Thema der Frage; das erste Thema in der Reihenfolge love, work, money, health, decision gewinnt. */
export function detectTopic(question: string): Topic {
  const q = normalizeQuestion(question)
  for (const topic of ['love', 'work', 'money', 'health', 'decision'] as const) {
    if (TOPIC_KEYWORDS[topic].some((p) => p.test(q))) return topic
  }
  return 'general'
}
