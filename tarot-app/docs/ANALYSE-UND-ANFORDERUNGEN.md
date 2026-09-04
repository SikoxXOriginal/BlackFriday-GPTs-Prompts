# PDF-Analyse & optimierte Anforderungen: Virtuelle Tarot-Kartenlegerin

Quelle: `tarot-app-prompt.md` (PDF, 6 Seiten, Chromium-Export vom 2026-09-04).
Ziel dieses Dokuments: das Original-Briefing auf Lücken, Risiken und Widersprüche prüfen, daraus eine belastbare, testbare Spezifikation ableiten und einen verbesserten Drop-in-Prompt für Claude Code liefern.

---

## 1. Kurzfazit der Analyse

**Stärken des Originals**

- Klarer Scope: eine Szene, ein Input, ein Output. MVP und Nice-to-have sauber getrennt.
- Lizenzbewusstsein: Rider-Waite als gemeinfreie Datenbasis, explizites Verbot geschützter Oracle-Decks und Fotos echter Personen.
- Tech-Stack festgelegt (React, Hooks, kein Storage, Mobile-first).
- Regelbasierte Lesung als Pflicht, KI nur optional. Damit läuft die App ohne Key und ohne Kosten.

**Kritische Lücken (Top 5)**

| # | Befund | Risiko | Fix in der Spezifikation |
|---|--------|--------|--------------------------|
| 1 | Claude-API-Call ist implizit aus dem Browser gedacht | API-Key landet im Client-Bundle, Missbrauch, Kosten | Schlanker Node-Proxy (`server/`), Key nur serverseitig, Client ruft `/api/reading` |
| 2 | Modell `claude-sonnet-4-6` vorgegeben | Vorgänger-Generation, teurer ($3/$15 statt $2/$10 pro MTok), Structured Outputs nicht garantiert | Default `claude-sonnet-5`, per `CLAUDE_MODEL` überschreibbar. Sonnet 4.6 bleibt einstellbar |
| 3 | "je nach Frage-Typ automatisch 2–3 Karten" ist nicht definiert | Nicht testbar, willkürliches Verhalten | Deterministischer Klassifikator mit festen Regeln (Abschnitt 5) plus manueller Override |
| 4 | Lesungs-Struktur ("regelbasiert") ist nicht beschrieben | Starre, sich wiederholende Texte | Definierter Algorithmus mit Satzbausteinen, Positionsbezug, Varianz per Seed (Abschnitt 6) |
| 5 | Keine Angaben zu Browser-Support, Fehlerfällen, Barrierefreiheit, Datenschutz | Mikrofon/TTS scheitern still, Motion-Sickness, DSGVO-Lücke | Feature-Detection mit Fallbacks, `prefers-reduced-motion`, Hinweise zu Spracherkennung und KI-Verarbeitung |

**Weitere Befunde**

- Wahrscheinlichkeit für umgekehrte Karten fehlt. Festgelegt: 30 % (klassische Praxis, 50 % liefert zu düstere Lesungen).
- Ziehen ohne Zurücklegen ist nicht explizit gefordert. Festgelegt: keine Karte doppelt in einer Legung.
- `tarot-deck.json` ohne Feldschema. Festgelegt: Schema in Abschnitt 4 plus automatischer Validierungstest (78 Karten, 22 Große Arkana, 4 Farben x 14).
- Framer Motion vs. CSS offen. Entscheidung: reines CSS (keine Zusatz-Dependency, kleineres Bundle, GPU-freundliche `transform`/`opacity`-Animationen).
- TTS: deutsche Stimme ist nicht garantiert, iOS verlangt eine User-Geste, laufende Sprachausgabe muss bei neuer Legung abgebrochen werden.
- Spracherkennung: nur Chrome/Edge/Safari, Audio geht an den Browser-Anbieter. Button nur zeigen, wenn die API existiert, Nutzer informieren.
- Kein Haftungshinweis. Ergänzt: "Unterhaltung, keine Lebens-, Rechts- oder Gesundheitsberatung".
- "Nächste Schritte" nennt `create-react-app` (deprecated). Ersetzt durch Vite.
- Keine Tests gefordert. Ergänzt: Unit-Tests für Deck, Klassifikator, Spreads, Lesungs-Generator, API-Proxy.

