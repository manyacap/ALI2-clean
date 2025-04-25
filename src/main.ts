// src/main.ts
import UI from './ui/index.js';
import { FsmController } from './core/fsm.js';
import { speak } from './tts.js';
import { STT } from './stt.js';

async function bootstrap() {
  // Inicializa FSM y UI
  const fsm = new FsmController();
  UI.init(fsm);

  // Configura STT sin worker
  let stt;
  try {
    stt = new STT();
  } catch (err) {
    console.error('STT init failed:', err);
    UI.showError('Reconocimiento de voz no soportado');
    return;
  }

  // Maneja resultados de reconocimiento
  stt.onResult(async (text) => {
    UI.addBubble('user', text);
    stt.stop();

    try {
      const aiResponse = await fsm.handle({ type: 'user_said', text });
      UI.addBubble('ai', aiResponse);
      await speak(aiResponse);
    } catch (e) {
      console.error('Error processing AI response:', e);
      UI.showError('Error procesando la IA');
    } finally {
      stt.start();
    }
  });

  // Conecta botones
  UI.onMicButton(() => stt.start());
  UI.onStopButton(() => stt.stop());
}

bootstrap();
