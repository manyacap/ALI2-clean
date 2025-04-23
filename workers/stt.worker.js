// Importar polyfills para Safari
importScripts('https://unpkg.com/@babel/polyfill@7.12.1/dist/polyfill.min.js');

class STTProcessor {
  constructor() {
    this.recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
    this.configure();
  }

  configure() {
    this.recognition.continuous = true;
    this.recognition.interimResults = true;
    this.recognition.lang = 'es-ES';
    
    this.recognition.onresult = (event) => {
      const transcript = Array.from(event.results)
        .map(result => result[0].transcript)
        .join('');
      self.postMessage({ type: 'transcript', data: transcript });
    };
  }

  start() { this.recognition.start(); }
  stop() { this.recognition.stop(); }
}

const processor = new STTProcessor();

self.onmessage = (e) => {
  if (e.data === 'start') processor.start();
  if (e.data === 'stop') processor.stop();
};
