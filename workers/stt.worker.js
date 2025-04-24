/// <reference lib="webworker" />
import { expose } from 'comlink';

class STTWorker {
  private recognition: SpeechRecognition;
  private isListening = false;

  constructor() {
    this.setupRecognition();
  }

  private setupRecognition() {
    const globalScope = self as any;
    const SR = globalScope.SpeechRecognition || globalScope.webkitSpeechRecognition;
    if (!SR) throw new Error('SpeechRecognition no soportada');

    this.recognition = new SR();
    this.recognition.lang = 'es-ES';
    this.recognition.interimResults = false;
    this.recognition.maxAlternatives = 1;

    this.recognition.onresult = (ev: SpeechRecognitionEvent) => {
      (self as DedicatedWorkerGlobalScope).postMessage({ type: 'transcript', data: ev.results[0][0].transcript });
    };
    this.recognition.onerror = (ev: any) => {
      (self as DedicatedWorkerGlobalScope).postMessage({ type: 'error', error: ev.error });
    };
  }

  public start() {
    if (!this.isListening) {
      this.recognition.start();
      this.isListening = true;
    }
  }

  public stop() {
    if (this.isListening) {
      this.recognition.stop();
      this.isListening = false;
    }
  }
}

expose(STTWorker);
