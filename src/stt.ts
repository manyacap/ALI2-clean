// src/stt.ts
export class STT {
  private recognition: SpeechRecognition;
  private resultCallback?: (transcript: string) => void;

  constructor() {
    const ctor = (window.SpeechRecognition || window.webkitSpeechRecognition) as any;
    this.recognition = new ctor();
    this.recognition.lang = 'es-ES';
    this.recognition.interimResults = false;
    this.recognition.maxAlternatives = 1;

    this.recognition.onresult = (ev: SpeechRecognitionEvent) => {
      const transcript = ev.results[0][0].transcript;
      this.resultCallback?.(transcript);
    };

    this.recognition.onerror = (ev: SpeechRecognitionErrorEvent) => {
      console.error('STT error', ev.error);
    };
  }

  /**
   * Registra un callback para recibir el texto transcrito.
   */
  onResult(callback: (transcript: string) => void): void {
    this.resultCallback = callback;
  }

  /**
   * Inicia la escucha del micrófono.
   */
  start(): void {
    this.recognition.start();
  }

  /**
   * Detiene la escucha del micrófono.
   */
  stop(): void {
    this.recognition.stop();
  }
}
