// main.js - Integración FSM y flujos básicos de Alicia IA (v7.2.1)

// Importar Supabase desde CDN para compatibilidad directa en navegador móvil/PWA
import { createClient } from 'https://esm.sh/@supabase/supabase-js';
import fsmController from './core/fsm/fsm.js';
import { startRecognition, stopRecognition } from './stt.js';
import { speakText } from './tts.js';
import { renderUserMessage, renderAliciaMessage, setupUI } from './ui.js';
import { chatWithGPT } from './openai.js';

// Configuración Supabase inyectada globalmente
const { SUPABASE_URL, SUPABASE_KEY } = window.APP_CONFIG;
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

/**
 * Maneja el resultado de STT y orquesta el flujo de entrada de usuario.
 */
function handleSpeechResult(error, transcript) {
  if (error) {
    console.error('STT Error:', error);
    fsmController.transition('processing_error').catch(console.error);
    return;
  }

  stopRecognition();
  processUserInput(transcript).catch(console.error);
}

/**
 * Procesa el texto de usuario: FSM → GPT → TTS → UI
 */
async function processUserInput(text) {
  renderUserMessage(text);

  fsmController.setContext({ userInput: text, isListening: false });
  await fsmController.transition('user_input');

  const response = await chatWithGPT(text);
  fsmController.setContext({ response });

  await fsmController.transition('response_ready');
  await speakText(response);
  await fsmController.transition('speaking_complete');

  renderAliciaMessage(response);
  startRecognition(handleSpeechResult);
}

/**
 * Punto de entrada principal de la aplicación
 */
async function main() {
  try {
    await fsmController.init();
  } catch (err) {
    console.error('FSM init failed:', err);
    return;
  }

  setupUI({
    onActivate: async () => {
      try {
        await fsmController.transition('user_activate');
        startRecognition(handleSpeechResult);
      } catch (e) {
        console.error('Activate transition failed:', e);
      }
    },
    onConfirmOrder: async () => {
      try {
        await fsmController.transition('user_confirms');
      } catch (e) {
        console.error('Confirm transition failed:', e);
      }
    },
    onCancel: async () => {
      try {
        await fsmController.transition('user_cancels');
      } catch (e) {
        console.error('Cancel transition failed:', e);
      }
    }
  });
}

main().catch(err => console.error('Error en main:', err));

