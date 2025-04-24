import { wrap } from 'comlink';
import { FsmController } from './core/fsm';
import UI from './ui';
import { speak } from './tts';

async function bootstrap() {
  // 1) Inicializa FSM y UI
  const fsm = new FsmController();
  UI.init(fsm);

  // 2) Crea y envuelve el STT Worker
  const worker = new Worker(
    new URL('../workers/stt.worker.ts', import.meta.url),
    { type: 'module' }
  );
  const STT = wrap<typeof import('../workers/stt.worker').STTWorker>(worker);
  const stt = await new STT();

  // 3) Escucha eventos de transcripción y procesalos
  worker.addEventListener('message', async ev => {
    if (ev.data.type === 'transcript') {
      const userText = ev.data.data as string;
      console.log('User:', userText);

      // Envía al FSM/GPT y espera respuesta
      const aiResponse = await fsm.handle({ type: 'user_said', text: userText });
      console.log('AI:', aiResponse);

      // Muestra burbuja y habla la respuesta
      UI.addBubble('ai', aiResponse);
      await speak(aiResponse);

      // Vuelve a escuchar
      stt.start();
    }
    if (ev.data.type === 'error') {
      console.error('STT error:', ev.data.error);
    }
  });

  // 4) Conecta los botones de la UI
  UI.onMicButton(() => stt.start());
  UI.onStopButton(() => stt.stop());
}

bootstrap();
