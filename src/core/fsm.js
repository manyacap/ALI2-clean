
/**
 * @fileoverview Finite State Machine (FSM) para Alicia IA
 * @module fsm
 */

/**
 * Estados de la FSM
 * @enum {string}
 */
export const STATES = {
  /** Estado inicial esperando activación del usuario */
  IDLE: 'idle',
  /** Escuchando activamente la entrada del usuario */
  LISTENING: 'listening',
  /** Procesando entrada del usuario */
  PROCESSING: 'processing',
  /** Proporcionando respuesta del sistema */
  SPEAKING: 'speaking',
  /** Estado de error */
  ERROR: 'error',
  /** Esperando confirmación del usuario para una orden */
  CONFIRMING_ORDER: 'confirming_order'
};

/**
 * Eventos de la FSM
 * @enum {string}
 */
export const EVENTS = {
  /** Usuario activa el asistente */
  USER_ACTIVATE: 'user_activate',
  /** Usuario proporciona entrada */
  USER_INPUT: 'user_input',
  /** Usuario cancela acción */
  USER_CANCEL: 'user_cancel',
  /** Ocurrió un timeout */
  TIMEOUT: 'timeout',
  /** Respuesta lista para ser entregada */
  RESPONSE_READY: 'response_ready',
  /** Ocurrió un error durante el procesamiento */
  PROCESSING_ERROR: 'processing_error',
  /** Sistema necesita confirmación del usuario */
  NEEDS_CONFIRMATION: 'needs_confirmation',
  /** Sistema ha terminado de hablar */
  SPEAKING_COMPLETE: 'speaking_complete',
  /** Error ha sido reconocido */
  ERROR_ACKNOWLEDGED: 'error_acknowledged',
  /** Usuario confirma acción */
  USER_CONFIRMS: 'user_confirms',
  /** Usuario cancela confirmación */
  USER_CANCELS: 'user_cancels'
};

/**
 * Transiciones válidas entre estados
 * @type {Object<string, Object<string, string>>}
 */
const TRANSITIONS = {
  [STATES.IDLE]: {
    [EVENTS.USER_ACTIVATE]: STATES.LISTENING
  },
  [STATES.LISTENING]: {
    [EVENTS.USER_INPUT]: STATES.PROCESSING,
    [EVENTS.USER_CANCEL]: STATES.IDLE,
    [EVENTS.TIMEOUT]: STATES.IDLE
  },
  [STATES.PROCESSING]: {
    [EVENTS.RESPONSE_READY]: STATES.SPEAKING,
    [EVENTS.PROCESSING_ERROR]: STATES.ERROR,
    [EVENTS.NEEDS_CONFIRMATION]: STATES.CONFIRMING_ORDER
  },
  [STATES.SPEAKING]: {
    [EVENTS.SPEAKING_COMPLETE]: STATES.IDLE
  },
  [STATES.ERROR]: {
    [EVENTS.ERROR_ACKNOWLEDGED]: STATES.IDLE
  },
  [STATES.CONFIRMING_ORDER]: {
    [EVENTS.USER_CONFIRMS]: STATES.PROCESSING,
    [EVENTS.USER_CANCELS]: STATES.IDLE
  }
};

/**
 * Error de transición de la FSM
 */
class TransitionError extends Error {
  /**
   * @param {string} message - Mensaje de error
   * @param {string} fromState - Estado origen
   * @param {string} event - Evento de transición
   * @param {string} [toState] - Estado destino si aplica
   */
  constructor(message, fromState, event, toState = null) {
    super(message);
    this.name = 'TransitionError';
    this.fromState = fromState;
    this.event = event;
    this.toState = toState;
  }
}

/**
 * Controlador de Máquina de Estados Finitos
 */
export class FsmController {
  /**
   * Crea un nuevo controlador FSM
   */
  constructor() {
    /** @type {string} Estado actual de la FSM */
    this.currentState = STATES.IDLE;
    /** @type {Array<function(Object)>} Listeners de transición */
    this.listeners = [];
    /** @type {boolean} Indica si la FSM está inicializada */
    this.initialized = false;
    /** @type {Object} Contexto de la FSM para datos adicionales */
    this.context = {};
  }

  /**
   * Inicializa la FSM
   * @returns {Promise<void>}
   */
  async init() {
    if (this.initialized) {
      console.warn('[FSM] Ya inicializada, ignorando llamada');
      return;
    }
    
    console.debug('[FSM] Inicializada en estado:', this.currentState);
    
    // Disparar evento de inicialización
    this._notifyListeners({
      type: 'fsm-initialized',
      state: this.currentState,
      timestamp: Date.now()
    });
    
    this.initialized = true;
    return Promise.resolve();
  }

