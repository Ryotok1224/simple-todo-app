import path from 'node:path'
import express from 'express'
import { rateLimit } from 'express-rate-limit'
import { classifyTodo, isJevEnabled } from './classify.ts'

const PORT = Number(process.env.PORT ?? 8787)
const MAX_TEXT_LENGTH = 200
const distDir = path.resolve(import.meta.dirname, '../dist')

const app = express()
// Cloud Run はプロキシ経由でリクエストを渡すので、利用者のIPを正しく取るために必要
app.set('trust proxy', 1)
app.use(express.json({ limit: '10kb' }))

app.get('/api/config', (_req, res) => {
  res.json({ jevEnabled: isJevEnabled() })
})

// APIの使いすぎを防ぐため、同じIPからは1分あたり20回まで
const classifyLimiter = rateLimit({ windowMs: 60_000, limit: 20 })

app.post('/api/classify', classifyLimiter, async (req, res) => {
  if (!isJevEnabled()) {
    res.status(503).json({ error: 'Jev is not configured' })
    return
  }

  const text: unknown = req.body?.text
  if (typeof text !== 'string' || !text.trim() || text.length > MAX_TEXT_LENGTH) {
    res.status(400).json({ error: `text must be 1-${MAX_TEXT_LENGTH} characters` })
    return
  }

  try {
    res.json(await classifyTodo(text.trim()))
  } catch (err) {
    console.error('Jev request failed:', err)
    res.status(502).json({ error: 'Jev request failed' })
  }
})

app.use(express.static(distDir))
app.get('/{*path}', (_req, res) => {
  res.sendFile(path.join(distDir, 'index.html'))
})

app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT} (Jev: ${isJevEnabled() ? 'ON' : 'OFF'})`)
})
