// src/stt.ts
export class STT {
  private recognition: SpeechRecognition;
  private isListening = false;

  constructor() {
    const globalScope = window as any;
    const SR = globalScope.SpeechRecognition || globalScope.webkitSpeechRecognition;
    if (!SR) {
      throw new Error('SpeechRecognition no soportada');
    }
    this.recognition = new SR();
    this.recognition.lang = 'es-ES';
    this.recognition.interimResults = false;
    this.recognition.maxAlternatives = 1;
  }

  /** Registra un callback que recibe cada transcripción finalizada */
  public onResult(callback: (text: string) => void): void {
    this.recognition.onresult = (ev: SpeechRecognitionEvent) => {
      const transcript = ev.results[0][0].transcript;
      callback(transcript);
    };
    this.recognition.onerror = (ev: SpeechRecognitionErrorEvent) => {
      console.error('STT error:', ev.error);
    };
  }

  /** Inicia la escucha de voz */
  public start(): void {
    if (!this.isListening) {
      this.recognition.start();
      this.isListening = true;
    }
  }

  /** Detiene la escucha de voz */
  public stop(): void {
    if (this.isListening) {
      this.recognition.stop();
      this.isListening = false;
    }
  }
}
