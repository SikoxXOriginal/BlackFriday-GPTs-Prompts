import { createApp } from './app.mjs'
import { createClaudeProvider, DEFAULT_MODEL } from './claude.mjs'

const port = Number(process.env.PORT ?? 8787)
const model = process.env.CLAUDE_MODEL ?? DEFAULT_MODEL
const hasKey = Boolean(process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_AUTH_TOKEN)

const provider = hasKey ? createClaudeProvider({ model }) : null
const app = createApp({ provider, model })

app.listen(port, () => {
  console.log(`[tarot] Server läuft auf http://localhost:${port}`)
  console.log(hasKey ? `[tarot] Claude-Lesungen aktiv (${model})` : '[tarot] Kein ANTHROPIC_API_KEY: regelbasierte Lesungen im Client')
})