---

## 2. Ziel und Scope

**Produktziel:** Eine mobile-first Web-App, in der eine illustrierte Kartenlegerin an einem Tisch auf eine Frage des Nutzers hin Karten zieht, umdreht, ablegt und eine atmosphärische, personalisierte Deutung liefert, gesprochen und als Text.

**In Scope (MVP)**

- Szene: Tisch (dunkles Holz, Tuch, Kerze), Avatar mit Idle-Animation, Kartenstapel, Ablagefläche.
- Input: Textfeld, Mikrofon (Web Speech API, `de-DE`, Live-Transkript), Button "Karten legen".
- Kartenlogik: 78 Rider-Waite-Karten aus `tarot-deck.json`, Spread-Auswahl automatisch oder manuell, aufrecht/umgekehrt.
- Lesung: pro Karte Deutung im Kontext, verbindende Kurzgeschichte (3–6 Sätze), Fazit/Rat. Regelbasiert. Optional via Claude.
- Sprachausgabe via `speechSynthesis` (deutsch), abschaltbar.
- Verlauf der Session (in-memory), Legesysteme 1 / 2 / 3 / Keltisches Kreuz, Kerzenflackern.

**Out of Scope**

- Persistenz jeder Art (localStorage, Cookies, Server-DB), Accounts, Bezahlung.
- Nachbau geschützter Decks, Fotos echter Personen, Kartenbilder aus fremden Quellen.
- Native Apps.

---

## 3. Anforderungen

### 3.1 Funktional

| ID | Anforderung | Priorität |
|----|-------------|-----------|
| F-01 | Der Nutzer kann eine Frage als Text eingeben (max. 500 Zeichen). | Muss |
| F-02 | Wenn `SpeechRecognition` verfügbar ist, zeigt die App einen Mikrofon-Button. Aufnahme in `de-DE`, Zwischenergebnisse werden live ins Textfeld geschrieben. Fehler (keine Berechtigung, kein Netz) werden verständlich angezeigt. | Muss |
| F-03 | Ohne `SpeechRecognition` wird der Button ausgeblendet, die App bleibt voll nutzbar. | Muss |
| F-04 | Ein Klick auf "Karten legen" wählt das Legesystem (automatisch per Klassifikator oder manuell), zieht die Karten ohne Zurücklegen und bestimmt je Karte aufrecht/umgekehrt (30 % umgekehrt). | Muss |
| F-05 | Jede Karte fliegt nacheinander aus dem Stapel, dreht sich um und liegt sichtbar an ihrer Position. Umgekehrte Karten werden um 180° gedreht dargestellt. | Muss |
| F-06 | Die Kartenrückseite ist ein eigenes generisches Design (CSS/SVG). Die Vorderseite zeigt Name, Nummer/Farbe und ein symbolisches Icon, kein fremdes Artwork. | Muss |
| F-07 | Nach dem Legen erzeugt die App eine Lesung mit: (a) Deutung pro Karte mit Positions- und Fragebezug, (b) Kurzgeschichte 3–6 Sätze, (c) Fazit/Rat. | Muss |
| F-08 | Die Lesung wird regelbasiert erzeugt und funktioniert ohne Netz und ohne API-Key. | Muss |
| F-09 | Wenn der Server einen `ANTHROPIC_API_KEY` hat, holt der Client die Lesung von `/api/reading`. Schlägt das fehl, fällt die App ohne Fehlermeldung auf die regelbasierte Lesung zurück und zeigt die Quelle dezent an. | Soll |
| F-10 | Die Lesung wird per `speechSynthesis` mit deutscher Stimme vorgelesen, während der Text eingeblendet wird. Sprachausgabe ist per Toggle abschaltbar und wird bei neuer Legung abgebrochen. | Soll |
| F-11 | Frühere Legungen der Session sind in einem Verlauf abrufbar (in-memory, verschwindet beim Reload). | Kann |
| F-12 | Legesystem manuell wählbar: Auto, 1 Karte, 2 Karten, 3 Karten, Keltisches Kreuz (10). | Kann |
| F-13 | Kerzenflackern und Avatar-Idle (Atmen, Blinzeln, Kopfneigen) laufen als CSS-Animation. | Kann |

