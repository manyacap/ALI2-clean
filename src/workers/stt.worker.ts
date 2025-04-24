/// <reference lib="webworker" />

import { expose } from 'comlink';

// Definir interface para el contexto del worker
interface WorkerContext extends Window {
  webkitSpeechRecognition?: typeof SpeechRecognition;
  SpeechRecognition?: typeof SpeechRecognition;
}

// Tipado para eventos de reconocimiento
interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
}

// Configurar contexto seguro
const ctx: WorkerContext & typeof globalThis = self as unknown as WorkerContext;

class STTWorker {
  private recognition: SpeechRecognition | null = null;
  private isListening = false;

  constructor() {
    try {
      this.setupRecognition();
    } catch (error) {
      ctx.postMessage({
        type: 'init-error',
        error: 'Navegador no compatible con Speech API'
      });
    }
  }

  private setupRecognition(): void {
    const SR = ctx.SpeechRecognition || ctx.webkitSpeechRecognition;
    
    if (!SR) {
      throw new Error('SpeechRecognition API no disponible');
    }

    this.recognition = new SR();
    this.recognition.lang = 'es-ES';
    this.recognition.interimResults = false;
    this.recognition.maxAlternatives = 1;
    this.recognition.continuous = false;

    this.recognition.onresult = (event: SpeechRecognitionEvent) => {
      const result = event.results[0][0];
      ctx.postMessage({
        type: 'transcript',
        data: result.transcript,
        confidence: result.confidence
      });
    };

    this.recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      ctx.postMessage({
        type: 'error',
        error: event.error,
        isFatal: this.isListening
      });
      this.isListening = false;
    };

    this.recognition.onend = () => {
      this.isListening = false;
    };
  }

  public start(): void {
    if (!this.recognition) return;
    
    if (!this.isListening) {
      this.recognition.start();
      this.isListening = true;
      ctx.postMessage({ type: 'status', status: 'listening' });
    }
  }

  public stop(): void {
    if (!this.recognition) return;
    
    if (this.isListening) {
      this.recognition.stop();
      this.isListening = false;
      ctx.postMessage({ type: 'status', status: 'idle' });
    }
  }

  public get status(): string {
    return this.isListening ? 'listening' : 'idle';
  }
}

// Exportar tipo para Comlink
export type STTWorkerType = InstanceType<typeof STTWorker>;

// Exponer usando el contexto tipado
expose(STTWorker, ctx);

