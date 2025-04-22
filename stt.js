/**
 * stt.js - Speech-to-Text para Alicia IA v7.2.0
 */

import fsm, { STATES } from './fsm.js';

class SpeechRecognizer {
  constructor() {
    this.recognition = null;
    this.isListening = false;
    this.retryCount = 0;
    this.maxRetries = 3;
  }

  /**
   * Inicializa el reconocimiento de voz
   */
  async init() {
    try {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      
      if (!SpeechRecognition) {
        console.error('[STT] API no soportada en este navegador');
        return false;
      }
      
      this.recognition = new SpeechRecognition();
      this.recognition.lang = 'es-ES';
      this.recognition.continuous = false;
      this.recognition.interimResults = true;
      
      this._setupEventListeners();
      console.log('[STT] Inicializado correctamente');
      return true;
    } catch (error) {
      console.error('[STT] Error de inicialización:', error);
      return false;
    }
  }

  /**
   * Configura los event listeners del reconocimiento
   */
  _setupEventListeners() {
    this.recognition.onstart = () => {
      console.log('[STT] Reconocimiento iniciado');
      this.isListening = true;
      document.dispatchEvent(new CustomEvent('stt-start'));
    };

    this.recognition.onresult = (event) => {
      const result = event.results[0];
      const transcript = result[0].transcript;
      const confidence = result[0].confidence;
      const isFinal = result.isFinal;
      
      if (isFinal) {
        console.log(`[STT] Reconocimiento final: "${transcript}"`);
        this.retryCount = 0; // Resetear contador en éxito
        document.dispatchEvent(new CustomEvent('stt-result', { 
          detail: { transcript, confidence } 
        }));
      } else {
        // Resultados interinos
        document.dispatchEvent(new CustomEvent('stt-interim', { 
          detail: { transcript } 
        }));
      }
    };

    this.recognition.onerror = (event) => {
      console.error(`[STT] Error: ${event.error}`);
      
      let errorType = event.error;
      let shouldRetry = this.retryCount < this.maxRetries;
      
      switch (event.error) {
        case 'no-speech':
          errorType = 'no-speech';
          break;
        case 'aborted':
          errorType = 'aborted';
          shouldRetry = false;
          break;
        case 'not-allowed':
          errorType = 'permission-denied';
          shouldRetry = false;
          break;
        default:
          errorType = 'error-desconocido';
      }
      
      document.dispatchEvent(new CustomEvent('stt-error', { 
        detail: { error: errorType } 
      }));
      
      if (shouldRetry && fsm.getState() === STATES.LISTENING) {
        this._retryListen();
      } else if (fsm.getState() === STATES.LISTENING) {
        fsm.transitionTo(STATES.IDLE);
      }
    };

    this.recognition.onend = () => {
      console.log('[STT] Reconocimiento finalizado');
      this.isListening = false;
      document.dispatchEvent(new CustomEvent('stt-end'));
    };
  }

  /**
   * Inicia el reconocimiento de voz
   */
  async startListening() {
    if (this.isListening) {
      console.warn('[STT] Ya está escuchando');
      return false;
    }
    
    try {
      this.recognition.start();
      this.retryCount = 0;
      return true;
    } catch (error) {
      console.error('[STT] Error iniciando reconocimiento:', error);
      
      if (error.name === 'InvalidStateError') {
        // Manejar error "already started"
        try {
          this.recognition.stop();
          setTimeout(() => this.recognition.start(), 100);
          return true;
        } catch (err) {
          console.error('[STT] Error durante reinicio:', err);
          return false;
        }
      }
      
      return false;
    }
  }

  /**
   * Detiene el reconocimiento de voz
   */
  stopListening() {
    if (this.isListening) {
      try {
        this.recognition.stop();
      } catch (error) {
        console.error('[STT] Error deteniendo reconocimiento:', error);
      }
    }
  }

  /**
   * Reintenta escuchar después de error
   */
  _retryListen() {
    this.retryCount++;
    console.log(`[STT] Reintento ${this.retryCount}/${this.maxRetries}`);
    
    // Usar delays incrementales para reintentos
    const delay = this.retryCount * 300;
    
    setTimeout(() => {
      if (fsm.getState() === STATES.LISTENING) {
        this.startListening();
      }
    }, delay);
  }
}

// Singleton
const stt = new SpeechRecognizer();
export default stt;
