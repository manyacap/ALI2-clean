import { expose } from 'comlink';

const ctx: any = self;

class STTWorker {
  private rec: any;
  private listening = false;

  constructor() {
    this.setup();
  }

  private setup() {
    const g: any = typeof self !== 'undefined' ? self : globalThis;
    const SR = g.SpeechRecognition || g.webkitSpeechRecognition;
    if (!SR) throw new Error('SpeechRecognition no soportada');

    this.rec = new SR();
    this.rec.lang = 'es-ES';
    this.rec.interimResults = false;
    this.rec.maxAlternatives = 1;

    this.rec.onresult = (e: any) =>
      ctx.postMessage({ type: 'transcript', data: e.results[0][0].transcript });
    this.rec.onerror = (e: any) => ctx.postMessage({ type: 'error', error: e.error });
  }

  public start() {
    if (!this.listening) {
      this.rec.start();
      this.listening = true;
    }
  }

  public stop() {
    if (this.listening) {
      this.rec.stop();
      this.listening = false;
    }
  }
}

expose(STTWorker, ctx);
