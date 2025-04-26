import UI, { Role } from './ui.js';
import { STT } from './stt.js';
import * as tts from './tts.js';
import FsmController from './core/fsm.js';

/**
 * Muestra y registra errores en la UI.
 */
function showError(message: string): void {
  console.error(message);
  UI.addBubble('assistant', `❌ ${message}`);
}

(async () => {
  // Instancias de FSM y reconocimiento de voz
  const fsm = new FsmController();
  const recognizer = new STT();

  // Inicia la UI
  UI.clearChat();
  UI.addBubble('assistant', 'Hola, soy Alicia. ¿En qué puedo ayudarte?');

  // Botones de micrófono y paro
  const micBtn = document.getElementById('mic-btn');
  const stopBtn = document.getElementById('stop-btn');
  if (micBtn && stopBtn) {
    micBtn.addEventListener('click', () => recognizer.start());
    stopBtn.addEventListener('click', () => recognizer.stop());
  } else {
    showError('Botones de micrófono o detener no encontrados');
  }

  // Maneja el resultado de STT
  recognizer.onResult(async (transcript: string) => {
    UI.addBubble('user', transcript);
    UI.showLoading();

    try {
      const aiResponse = await fsm.handle({ type: 'user_said', text: transcript });
      UI.hideLoading();
      UI.addBubble('assistant', aiResponse);
      tts.speak(aiResponse);
    } catch {
      UI.hideLoading();
      showError('Error procesando la IA');
    }
  });
})();
