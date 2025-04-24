import UI from './ui';
import { FsmController } from './core/fsm';
import { speak } from './tts';
import { STT } from './stt';

async function bootstrap() {
  // Inicializa FSM y UI
  const fsm = new FsmController();
  UI.init(fsm);

  // Configura reconocimiento de voz
  let stt: STT;
  try {
    stt = new STT();
  } catch (err) {
    console.error('STT initialization failed:', err);
    UI.showError('Reconocimiento de voz no soportado');
    return;
  }

  // Maneja resultados de STT
  stt.onResult(async (text: string) => {
    console.log('User said:', text);
    UI.addBubble('user', text);

    // Detén escucha mientras procesas
    stt.stop();

    try {
      // Envía al FSM / GPT y obtiene respuesta
      const aiResponse = await fsm.handle({ type: 'user_said', text });
      console.log('AI response:', aiResponse);
      UI.addBubble('ai', aiResponse);
      await speak(aiResponse);
    } catch (err) {
      console.error('Error processing AI response:', err);
      UI.showError('Error al procesar la respuesta de la IA');
    } finally {
      // Reinicia escucha
      stt.start();
    }
  });

  // Conecta botones de la UI
  UI.onMicButton(() => {
    console.log('Mic button clicked');
    stt.start();
  });

  UI.onStopButton(() => {
    console.log('Stop button clicked');
    stt.stop();
  });
}