### 3.2 Nicht-funktional

| ID | Anforderung |
|----|-------------|
| N-01 | Mobile-first: nutzbar ab 360 px Breite, Karten per Touch lesbar, keine horizontale Scrollleiste. |
| N-02 | Kein `localStorage`, `sessionStorage`, IndexedDB oder Cookie. State nur in React (`useState`/`useReducer`). |
| N-03 | Animationen nur über `transform` und `opacity`. Bei `prefers-reduced-motion: reduce` werden Flug-, Flip- und Idle-Animationen auf Ein-/Ausblenden reduziert. |
| N-04 | Barrierefreiheit: Buttons mit `aria-label`, Lesung in `aria-live="polite"`, Kontrast mindestens 4.5:1 für Fließtext. |
| N-05 | Lizenz: Nur Rider-Waite-Bedeutungen (gemeinfrei). Keine Texte oder Designs geschützter Decks. Kartenbilder nur als eigene SVG/CSS-Symbole. |
| N-06 | Der API-Key liegt ausschließlich in der Server-Umgebung. Der Client-Bundle enthält keinen Key. |
| N-07 | Datenschutz-Hinweis in der UI: Spracherkennung sendet Audio an den Browser-Anbieter, KI-Lesung sendet Frage und Karten an Anthropic. |
| N-08 | Haftungshinweis: Unterhaltung, keine Beratung. |
| N-09 | Build mit Vite, TypeScript strict, `npm run build` ohne Warnungen, Unit-Tests grün. |

---

## 4. Datenmodell `tarot-deck.json`

```ts
type Arcana = "major" | "minor";
type Suit = "wands" | "cups" | "swords" | "pentacles" | null;

interface TarotCard {
  id: string;          // stabil, z.B. "major-00", "cups-11"
  name: string;        // deutsch, z.B. "Der Narr"
  nameEn: string;      // englisch (Rider-Waite), z.B. "The Fool"
  number: number;      // Große Arkana 0–21, Kleine Arkana 1–14 (11 Bube, 12 Ritter, 13 Königin, 14 König)
  arcana: Arcana;
  suit: Suit;          // null bei Großer Arkana
  upright: string;     // Kernbedeutung aufrecht, 1–2 Sätze
  reversed: string;    // Kernbedeutung umgekehrt, 1–2 Sätze
  keywords: string[];  // 3–5 Symbolik-Stichworte
}
```

Validierungsregeln (Unit-Test): genau 78 Einträge, 22 `major` mit Nummern 0–21, je Farbe 14 Karten mit Nummern 1–14, alle `id` eindeutig, alle Textfelder nicht leer.

---

## 5. Legesystem-Regeln (Klassifikator)

Eingabe: Frage als String. Ausgabe: Spread-ID. Reihenfolge der Regeln ist bindend.

1. Leere Frage oder unter 3 Zeichen: `three` (Vergangenheit, Gegenwart, Zukunft) als allgemeine Tageslesung.
2. Entscheidungsfrage, erkannt an " oder " zwischen zwei Alternativen, oder an Mustern wie "soll ich", "sollte ich", "ja oder nein", "lohnt es sich": `two` (Positionen: "Situation" und "Rat" beziehungsweise "Option A" und "Option B" bei " oder ").
3. Zeitbezug ("wird", "zukunft", "kommt", "nächste", "bald", "wann", "in einem jahr"): `three`.
4. Beziehungs- oder Vergangenheitsbezug ("warum", "vergangenheit", "damals", "beziehung", "wir"): `three`.
5. Sonst: `three`.

Manuelle Auswahl übersteuert den Klassifikator. Spreads:

| ID | Karten | Positionen |
|----|--------|------------|
| `one` | 1 | Botschaft |
| `two` | 2 | Situation, Rat (oder Option A, Option B) |
| `three` | 3 | Vergangenheit, Gegenwart, Zukunft |
| `celtic` | 10 | Situation, Herausforderung, Grundlage, Vergangenheit, Krone, Zukunft, Selbstbild, Umfeld, Hoffnungen und Ängste, Ergebnis |

---

