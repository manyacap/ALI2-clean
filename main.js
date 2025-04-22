// main.js - Alicia IA v7.2.0 mínimo funcional
console.log("Desplegando versión limpia v7.2.0");

import fsm, { STATES } from './fsm.core.js';
import tts from './tts.js';
import stt from './stt.js';

window.addEventListener('DOMContentLoaded', async () => {
  console.log('[Alicia] Iniciando main.js básico');

  await fsm.init();
  await tts.init();
  await stt.init();

  fsm.transitionTo(STATES.IDLE);

  const button = document.getElementById('main-button');
  const bubbles = document.getElementById('message-bubbles');

  button.addEventListener('click', async () => {
    const state = fsm.getState();
    if (state === STATES.IDLE) {
      showMessage('Escuchando...', 'system');
      await fsm.transitionTo(STATES.LISTENING);
      await stt.startListening();
    }
  });

  document.addEventListener('stt-result', async (event) => {
    const { transcript } = event.detail;
    showMessage(transcript, 'user');
    await fsm.transitionTo(STATES.SPEAKING);
    await tts.speak("Entendido: " + transcript);
    fsm.transitionTo(STATES.IDLE);
  });

  function showMessage(text, type) {
    const div = document.createElement('div');
    div.className = `message-bubble ${type}`;
    div.textContent = text;
    bubbles.appendChild(div);
    bubbles.scrollTop = bubbles.scrollHeight;
  }
});


