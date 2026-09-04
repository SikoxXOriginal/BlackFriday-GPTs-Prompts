import { detectTopic } from './classifier'
import { makeNoRepeatPicker, mulberry32, seedFrom } from './random'
import type { DrawnCard, Reading, Spread, Topic } from './types'

const OPENERS = [
  (p: string) => `${cap(p)} liegt`,
  (p: string) => `Die erste Karte, die ${p} spricht, ist`,
  (p: string) => `${cap(p)} zeigt sich`,
  (p: string) => `Schau, was ${p} auf dem Tuch liegt:`,
  (p: string) => `${cap(p)} hat sich gemeldet:`,
]

const UPRIGHT_LAGE = ['aufrecht', 'klar und aufrecht', 'offen daliegend', 'in ihrer klaren Lage']
const REVERSED_LAGE = ['umgekehrt', 'auf dem Kopf', 'gedreht, mit gedämpfter Kraft', 'in ihrer verkehrten Lage']

const BRIDGES = [
  'Auf deine Frage bezogen heißt das:',
  'Für dich bedeutet das im Moment:',
  'Übersetzt auf das, was du gefragt hast:',
  'Was ich darin für dich lese:',
  'Im Licht deiner Frage:',
]

const TOPIC_LINES: Record<Topic, string[]> = {
  love: [
    'In der Liebe zeigt sich hier, wohin dein Herz gerade wirklich schaut.',
    'Deine Verbindung zu einem anderen Menschen trägt genau diese Farbe.',
    'Zwischen dir und dem, was du dir in der Liebe wünschst, steht dieses Bild.',
    'Dein Herz kennt die Antwort schon, diese Karte spricht sie nur aus.',
  ],
  work: [
    'Im Beruflichen ist das der Ton, der gerade den Raum bestimmt.',
    'Für deine Arbeit und deine Ziele heißt das, genau hier anzusetzen.',
    'Dein Weg im Beruf nimmt diese Energie gerade auf.',
    'Was du aufbaust, bekommt von dieser Karte seine Richtung.',
  ],
  money: [
    'Beim Thema Geld und Sicherheit ist das die Kraft, die gerade wirkt.',
    'Deine materielle Lage spiegelt genau dieses Bild.',
    'Für deine Finanzen ist das ein Hinweis, den du ernst nehmen darfst.',
    'Was du besitzt und was du dir wünschst, begegnen sich hier.',
  ],
  health: [
    'Für deinen Körper und deine Kraft ist das ein leiser, aber wichtiger Hinweis.',
    'Deine Energie spricht durch diese Karte mit dir.',
    'Was dein Wohlbefinden gerade braucht, zeigt sich hier.',
    'Diese Karte erinnert dich daran, wie du mit dir selbst umgehst.',
  ],
  decision: [
    'Für deine Entscheidung wiegt das schwer, auch wenn es leise klingt.',
    'Hier liegt ein Teil der Antwort, die du suchst.',
    'Wenn du abwägst, gehört dieses Bild in die Waagschale.',
    'Deine Wahl bekommt von dieser Karte eine deutliche Färbung.',
  ],
  general: [
    'Für dich und deinen Weg ist das ein Bild, das dich begleiten darf.',
    'Nimm das als Spiegel dessen mit, was gerade in dir arbeitet.',
    'Diese Karte spricht über das, was dich im Moment innerlich bewegt.',
    'Lass das Bild einen Moment wirken, es weiß mehr, als es sagt.',
  ],
}

const SCENE_OPENERS = [
  'Die Kerze flackert, und ich lege die Hände auf das Tuch.',
  'Das Holz des Tisches ist warm unter meinen Fingern, während ich die Karten betrachte.',
  'Im Kerzenlicht ordnen sich die Bilder zu einer Geschichte.',
  'Ich atme ruhig, und die Karten beginnen, miteinander zu sprechen.',
  'Der Raum wird still, nur die Flamme bewegt sich, und ich lese, was vor uns liegt.',
]

const CONNECTORS = ['Daraus wächst', 'Darauf antwortet', 'Daneben liegt', 'Und dann kommt', 'Ihr zur Seite steht', 'Schließlich erscheint', 'Ganz leise folgt']

const CLOSERS: Record<Topic, string[]> = {
  love: ['So führt dein Weg im Herzen weiter, und du gehst ihn nicht allein.', 'Die Liebe, nach der du fragst, hat in diesen Bildern längst begonnen zu antworten.'],
  work: ['Dein Werk trägt diese Handschrift, und die Karten sehen, wohin es dich führt.', 'So fügt sich deine Arbeit zu einem Bild, das größer ist als der heutige Tag.'],
  money: ['Was du säst, findet in diesen Bildern seinen Boden.', 'So legt sich deine Sicherheit Stück für Stück auf den Tisch.'],
  health: ['Dein Körper hört zu, und die Karten flüstern ihm Ruhe zu.', 'So findet deine Kraft in diesen Bildern ihren Rhythmus zurück.'],
  decision: ['Die Antwort auf deine Frage liegt nicht in einer Karte, sondern im Weg zwischen ihnen.', 'So zeigt sich deine Wahl nicht als Entweder-oder, sondern als Richtung.'],
  general: ['So schließt sich der Kreis auf dem Tuch, und dein Weg geht weiter.', 'Die Bilder haben gesprochen, und sie sprechen über dich.'],
}

