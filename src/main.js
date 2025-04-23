// main.js - Integración FSM y flujos básicos de Alicia IA (v7.2.1)

import { createClient } from '@supabase/supabase-js';
import fsmController from './core/fsm/fsm.js';
import { startRecognition, stopRecognition } from './stt.js';
import { speakText } from './tts.js';
import { renderUserMessage, renderAliciaMessage, setupUI } from './ui.js';
import { chatWithGPT } from './openai.js';

// Configuración Supabase (variables de entorno en Railway)
const SUPABASE_URL = import.meta.env.SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.SUPABASE_ANON_KEY;
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Procesar input del usuario y orquestar la FSM + GPT + TTS
async function processUserInput(text) {
  // Renderizar mensaje de usuario
  renderUserMessage(text);

  // Transición: USER_INPUT
  fsmController.setContext({ userInput: text });
  await fsmController.transition('user_input');

  // Llamar a GPT para generar respuesta
  const response = await chatWithGPT(text);
  fsmController.setContext({ response });

  // Transición: RESPONSE_READY
  await fsmController.transition('response_ready');

  // Sintetizar voz
  await speakText(response);

  // Transición: SPEAKING_COMPLETE
  await fsmController.transition('speaking_complete');

  // Renderizar mensaje de Alicia
  renderAliciaMessage(response);
}

// Inicialización general de la aplicación
async function main() {
  // Inicializar FSM
  await fsmController.init();

  // Configurar UI y callbacks
  setupUI({
    onActivate: () => fsmController.transition('user_activate'),
    onSpeechResult: async (transcript) => {
      stopRecognition();
      await processUserInput(transcript);
    },
    onConfirmOrder: () => fsmController.transition('user_confirms'),
    onCancel: () => fsmController.transition('user_cancels')
  });

  // Escuchar comandos por voz
  startRecognition((error, transcript) => {
    if (error) {
      console.error('STT Error:', error);
      fsmController.transition('processing_error');
      return;
    }
    setupUI().onSpeechResult(transcript);
  });
}

// Ejecutar
main().catch(err => console.error('Error en main:', err));
