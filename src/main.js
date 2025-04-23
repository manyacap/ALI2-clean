// src/main.js
import fsm, { STATES } from './core/fsm.js';
import initSTT from './stt.js';
import initTTS from './tts.js';
// Cargamos Supabase desde un CDN ESM para que funcione en el navegador
import { createClient } from 'https://esm.sh/@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

const recognition = initSTT(onTranscript, onSTTError);
const tts = initTTS();

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('startBtn')
          .addEventListener('click', startAssistant);
  fsm.init();
});

async function startAssistant() {
  if (await fsm.transitionTo(STATES.LISTENING)) {
    recognition.start();
  }
}

async function onTranscript(text) {
  if (!await fsm.transitionTo(STATES.PROCESSING)) return;
  await processWithGPT(text);
}

async function processWithGPT(text) {
  try {
    const res = await fetch('/api/openai', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: text })
    });
    const { reply } = await res.json();

    if (await fsm.transitionTo(STATES.SPEAKING)) {
      await tts.speak(reply);
    }
  } catch (err) {
    console.error('[GPT] Error:', err);
  } finally {
    fsm.transitionTo(STATES.IDLE);
  }
}

function onSTTError(err) {
  console.error('[STT] Error:', err);
  fsm.transitionTo(STATES.IDLE);
}
