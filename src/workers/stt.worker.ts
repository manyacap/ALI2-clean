// src/workers/stt.worker.ts
/// <reference lib="webworker" />

import { expose } from 'comlink';

declare const self: any;
declare const SpeechRecognition: any;
declare const webkitSpeechRecognition: any;

class STTWorker {
  private recognition: any;
  private isListening = false;

  constructor() {
    this.setupRecognition();
  }

  private setupRecognition() {
    const SR = SpeechRecognition || webkitSpeechRecognition;
    if (!SR) {
      throw new Error('SpeechRecognition no soportada en este entorno');
    }

    this.recognition = new SR();
    this.recognition.lang = 'es-ES';
    this.recognition.interimResults = false;
    this.recognition.maxAlternatives = 1;

    this.recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      self.postMessage({ type: 'transcript', data: transcript });
    };

    this.recognition.onerror = (event: any) => {
      self.postMessage({ type: 'error', error: event.error });
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

// Exponer la clase al exterior del worker utilizando el global 'self'
expose(STTWorker, self);



