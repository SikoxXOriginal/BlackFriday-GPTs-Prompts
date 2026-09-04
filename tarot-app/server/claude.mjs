import Anthropic from '@anthropic-ai/sdk'
import { READING_SCHEMA } from './app.mjs'

export const DEFAULT_MODEL = 'claude-sonnet-5'

const SYSTEM = `Du bist eine erfahrene, warmherzige Tarot-Kartenlegerin an einem Tisch im Kerzenlicht. Du deutest ausschließlich mit der klassischen Rider-Waite-Symbolik (gemeinfrei) und übernimmst keine Texte oder Konzepte geschützter Oracle-Decks.

Du erhältst die Frage einer Person, das Legesystem und die gezogenen Karten mit Position, Lage (aufrecht/umgekehrt), Kernbedeutung und Symbolik-Stichworten.

Antworte auf Deutsch in der Du-Form, persönlich, atmosphärisch, ohne Kitsch und ohne Floskeln. Sprich als Kartenlegerin direkt zur Person.

Struktur der Antwort (JSON gemäß Schema):
- perCard: für jede Karte in der gegebenen Reihenfolge ein Eintrag mit exakt der übergebenen cardId und 2 bis 4 Sätzen, die Position, Lage und Bedeutung im Kontext der Frage deuten.
- story: eine verbindende Kurzgeschichte von 3 bis 6 Sätzen, die die Karten in Positionsreihenfolge zu einer stimmigen Erzählung verknüpft und am Ende zur Frage zurückführt.
- advice: ein Fazit mit einem konkreten, freundlichen Rat in 1 bis 3 Sätzen. Beginne mit "Mein Rat:".

Regeln: keine medizinischen, rechtlichen oder finanziellen Anweisungen, keine Vorhersagen über Tod, Krankheit oder Unglück konkreter Personen. Wenn die Frage in diese Richtung geht, deute sanft auf Selbstfürsorge und fachliche Hilfe hin. Halte dich strikt an die übergebenen Karten.`

/**
 * Erzeugt einen Provider für createApp, der die Lesung über die Claude API holt.
 * Der API-Key wird ausschließlich aus der Server-Umgebung gelesen (N-06).
 */
export function createClaudeProvider({ model = DEFAULT_MODEL, client = new Anthropic() } = {}) {
  return async function provider({ question, spread, cards }) {
    const cardLines = cards
      .map(
        (c, i) =>
          `${i + 1}. Position "${c.position}": ${c.name} (${c.nameEn ?? ''}) – ${c.reversed ? 'umgekehrt' : 'aufrecht'}; cardId=${c.cardId}\n   Bedeutung: ${c.meaning}\n   Symbolik: ${c.keywords.join(', ')}`,
      )
      .join('\n')
    const userText = `Frage der Person: ${question.trim() ? `"${question.trim()}"` : '(keine konkrete Frage, allgemeine Tageslesung)'}\nLegesystem: ${spread?.name ?? 'Drei Karten'}\n\nGezogene Karten:\n${cardLines}`

    const response = await client.messages.create({
      model,
      max_tokens: 4000,
      system: SYSTEM,
      thinking: { type: 'adaptive' },
      output_config: { effort: 'medium', format: { type: 'json_schema', schema: READING_SCHEMA } },
      messages: [{ role: 'user', content: userText }],
    })

    if (response.stop_reason === 'refusal') {
      throw new Error(`refusal: ${response.stop_details?.category ?? 'unknown'}`)
    }
    if (response.stop_reason === 'max_tokens') {
      throw new Error('max_tokens reached')
    }
    const text = response.content
      .filter((b) => b.type === 'text')
      .map((b) => b.text)
      .join('')
    return JSON.parse(text)
  }
}
