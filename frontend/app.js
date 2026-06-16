const API_URL = '/api/chat/message';
const LEADS_URL = '/api/leads/callback';
const TRACK_URL = '/api/leads/track';
const sessionId = 'session_' + Math.random().toString(36).slice(2);

const messagesEl = document.getElementById('messages');
const inputEl = document.getElementById('user-input');
const sendBtn = document.getElementById('send-btn');
const quickActions = document.getElementById('quick-actions');

function addMessage(text, role) {
  const div = document.createElement('div');
  div.className = `message ${role}`;
  if (role === 'bot') {
    const avatar = document.createElement('div');
    avatar.className = 'avatar';
    avatar.textContent = '🛡️';
    div.appendChild(avatar);
  }
  const bubble = document.createElement('div');
  bubble.className = 'bubble';
  bubble.innerHTML = text.replace(/\n/g, '<br>').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  div.appendChild(bubble);
  messagesEl.appendChild(div);
  messagesEl.scrollTop = messagesEl.scrollHeight;
  return div;
}

function showTyping() {
  const div = document.createElement('div');
  div.className = 'message bot typing';
  div.id = 'typing-indicator';
  div.innerHTML = '<div class="avatar">🛡️</div><div class="bubble"><div class="dot"></div><div class="dot"></div><div class="dot"></div></div>';
  messagesEl.appendChild(div);
  messagesEl.scrollTop = messagesEl.scrollHeight;
}

function hideTyping() {
  const el = document.getElementById('typing-indicator');
  if (el) el.remove();
}

async function sendMessage() {
  const text = inputEl.value.trim();
  if (!text) return;

  inputEl.value = '';
  inputEl.style.height = 'auto';
  sendBtn.disabled = true;
  quickActions.style.display = 'none';

  addMessage(text, 'user');
  showTyping();

  // Track question
  fetch(TRACK_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ question: text }),
  }).catch(() => {});

  try {
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: text, sessionId }),
    });

    const data = await res.json();
    hideTyping();

    if (data.reply) {
      addMessage(data.reply, 'bot');
    } else {
      addMessage('Извините, произошла ошибка. Попробуйте ещё раз.', 'bot');
    }
  } catch {
    hideTyping();
    addMessage('Нет соединения с сервером. Проверьте подключение.', 'bot');
  }

  sendBtn.disabled = false;
  inputEl.focus();
}

function sendQuick(text) {
  inputEl.value = text;
  sendMessage();
}

function handleKey(e) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
}

inputEl.addEventListener('input', () => {
  inputEl.style.height = 'auto';
  inputEl.style.height = Math.min(inputEl.scrollHeight, 100) + 'px';
});

// ── Callback modal ──────────────────────────────────────────

function openCallback() {
  document.getElementById('callback-modal').style.display = 'flex';
  document.getElementById('cb-name').focus();
}

function closeCallback() {
  document.getElementById('callback-modal').style.display = 'none';
  document.getElementById('cb-name').value = '';
  document.getElementById('cb-phone').value = '';
  document.getElementById('cb-error').textContent = '';
}

async function submitCallback() {
  const name = document.getElementById('cb-name').value.trim();
  const phone = document.getElementById('cb-phone').value.trim();
  const errorEl = document.getElementById('cb-error');

  if (!name || !phone) {
    errorEl.textContent = 'Пожалуйста, заполните все поля';
    return;
  }

  const btn = document.getElementById('cb-submit');
  btn.disabled = true;
  btn.textContent = 'Отправляем...';

  try {
    const res = await fetch(LEADS_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, phone }),
    });

    if (res.ok) {
      closeCallback();
      addMessage(`Спасибо, <strong>${name}</strong>! 📞<br><br>Мы получили вашу заявку и перезвоним на номер <strong>${phone}</strong> в течение рабочего часа.<br><br>Режим работы: Пн–Пт 09:00–18:00`, 'bot');
    } else {
      errorEl.textContent = 'Ошибка. Попробуйте ещё раз.';
    }
  } catch {
    errorEl.textContent = 'Нет соединения. Позвоните нам: +374 10 59-21-21';
  }

  btn.disabled = false;
  btn.textContent = 'Отправить заявку';
}

// Close modal on backdrop click
document.getElementById('callback-modal')?.addEventListener('click', function(e) {
  if (e.target === this) closeCallback();
});
