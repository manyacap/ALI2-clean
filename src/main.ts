// src/main.ts
import UI from './ui.ts';
import { FsmController } from './core/fsm.ts';
import { speak } from './tts.ts';
import { STT } from './stt.ts';

async function bootstrap() {
  const fsm = new FsmController();
  UI.init(fsm);

  let stt: STT;
  try {
    stt = new STT();
  } catch (err) {
    console.error('STT init failed:', err);
    UI.showError('Reconocimiento de voz no soportado');
    return;
  }

  stt.onResult(async (text: string) => {
    UI.addBubble('user', text);
    stt.stop();

    try {
      const aiResponse = await fsm.handle({ type: 'user_said', text });
      UI.addBubble('ai', aiResponse);
      await speak(aiResponse);
    } catch (e) {
      console.error('Error procesando la IA:', e);
      UI.showError('Error procesando la IA');
    } finally {
      stt.start();
    }
  });

  UI.onMicButton(() => stt.start());
  UI.onStopButton(() => stt.stop());
}

// Registra el Service Worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then(reg => console.log('SW registered with scope:', reg.scope))
      .catch(err => console.error('SW registration failed:', err));
  });
}

bootstrap();

