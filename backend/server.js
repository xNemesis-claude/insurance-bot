require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const chatRouter = require('./routes/chat');
const leadsRouter = require('./routes/leads');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Serve frontend
app.use(express.static(path.join(__dirname, '../frontend')));

// API routes
app.use('/api/chat', chatRouter);
app.use('/api/leads', leadsRouter);

app.listen(PORT, () => {
  console.log(`✅ Сервер запущен: http://localhost:${PORT}`);
  console.log(`🏢 Компания: ${process.env.COMPANY_NAME || 'Страховая компания'}`);
});