## 6. Regelbasierter Lesungs-Algorithmus

Ziel: Texte, die sich lebendig anfühlen, ohne KI. Alle Bausteine liegen in `src/logic/reading.ts`.

1. **Seed:** Aus Frage plus gezogenen Karten-IDs wird ein Seed gebildet. Der Zufallsgenerator für die Satzbausteine ist damit deterministisch (Test-Stabilität), variiert aber je Legung.
2. **Pro Karte:** `[Positions-Einleitung] + [Kartenname mit Lage] + [Kernbedeutung] + [Fragebezug]`. Für jeden Baustein gibt es 4–6 Varianten. Der Fragebezug nutzt ein Thema, das aus der Frage erkannt wird (Liebe, Beruf, Geld, Gesundheit, Entscheidung, Allgemein).
3. **Kurzgeschichte:** 3–6 Sätze. Satz 1 setzt die Szene (Kerzenlicht, Tisch). Sätze 2 bis n-1 verknüpfen die Karten in Positionsreihenfolge mit je einem Verbindungswort aus einer Liste ohne Wiederholung. Letzter Satz führt zum Thema der Frage zurück. Ton: warm, persönlich, zweite Person Singular.
4. **Fazit:** Ein Rat, abgeleitet aus der letzten Karte und der Anzahl umgekehrter Karten (0: bestärkend, 1: abwägend, 2+: mahnend zu Geduld).
5. Keine Karte darf mit exakt derselben Formulierung zweimal in einer Session gedeutet werden, solange Varianten vorhanden sind.

---

## 7. Claude-Integration (optional)

- Server: `server/index.mjs` (Node 22, Express). Route `POST /api/reading` mit Body `{ question, spread, cards: [{ name, position, reversed, upright, reversedMeaning, keywords }] }`.
- Antwort als JSON per Structured Outputs (`output_config.format`), Schema identisch zur regelbasierten Lesung: `{ perCard: [{ cardId, text }], story, advice }`.
- Modell: `claude-sonnet-5` (Default), `thinking: { type: "adaptive" }`, `output_config.effort: "medium"`, `max_tokens: 4000`. Überschreibbar per `CLAUDE_MODEL`.
- `GET /api/health` liefert `{ llm: boolean, model }`, damit der Client entscheiden kann.
- Fehler (429, 5xx, Timeout, `stop_reason: "refusal"`) führen zu HTTP 503 mit `{ fallback: true }`. Der Client nutzt dann die regelbasierte Lesung.
- Der Client spricht nie direkt mit `api.anthropic.com`.

---

## 8. Akzeptanzkriterien (Auszug)

```gherkin
Szenario: Entscheidungsfrage
  Gegeben die Frage "Soll ich den Job wechseln oder bleiben?"
  Wenn ich auf "Karten legen" klicke
  Dann werden genau 2 Karten gezogen
  Und die Positionen heißen "Option A" und "Option B"

Szenario: Keine Karte doppelt
  Gegeben das Keltische Kreuz
  Wenn 10 Karten gezogen werden
  Dann sind alle 10 Karten-IDs verschieden

Szenario: Offline-Lesung
  Gegeben der Server hat keinen API-Key
  Wenn eine Legung abgeschlossen ist
  Dann erscheint eine Lesung mit Deutung pro Karte, Geschichte mit 3 bis 6 Sätzen und Fazit
  Und die Quelle wird als "Tischregeln" angezeigt

Szenario: Reduced Motion
  Gegeben der Nutzer hat prefers-reduced-motion aktiviert
  Wenn Karten gelegt werden
  Dann gibt es keine Flug- und Flip-Animation, Karten blenden nur ein
```

---

## 9. Umsetzungsreihenfolge

1. `tarot-deck.json` mit 78 Karten und Validierungstest.
2. Logik: Klassifikator, Spreads, Ziehen, Lesungs-Generator, Tests.
3. Szene: Tisch, Avatar, Stapel, Karten-Animation.
4. Input mit Spracherkennung, Ausgabe mit Sprachausgabe.
5. Server-Proxy und Claude-Integration mit Fallback.
6. Verlauf, Spread-Auswahl, Kerze, Reduced-Motion, Disclaimer.
7. Build, Lint, Tests, Smoke-Test im Browser.

