const express = require('express');
const router = express.Router();

// In-memory storage (resets on server restart — for production use a database)
const leads = [];
let totalMessages = 0;
const questionStats = new Map();

router.post('/callback', (req, res) => {
  const { name, phone } = req.body;
  if (!name || !phone) {
    return res.status(400).json({ error: 'Имя и телефон обязательны' });
  }

  const lead = {
    id: leads.length + 1,
    name,
    phone,
    createdAt: new Date().toISOString(),
  };

  leads.push(lead);
  console.log(`📞 Новая заявка: ${name} — ${phone}`);
  res.json({ ok: true });
});

router.post('/track', (req, res) => {
  const { question } = req.body;
  totalMessages++;
  if (question) {
    const key = question.slice(0, 60);
    questionStats.set(key, (questionStats.get(key) || 0) + 1);
  }
  res.json({ ok: true });
});

router.get('/stats', (req, res) => {
  const adminKey = process.env.ADMIN_KEY;
  if (!adminKey || req.query.key !== adminKey) {
    return res.status(401).json({ error: 'Доступ запрещён' });
  }

  const topQuestions = [...questionStats.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([q, count]) => ({ question: q, count }));

  res.json({
    totalMessages,
    totalLeads: leads.length,
    leads: leads.slice().reverse(),
    topQuestions,
  });
});

module.exports = router;
