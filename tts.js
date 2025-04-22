/**
 * tts.js - Text-to-Speech para Alicia IA v7.2.0
 */

class TextToSpeech {
  constructor() {
    this.synth = window.speechSynthesis;
    this.isSpeaking = false;
    this.cache = new Map();
    this.cacheLimit = 5;
    this.serverlessEndpoint = '/tts';
    this.preferredVoice = 'es-ES-Neural2-C';
    this.timeout = 3000; // 3s timeout para serverless
    this.fallbackVoice = null;
    
    // Cargar caché desde localStorage
    this._loadCache();
  }

  /**
   * Inicializa el TTS
   */
  async init() {
    try {
      if (!this.synth) {
        console.error('[TTS] Síntesis de voz no soportada');
        return false;
      }
      
      // Encontrar voz en español para fallback
      await this._loadVoices();
      
      console.log('[TTS] Inicializado correctamente');
      return true;
    } catch (error) {
      console.error('[TTS] Error de inicialización:', error);
      return false;
    }
  }

  /**
   * Carga las voces disponibles
   */
  async _loadVoices() {
    return new Promise((resolve) => {
      const loadVoicesList = () => {
        const voices = this.synth.getVoices();
        
        if (voices.length > 0) {
          // Encontrar voz en español para fallback
          this.fallbackVoice = voices.find(voice => voice.lang === 'es-ES') || 
                               voices.find(voice => voice.lang.startsWith('es')) || 
                               voices[0];
          
          console.log(`[TTS] Voz fallback: ${this.fallbackVoice.name} (${this.fallbackVoice.lang})`);
          resolve();
        } else {
          setTimeout(loadVoicesList, 100);
        }
      };
      
      if (this.synth.getVoices().length > 0) {
        loadVoicesList();
      } else {
        this.synth.onvoiceschanged = loadVoicesList;
        setTimeout(loadVoicesList, 1000); // Fallback
      }
    });
  }

  /**
   * Reproduce texto usando el método preferido con fallback
   */
  async speak(text) {
    if (!text) {
      console.warn('[TTS] Texto vacío, nada que decir');
      return false;
    }
    
    if (this.isSpeaking) {
      this.stop();
    }
    
    this.isSpeaking = true;
    document.dispatchEvent(new CustomEvent('tts-start', { detail: { text } }));
    
    try {
      // Intentar usar Google TTS via serverless
      const serverlessResult = await this._useServerlessTTS(text);
      
      if (serverlessResult) {
        console.log('[TTS] TTS Serverless exitoso');
        return true;
      }
      
      // Fallback a Web Speech API
      console.log('[TTS] Usando fallback a TTS del navegador');
      return await this._useBrowserTTS(text);
    } catch (error) {
      console.error('[TTS] Error durante síntesis:', error);
      this.isSpeaking = false;
      document.dispatchEvent(new CustomEvent('tts-error', { detail: { error } }));
      return false;
    }
  }

  /**
   * Usa la función serverless para TTS
   */
  async _useServerlessTTS(text) {
    try {
      // Verificar caché primero
      const cachedAudio = this._getFromCache(text);
      if (cachedAudio) {
        console.log('[TTS] Usando audio en caché');
        await this._playAudio(cachedAudio);
        return true;
      }
      
      // Race entre fetch y timeout
      const audioBlob = await Promise.race([
        this._fetchTTS(text),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), this.timeout))
      ]);
      
      // Guardar en caché
      this._addToCache(text, audioBlob);
      
      // Reproducir audio
      await this._playAudio(audioBlob);
      return true;
    } catch (error) {
      console.warn('[TTS] TTS Serverless falló:', error);
      return false;
    }
  }

  /**
   * Fetch TTS desde función serverless
   */
  async _fetchTTS(text) {
    const response = await fetch(this.serverlessEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text,
        voice: this.preferredVoice
      })
    });
    
    if (!response.ok) {
      throw new Error(`Error TTS serverless: ${response.status}`);
    }
    
    return await response.blob();
  }

  /**
   * Reproduce un blob de audio
   */
  async _playAudio(audioBlob) {
    return new Promise((resolve, reject) => {
      const audio = new Audio();
      const objectUrl = URL.createObjectURL(audioBlob);
      
      audio.src = objectUrl;
      audio.onended = () => {
        URL.revokeObjectURL(objectUrl);
        this.isSpeaking = false;
        document.dispatchEvent(new CustomEvent('tts-end'));
        resolve();
      };
      
      audio.onerror = (error) => {
        URL.revokeObjectURL(objectUrl);
        this.isSpeaking = false;
        document.dispatchEvent(new CustomEvent('tts-error', { detail: { error } }));
        reject(error);
      };
      
      audio.play().catch(reject);
    });
  }

  /**
   * Usa la API Web Speech para TTS
   */
  async _useBrowserTTS(text) {
    return new Promise((resolve) => {
      try {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.voice = this.fallbackVoice;
        utterance.rate = 1.0;
        utterance.pitch = 1.0;
        utterance.volume = 1.0;
        utterance.lang = 'es-ES';
        
        utterance.onend = () => {
          this.isSpeaking = false;
          document.dispatchEvent(new CustomEvent('tts-end'));
          resolve(true);
        };
        
        utterance.onerror = (error) => {
          console.error('[TTS] Error TTS navegador:', error);
          this.isSpeaking = false;
          document.dispatchEvent(new CustomEvent('tts-error', { detail: { error } }));
          resolve(false);
        };
        
        this.synth.speak(utterance);
      } catch (error) {
        console.error('[TTS] Error TTS navegador:', error);
        this.isSpeaking = false;
        document.dispatchEvent(new CustomEvent('tts-error', { detail: { error } }));
        resolve(false);
      }
    });
  }

  /**
   * Detiene la síntesis
   */
  stop() {
    if (this.isSpeaking) {
      this.synth.cancel();
      this.isSpeaking = false;
      document.dispatchEvent(new CustomEvent('tts-stop'));
    }
  }

  /**
   * Obtiene ítem desde caché
   */
  _getFromCache(text) {
    return this.cache.get(text) || null;
  }

  /**
   * Añade ítem a caché
   */
  _addToCache(text, audioBlob) {
    // Limitar tamaño de caché
    if (this.cache.size >= this.cacheLimit) {
      const oldestKey = this.cache.keys().next().value;
      this.cache.delete(oldestKey);
    }
    
    this.cache.set(text, audioBlob);
    this._saveCache();
  }

  /**
   * Guarda caché en localStorage
   */
  _saveCache() {
    try {
      const cacheData = Array.from(this.cache.keys()).map(text => ({
        text,
        timestamp: Date.now()
      }));
      
      localStorage.setItem('alicia_tts_cache', JSON.stringify(cacheData));
    } catch (error) {
      console.warn('[TTS] Error guardando caché:', error);
    }
  }

  /**
   * Carga caché desde localStorage
   */
  _loadCache() {
    try {
      const cacheData = localStorage.getItem('alicia_tts_cache');
      
      if (cacheData) {
        const items = JSON.parse(cacheData);
        console.log(`[TTS] Cargados ${items.length} ítems de caché`);
      }
    } catch (error) {
      console.warn('[TTS] Error cargando caché:', error);
    }
  }
}

// Singleton
const tts = new TextToSpeech();
export default tts;