const ADVICE_POS = [
  'Mein Rat: Vertraue dem, was du bereits spürst, und geh den nächsten Schritt mit klarem Blick.',
  'Mein Rat: Die Karten stehen auf deiner Seite. Nutze den Rückenwind, solange er weht.',
  'Mein Rat: Sag Ja zu dem, was sich richtig anfühlt, und lass die Zweifel am Tisch zurück.',
]
const ADVICE_MIXED = [
  'Mein Rat: Wäge in Ruhe ab. Eine Karte liegt gedreht, das heißt nicht Nein, sondern: Schau genauer hin.',
  'Mein Rat: Geh weiter, aber nicht blind. Etwas in dieser Legung möchte, dass du einen Moment innehältst.',
  'Mein Rat: Nimm das Gute mit und prüfe das Gedrehte. Beides gehört zu deiner Antwort.',
]
const ADVICE_CAUTION = [
  'Mein Rat: Geduld. Mehrere Karten liegen gedreht, und das bedeutet, dass die Zeit noch arbeitet. Handle nicht aus Unruhe.',
  'Mein Rat: Warte, bevor du entscheidest. Die gedrehten Karten bitten dich, erst Klarheit zu finden.',
  'Mein Rat: Dies ist eine Legung des Innehaltens. Sammle dich, dann sieht die Welt anders aus.',
]

function cap(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

function endSentence(s: string): string {
  const t = s.trim()
  return /[.!?]$/.test(t) ? t : `${t}.`
}

/**
 * Regelbasierte Lesung (docs Abschnitt 6). Deterministisch für gleiche Frage + Karten.
 */
export function generateReading(question: string, _spread: Spread, cards: DrawnCard[]): Reading {
  const topic = detectTopic(question)
  const seed = seedFrom(`${question}|${cards.map((c) => `${c.card.id}${c.reversed ? 'r' : 'u'}`).join(',')}`)
  const rng = mulberry32(seed)
  const pickOpener = makeNoRepeatPicker(rng, OPENERS)
  const pickBridge = makeNoRepeatPicker(rng, BRIDGES)
  const pickTopicLine = makeNoRepeatPicker(rng, TOPIC_LINES[topic])
  const pickUp = makeNoRepeatPicker(rng, UPRIGHT_LAGE)
  const pickRev = makeNoRepeatPicker(rng, REVERSED_LAGE)

  const perCard = cards.map((dc) => {
    const lage = dc.reversed ? pickRev() : pickUp()
    const meaning = dc.reversed ? dc.card.reversed : dc.card.upright
    const text = `${pickOpener()(dc.position.phrase)} ${dc.card.name}, ${lage}. ${endSentence(meaning)} ${pickBridge()} ${pickTopicLine()}`
    return { cardId: dc.card.id, text }
  })

  const pickConnector = makeNoRepeatPicker(rng, CONNECTORS)
  const sentences: string[] = [makeNoRepeatPicker(rng, SCENE_OPENERS)()]
  // Maximal 4 verbindende Sätze, damit die Geschichte bei 3 bis 6 Sätzen bleibt.
  const linkCards = cards.length > 4 ? [cards[0], cards[1], cards[cards.length - 2], cards[cards.length - 1]] : cards
  linkCards.forEach((dc, i) => {
    const kw = dc.card.keywords[Math.floor(rng() * dc.card.keywords.length)]
    const lageWort = dc.reversed ? 'gedreht' : 'aufrecht'
    if (i === 0) {
      sentences.push(`Zuerst ${dc.card.name}, ${lageWort}: ${kw} ist der Grundton, ${dc.position.phrase}.`)
    } else {
      sentences.push(`${pickConnector()} ${dc.card.name}, ${lageWort}, und bringt ${kw} ${dc.position.phrase}.`)
    }
  })
  if (sentences.length < 6) sentences.push(makeNoRepeatPicker(rng, CLOSERS[topic])())
  const story = sentences.slice(0, 6).join(' ')

  const reversedCount = cards.filter((c) => c.reversed).length
  const last = cards[cards.length - 1]
  const advicePool = reversedCount === 0 ? ADVICE_POS : reversedCount === 1 ? ADVICE_MIXED : ADVICE_CAUTION
  const advice = `${makeNoRepeatPicker(rng, advicePool)()} ${last.card.name} steht am Ende deiner Legung ${last.position.phrase}: ${last.card.keywords[0]} ist das Wort, das du mitnimmst.`

  return { perCard, story, advice, source: 'rules' }
}

export function countSentences(text: string): number {
  return text.split(/[.!?]+\s|[.!?]+$/).filter((s) => s.trim().length > 0).length
}
