const express = require('express');
const Anthropic = require('@anthropic-ai/sdk');
const { SYSTEM_PROMPT } = require('../prompts/insurance');

const router = express.Router();
const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// In-memory conversation store (keyed by sessionId)
const sessions = new Map();

// Simple rate limiter: max 30 requests per IP per minute
const rateLimiter = new Map();
function checkRateLimit(ip) {
  const now = Date.now();
  const window = 60_000;
  const max = 30;
  if (!rateLimiter.has(ip)) rateLimiter.set(ip, []);
  const timestamps = rateLimiter.get(ip).filter(t => now - t < window);
  timestamps.push(now);
  rateLimiter.set(ip, timestamps);
  return timestamps.length <= max;
}

router.post('/message', async (req, res) => {
  const ip = req.ip || req.connection.remoteAddress;
  if (!checkRateLimit(ip)) {
    return res.status(429).json({ error: 'Слишком много запросов. Подождите минуту.' });
  }

  const { message, sessionId } = req.body;

  if (!message || !sessionId) {
    return res.status(400).json({ error: 'message и sessionId обязательны' });
  }

  if (message.length > 1000) {
    return res.status(400).json({ error: 'Сообщение слишком длинное.' });
  }

  if (!sessions.has(sessionId)) {
    sessions.set(sessionId, []);
  }

  const history = sessions.get(sessionId);
  history.push({ role: 'user', content: message });

  // Keep last 20 messages to avoid token overflow
  const recentHistory = history.slice(-20);

  try {
    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages: recentHistory,
    });

    const reply = response.content[0].text;
    history.push({ role: 'assistant', content: reply });

    res.json({ reply, sessionId });
  } catch (err) {
    console.error('Claude API error:', err.message);
    res.status(500).json({ error: 'Ошибка при обращении к AI. Попробуйте позже.' });
  }
});

router.delete('/session/:sessionId', (req, res) => {
  sessions.delete(req.params.sessionId);
  res.json({ ok: true });
});

module.exports = router;