  /**
   * Transiciona a un nuevo estado basado en un evento
   * @param {string} event - Evento que desencadena la transición
   * @returns {Promise<boolean>} - True si la transición fue exitosa
   * @throws {TransitionError} - Si la transición es inválida
   */
  async transition(event) {
    if (!this.initialized) {
      throw new TransitionError(
        'FSM no inicializada. Llame a init() primero.',
        this.currentState, 
        event
      );
    }
    
    // Verificar si el evento es válido para el estado actual
    if (!TRANSITIONS[this.currentState] || !TRANSITIONS[this.currentState][event]) {
      const message = `Transición inválida: ${this.currentState} -> ${event}`;
      console.error(`[FSM] ${message}`);
      
      this._notifyListeners({
        type: 'fsm-error',
        error: 'invalid-transition',
        fromState: this.currentState,
        event: event,
        message: message,
        timestamp: Date.now()
      });
      
      throw new TransitionError(message, this.currentState, event);
    }

    const nextState = TRANSITIONS[this.currentState][event];
    
    // Verificar invariante: no se puede transicionar al mismo estado
    if (nextState === this.currentState) {
      const message = `No se puede transicionar al mismo estado: ${this.currentState}`;
      console.error(`[FSM] ${message}`);
      
      this._notifyListeners({
        type: 'fsm-error',
        error: 'same-state-transition',
        fromState: this.currentState,
        event: event,
        toState: nextState,
        message: message,
        timestamp: Date.now()
      });
      
      throw new TransitionError(message, this.currentState, event, nextState);
    }

    // Ejecutar verificación de pre-condiciones
    await this._checkPreConditions(this.currentState, event, nextState);

    // Notificar inicio de transición
    this._notifyListeners({
      type: 'fsm-transition-start',
      fromState: this.currentState,
      event: event,
      toState: nextState,
      timestamp: Date.now()
    });
    
    // Realizar la transición
    const previousState = this.currentState;
    this.currentState = nextState;
    
    console.debug(`[FSM] Transición: ${previousState} --${event}--> ${nextState}`);
    
    // Notificar fin de transición
    this._notifyListeners({
      type: 'fsm-transition-complete',
      fromState: previousState,
      event: event,
      toState: nextState,
      timestamp: Date.now()
    });
    
    // Ejecutar verificación de post-condiciones
    await this._checkPostConditions(previousState, event, nextState);
    
    return true;
  }

  /**
   * Obtiene el estado actual de la FSM
   * @returns {string} - Estado actual
   */
  getState() {
    return this.currentState;
  }

  /**
   * Verifica pre-condiciones para una transición
   * @private
   * @param {string} fromState - Estado origen
   * @param {string} event - Evento de transición
   * @param {string} toState - Estado destino
   * @returns {Promise<void>}
   * @throws {TransitionError} - Si no se cumplen las pre-condiciones
   */
  async _checkPreConditions(fromState, event, toState) {
    // Pre-condición básica: el evento debe ser válido para el estado actual
    if (!TRANSITIONS[fromState] || !TRANSITIONS[fromState][event]) {
      throw new TransitionError(
        `Pre-condición fallida: evento ${event} no es válido para el estado ${fromState}`,
        fromState,
        event
      );
    }
    
    // Pre-condiciones específicas por transición
    switch (event) {
      case EVENTS.USER_INPUT:
        // Verificar que exista entrada del usuario en el contexto
        if (!this.context.userInput) {
          throw new TransitionError(
            `Pre-condición fallida: no hay entrada de usuario para evento ${event}`,
            fromState,
            event,
            toState
          );
        }
        break;
        
      case EVENTS.RESPONSE_READY:
        // Verificar que exista una respuesta en el contexto
        if (!this.context.response) {
          throw new TransitionError(
            `Pre-condición fallida: no hay respuesta para evento ${event}`,
            fromState,
            event,
            toState
          );
        }
        break;
        
      // Agregar más verificaciones específicas según sea necesario
    }
  }

  /**
   * Verifica post-condiciones para una transición
   * @private
   * @param {string} fromState - Estado origen
   * @param {string} event - Evento de transición
   * @param {string} toState - Estado destino
   * @returns {Promise<void>}
   * @throws {TransitionError} - Si no se cumplen las post-condiciones
   */
  async _checkPostConditions(fromState, event, toState) {
    // Post-condición básica: el nuevo estado debe ser diferente del anterior
    if (fromState === toState) {
      throw new TransitionError(
        `Post-condición fallida: la transición resultó en el mismo estado ${toState}`,
        fromState,
        event,
        toState
      );
    }
    
    // Post-condiciones específicas por transición
    switch (toState) {
      case STATES.LISTENING:
        // Verificar que el sistema esté listo para escuchar
        if (this.context.isListening === false) {
          throw new TransitionError(
            `Post-condición fallida: sistema no está listo para escuchar`,
            fromState,
            event,
            toState
          );
        }
        break;
        
      case STATES.SPEAKING:
        // Verificar que el sistema tenga algo que decir
        if (!this.context.response) {
          throw new TransitionError(
            `Post-condición fallida: no hay respuesta para hablar`,
            fromState,
            event,
            toState
          );
        }
        break;
        
      // Agregar más verificaciones específicas según sea necesario
    }
  }

  /**
   * Agrega un listener de transición
   * @param {function(Object)} listener - Función listener
   * @returns {function()} - Función para eliminar el listener
   */
  addListener(listener) {
    if (typeof listener !== 'function') {
      throw new Error('[FSM] El listener debe ser una función');
    }
    
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  /**
   * Notifica a todos los listeners de una transición
   * @private
   * @param {Object} event - Evento de transición
   */
  _notifyListeners(event) {
    for (const listener of this.listeners) {
      try {
        listener(event);
      } catch (e) {
        console.error('[FSM] Error en listener de transición:', e);
      }
    }
  }
  
  /**
   * Establece contexto para la FSM
   * @param {Object} contextData - Datos de contexto
   */
  setContext(contextData) {
    this.context = {...this.context, ...contextData};
  }
  
  /**
   * Limpia el contexto de la FSM
   */
  clearContext() {
    this.context = {};
  }
}

// Exportar una instancia por defecto para conveniencia
export default new FsmController();
