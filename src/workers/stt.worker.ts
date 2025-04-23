/// <reference lib="webworker" />
import { expose } from 'comlink';

const ctx: Worker = self as any;

class STTWorker {
  private recognition: any;
  private isListening = false;

  constructor() {
    this.setupRecognition();
  }

  private setupRecognition() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      throw new Error('Speech API no soportada');
    }

    this.recognition = new SpeechRecognition();
    this.recognition.lang = 'es-ES';
    this.recognition.interimResults = false;
    this.recognition.maxAlternatives = 1;

    this.recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      ctx.postMessage({ type: 'transcript', data: transcript });
    };

    this.recognition.onerror = (event: any) => {
      ctx.postMessage({ type: 'error', error: event.error });
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

expose(STTWorker, ctx);