---

## 10. Optimierter Drop-in-Prompt für Claude Code

```markdown
# Projekt: Virtuelle Tarot-Kartenlegerin (Web-App)

Baue eine mobile-first Web-App mit Vite + React 19 + TypeScript (strict), funktionale Komponenten und Hooks, reines CSS für Animationen, keine weiteren UI-Libraries.

## Szene
- Tisch in Draufsicht/leicht schräg: dunkles Holz, Tuch, Kerze mit CSS-Flackern.
- Gegenüber eine illustrierte Kartenlegerin als SVG (kein Foto, keine reale Person) mit CSS-Idle: Atmen, Blinzeln, leichtes Kopfneigen.
- Kartenstapel mit eigener generischer Rückseite (CSS/SVG). Karten fliegen einzeln aus dem Stapel, flippen und liegen an definierten Positionen. Umgekehrte Karten sind um 180° gedreht.
- Bei prefers-reduced-motion nur Ein-/Ausblenden.

## Input
- Textfeld (max. 500 Zeichen) und Button "Karten legen".
- Mikrofon-Button nur wenn SpeechRecognition/webkitSpeechRecognition existiert: lang de-DE, interimResults, Live-Transkript ins Textfeld, Fehler verständlich anzeigen.

## Daten
- src/data/tarot-deck.json: alle 78 Rider-Waite-Karten (gemeinfrei) mit id, name (DE), nameEn, number, arcana, suit, upright, reversed, keywords[]. Keine Texte oder Designs geschützter Oracle-Decks.
- Unit-Test: 78 Karten, 22 Große Arkana 0–21, 4 Farben x 14, ids eindeutig.

## Legesysteme
- Auto-Klassifikator: Entscheidungsfrage ("oder", "soll ich", "ja oder nein") → 2 Karten (Option A/B bzw. Situation/Rat); sonst 3 Karten (Vergangenheit/Gegenwart/Zukunft). Leere Frage → 3 Karten.
- Manuell: 1 Karte, 2 Karten, 3 Karten, Keltisches Kreuz (10).
- Ziehen ohne Zurücklegen, 30 % umgekehrt.

## Lesung (regelbasiert, ohne API)
- Pro Karte: Positionseinleitung + Kartenname mit Lage + Kernbedeutung + Bezug zur Frage (Thema: Liebe/Beruf/Geld/Gesundheit/Entscheidung/Allgemein). 4–6 Varianten je Baustein, Seed aus Frage + Karten.
- Kurzgeschichte 3–6 Sätze, warmer persönlicher Ton in Du-Form, Karten in Positionsreihenfolge verknüpft.
- Fazit/Rat abhängig von letzter Karte und Anzahl umgekehrter Karten.

## Optional: Claude
- Node-Server server/index.mjs (Express) mit POST /api/reading und GET /api/health. Key nur aus process.env.ANTHROPIC_API_KEY. Client ruft nie api.anthropic.com direkt.
- @anthropic-ai/sdk, Modell claude-sonnet-5 (per CLAUDE_MODEL überschreibbar), adaptive thinking, effort medium, Structured Outputs mit Schema { perCard[], story, advice }.
- Bei jedem Fehler oder refusal: 503 mit fallback:true, Client nutzt Regel-Lesung.

## Sprachausgabe
- speechSynthesis mit deutscher Stimme (de-*), Toggle, Abbruch bei neuer Legung, Text wird parallel angezeigt.

## Regeln
- Kein localStorage/sessionStorage/IndexedDB/Cookies. Verlauf nur in-memory.
- aria-label auf allen Icon-Buttons, Lesung in aria-live="polite".
- Hinweise in der UI: Unterhaltung, keine Beratung. Spracherkennung sendet Audio an den Browser-Anbieter, KI-Lesung sendet Frage und Karten an Anthropic.
- npm run build, npm run lint, npm test müssen grün sein.

## Reihenfolge
1. tarot-deck.json + Test  2. Logik + Tests  3. Szene + Animation  4. Input/Output inkl. Speech  5. Server + Claude  6. Verlauf, Spreads, Kerze  7. Build + Smoke-Test
```
