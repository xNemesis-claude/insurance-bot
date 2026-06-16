const API_URL = '/api/chat/message';
const sessionId = 'session_' + Math.random().toString(36).slice(2);

const messagesEl = document.getElementById('messages');
const inputEl = document.getElementById('user-input');
const sendBtn = document.getElementById('send-btn');
const quickActions = document.getElementById('quick-actions');

function addMessage(text, role) {
  const div = document.createElement('div');
  div.className = `message ${role}`;
  const bubble = document.createElement('div');
  bubble.className = 'bubble';
  bubble.innerHTML = text.replace(/\n/g, '<br>');
  div.appendChild(bubble);
  messagesEl.appendChild(div);
  messagesEl.scrollTop = messagesEl.scrollHeight;
  return div;
}

function showTyping() {
  const div = document.createElement('div');
  div.className = 'message bot typing';
  div.id = 'typing-indicator';
  div.innerHTML = '<div class="bubble"><div class="dot"></div><div class="dot"></div><div class="dot"></div></div>';
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

// Auto-resize textarea
inputEl.addEventListener('input', () => {
  inputEl.style.height = 'auto';
  inputEl.style.height = Math.min(inputEl.scrollHeight, 120) + 'px';
});
