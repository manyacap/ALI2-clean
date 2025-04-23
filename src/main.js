// src/main.js
import fsm, { STATES } from './core/fsm.js';
import initSTT from '../stt.js';
import initTTS from '../tts.js';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

const recognition = initSTT(onTranscript, onSTTError);
const tts = initTTS();

async function startAssistant() {
  if (await fsm.transitionTo(STATES.LISTENING)) {
    recognition.start();
  }
}

function onTranscript(text) {
  fsm.transitionTo(STATES.PROCESSING)
     .then(() => processWithGPT(text));
}

async function processWithGPT(text) {
  // Lógica para llamar a tu función serverless /api/openai
  const resp = await fetch('/api/openai', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt: text })
  });
  const { reply } = await resp.json();
  await fsm.transitionTo(STATES.SPEAKING);
  await tts.speak(reply);
  fsm.transitionTo(STATES.IDLE);
}

function onSTTError(err) {
  console.error('[STT] Error:', err);
  fsm.transitionTo(STATES.IDLE);
}

document.getElementById('startBtn')
        .addEventListener('click', startAssistant);

fsm.init();
