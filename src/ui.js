export function renderUserMessage(text) {
  const m = document.createElement('div');
  m.className = 'message user';
  m.textContent = text;
  document.getElementById('messages').append(m);
}

export function renderBotMessage(text) {
  const m = document.createElement('div');
  m.className = 'message bot';
  m.textContent = text;
  document.getElementById('messages').append(m);
}
